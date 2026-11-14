/** Family Split (Plus): shares, monthly contributions and settle-up. */
import { computeSplit, monthLabel, monthKey, money, totals, useStore, useToast } from '../store.jsx'
import { Button, Card, DemoTag, EmptyState, Field, MoneyInput, Notice, PageHeader, cx, inputCls } from '../ui.jsx'
import { PlusGate } from '../extras.jsx'

export default function Split() {
  const { state, dispatch, isPlus } = useStore()
  const { toast } = useToast()
  if (!isPlus) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          eyebrow={state.mode === 'demo' && <DemoTag />}
          title="Family Split"
          subtitle="Share care costs fairly with your siblings and see exactly who owes whom."
        />
        <PlusGate
          icon="👨‍👩‍👧"
          title="Family Split is a Plus feature"
          bullets={[
            'Set each person’s share (or split equally)',
            'Track what everyone paid this month',
            'Automatic settle-up: who sends how much to whom',
            'Printable family summary to share',
          ]}
        >
          Money is the number-one source of sibling friction in caregiving. Plus turns it into a simple monthly routine.
        </PlusGate>
      </div>
    )
  }

  const { monthlySpending } = totals(state)
  const people = state.split.people
  const calc = computeSplit(people, monthlySpending)
  const newMonth = state.split.month !== monthKey(0)
  const upd = (id, patch) => dispatch({ type: 'person-update', id, patch })

  const equal = () => {
    const n = people.length
    const base = Math.floor((100 / n) * 100) / 100
    const rest = Math.round((100 - base * n) * 100) / 100
    dispatch({
      type: 'split-set-people',
      people: people.map((p, i) => ({ ...p, pct: i === 0 ? Math.round((base + rest) * 100) / 100 : base })),
    })
    toast('Split equally.')
  }
  const normalize = () => {
    if (calc.pctSum <= 0) return equal()
    dispatch({
      type: 'split-set-people',
      people: people.map((p) => ({ ...p, pct: Math.round(((Number(p.pct) || 0) / calc.pctSum) * 10000) / 100 })),
    })
    toast('Shares adjusted to total 100%.')
  }
  const pctOk = Math.abs(calc.pctSum - 100) < 0.01

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={state.mode === 'demo' && <DemoTag />}
        title="Family Split"
        subtitle={`Splitting ${money(monthlySpending)} of estimated monthly care spending. Change expenses to update this automatically.`}
        actions={
          <a
            href="#/summary"
            className="inline-flex min-h-12 items-center rounded-xl border border-silver-300 bg-white px-4 font-semibold text-brand-800 hover:bg-brand-50"
          >
            🖨️ Printable summary
          </a>
        }
      />

      {newMonth && (
        <Notice tone="info" className="mb-4" title={`It’s ${monthLabel(monthKey(0))}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span>Contributions below are from {monthLabel(state.split.month)}.</span>
            <Button size="sm" onClick={() => (dispatch({ type: 'split-new-month' }), toast('Started a new month.'))}>
              Start new month
            </Button>
          </div>
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Who’s sharing</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={equal}>
                Split equally
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => (people.length < 6 ? dispatch({ type: 'person-add' }) : toast('Up to 6 people.', { tone: 'danger' }))}
              >
                + Add person
              </Button>
            </div>
          </div>
          <ul className="space-y-3">
            {people.map((p) => {
              const r = calc.rows.find((x) => x.id === p.id)
              return (
                <li key={p.id} className="rounded-xl border border-silver-200 p-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_5.5rem_7rem_auto] sm:items-end">
                    <Field label="First name" className="col-span-2 sm:col-span-1" error={!p.name.trim() ? 'Add a name.' : ''}>
                      {(f) => (
                        <input
                          {...f}
                          className={inputCls}
                          value={p.name}
                          maxLength={40}
                          onChange={(e) => upd(p.id, { name: e.target.value })}
                        />
                      )}
                    </Field>
                    <Field label="Share %">
                      {(f) => (
                        <input
                          {...f}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max="100"
                          className={inputCls}
                          value={p.pct}
                          onChange={(e) => upd(p.id, { pct: e.target.value })}
                        />
                      )}
                    </Field>
                    <Field label="Paid this month">
                      {(f) => <MoneyInput {...f} value={p.paid} onChange={(e) => upd(p.id, { paid: e.target.value })} />}
                    </Field>
                    <button
                      type="button"
                      disabled={people.length <= 1}
                      className="min-h-12 rounded-lg px-2 text-muted hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                      aria-label={`Remove ${p.name || 'person'}`}
                      onClick={() => dispatch({ type: 'person-delete', id: p.id })}
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    Fair share: <strong className="text-ink">{money(r.share)}</strong> ·{' '}
                    <span className={cx('font-semibold', r.balance < -0.005 ? 'text-red-700' : 'text-emerald-800')}>
                      {r.balance < -0.005 ? `owes ${money(-r.balance)}` : r.balance > 0.005 ? `is owed ${money(r.balance)}` : 'settled'}
                    </span>
                  </p>
                </li>
              )
            })}
          </ul>
          {!pctOk && (
            <Notice tone="warn" className="mt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span>Shares add up to {Math.round(calc.pctSum * 100) / 100}%, not 100%.</span>
                <Button size="sm" variant="secondary" onClick={normalize}>
                  Fix to 100%
                </Button>
              </div>
            </Notice>
          )}
          <p className="mt-3 text-xs text-muted">First names only, please. KinBridge doesn’t move money — it just keeps the math clear.</p>
        </Card>

        <div className="space-y-6">
          <Card className="p-5" aria-live="polite">
            <h2 className="mb-1 text-lg font-bold">Settle up · {monthLabel(state.split.month)}</h2>
            <p className="text-sm text-muted">
              {money(calc.totalPaid)} paid of {money(monthlySpending)} total.
            </p>
            {monthlySpending <= 0 ? (
              <EmptyState icon="🧾" title="No expenses to split">
                <a className="font-semibold text-brand-700 underline" href="#/expenses">
                  Add recurring expenses
                </a>{' '}
                first.
              </EmptyState>
            ) : calc.transfers.length === 0 ? (
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Everyone is settled up.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {calc.transfers.map((t, i) => (
                  <li key={i} className="rounded-xl bg-brand-50 p-3">
                    <strong>{t.from || 'Someone'}</strong> sends <strong>{money(t.amt, { cents: true })}</strong> to{' '}
                    <strong>{t.to || 'someone'}</strong>
                  </li>
                ))}
              </ul>
            )}
            {calc.totalPaid > monthlySpending + 0.5 && monthlySpending > 0 && (
              <p className="mt-3 text-sm text-accent-600">
                Contributions exceed estimated spending by {money(calc.totalPaid - monthlySpending)}.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
