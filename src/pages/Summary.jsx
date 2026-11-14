/** Printable one-page family summary (Plus). Use the browser's print dialog to save as PDF. */
import { computeSplit, FREQUENCIES, monthLabel, monthKey, money, monthlyEquivalent, pharmacyResults, totals, useStore } from '../store.jsx'
import { locLabel } from '../data.js'
import { Button, Card, DemoTag, PageHeader } from '../ui.jsx'
import { PlusGate } from '../extras.jsx'

export default function Summary() {
  const { state, isPlus } = useStore()
  if (!isPlus)
    return (
      <div className="animate-fade-in">
        <PageHeader title="Printable family summary" subtitle="One page you can print or save as a PDF and share with family." />
        <PlusGate
          icon="🖨️"
          title="Printable summary is a Plus feature"
          bullets={[
            'Budget, expenses and pharmacy pick on one page',
            'Who owes whom this month',
            'Save as PDF from your browser’s print dialog',
          ]}
        >
          Share one clear page with siblings, a financial advisor, or a benefits counselor.
        </PlusGate>
      </div>
    )
  const { monthlySpending, budget, remaining } = totals(state)
  const split = computeSplit(state.split.people, monthlySpending)
  const ph = pharmacyResults(state)
  const pick = ph.best || ph.cheapest
  const p = state.profile
  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={state.mode === 'demo' && <DemoTag />}
        title="Family care summary"
        subtitle={`${monthLabel(monthKey(0))} · prepared by ${p.caregiverName || 'caregiver'} · ${locLabel(p)}`}
        actions={<Button onClick={() => window.print()}>🖨️ Print / save as PDF</Button>}
      />
      {state.mode === 'demo' && (
        <p className="mb-4 rounded-lg bg-violet-50 p-3 text-sm font-semibold text-violet-900">
          Demo data — every name, price and pharmacy below is fictional.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted">Estimated monthly spending</p>
          <p className="text-2xl font-bold">{money(monthlySpending)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Monthly budget</p>
          <p className="text-2xl font-bold">{money(budget)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">{remaining < 0 ? 'Over budget' : 'Remaining'}</p>
          <p className="text-2xl font-bold">{money(Math.abs(remaining))}</p>
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <h2 className="mb-2 font-bold">Recurring expenses</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-silver-200 text-left text-muted">
              <th className="py-1">Item</th>
              <th>How often</th>
              <th className="text-right">Per month</th>
            </tr>
          </thead>
          <tbody>
            {state.expenses.map((e) => (
              <tr key={e.id} className="border-b border-silver-100">
                <td className="py-1.5">{e.name}</td>
                <td>
                  {money(Number(e.amount), { cents: Number(e.amount) % 1 !== 0 })}{' '}
                  {FREQUENCIES.find((f) => f.value === e.frequency)?.label.toLowerCase()}
                </td>
                <td className="text-right font-semibold">{money(monthlyEquivalent(e.amount, e.frequency))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-2 font-bold">Who owes whom</h2>
          {split.transfers.length === 0 ? (
            <p className="text-muted">Everyone is settled up.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {split.transfers.map((t, i) => (
                <li key={i}>
                  {t.from} → {t.to}: <strong>{money(t.amt, { cents: true })}</strong>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted">{split.rows.map((r) => `${r.name || '—'} ${r.pct}%`).join(' · ')}</p>
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 font-bold">Pharmacy pick</h2>
          {pick ? (
            <p className="text-sm">
              {pick.name}: about <strong>{money(pick.price)}</strong>/month ({pick.source}); budget {money(ph.budget)}.
            </p>
          ) : (
            <p className="text-sm text-muted">Not set up.</p>
          )}
        </Card>
      </div>
      <p className="mt-6 text-xs text-muted">
        Prepared with KinBridge, an organizing tool. Figures are estimates from user-entered values. Not medical, legal, tax, or benefits
        advice.
      </p>
    </div>
  )
}
