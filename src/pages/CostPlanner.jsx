/** Cost Planner: compares two care options (hourly rate + visit minimum) against the monthly budget. */
import { WEEKS_PER_MONTH, computeOption, monthlyEquivalent, money, totals, useStore, useToast } from '../store.jsx'
import { Button, Card, DemoTag, Field, MoneyInput, Notice, PageHeader, Toggle, cx, inputCls } from '../ui.jsx'

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

function OptionEditor({ k, title }) {
  const { state, dispatch } = useStore()
  const o = state.planner[k]
  const set = (patch) => dispatch({ type: 'planner-option', key: k, patch })
  const rateErr =
    o.rate !== '' && num(o.rate) < 0
      ? 'Rate can’t be negative.'
      : num(o.rate) > 500
        ? 'That rate looks unusually high — please double-check.'
        : ''
  const minErr = o.minHours !== '' && (num(o.minHours) < 0 || num(o.minHours) > 24) ? 'Enter 0–24 hours.' : ''
  return (
    <fieldset className="rounded-xl border border-silver-200 p-4">
      <legend className="px-1 text-sm font-bold">{title}</legend>
      <div className="space-y-3">
        <Field label="Name">
          {(p) => <input {...p} className={inputCls} value={o.label} maxLength={40} onChange={(e) => set({ label: e.target.value })} />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hourly rate" error={rateErr}>
            {(p) => <MoneyInput {...p} value={o.rate} onChange={(e) => set({ rate: e.target.value })} />}
          </Field>
          <Field label="Min. hours / visit" error={minErr}>
            {(p) => (
              <input
                {...p}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                className={inputCls}
                value={o.minHours}
                onChange={(e) => set({ minHours: e.target.value })}
              />
            )}
          </Field>
        </div>
      </div>
    </fieldset>
  )
}

function ResultCard({ label, res, otherMonthly, budget, highlight }) {
  if (!res) {
    return (
      <Card className="p-5">
        <p className="font-bold">{label}</p>
        <p className="mt-2 text-sm text-red-700">Fix the highlighted inputs to see an estimate.</p>
      </Card>
    )
  }
  const total = res.monthly + otherMonthly
  const left = budget - total
  const pct = budget > 0 ? Math.min(100, (total / budget) * 100) : 0
  return (
    <Card className={cx('p-5', highlight && 'ring-2 ring-brand-500')}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold break-words">{label || 'Unnamed option'}</p>
        {highlight && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">Lower estimate</span>}
      </div>
      <p className="mt-3 text-sm text-muted">Estimated in-home care / month</p>
      <p className="text-3xl font-bold">{money(res.monthly)}</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Billable hours / week</dt>
          <dd className="font-semibold">{res.billableWeekly.toFixed(1)}</dd>
        </div>
        {res.minimumAdds > 0.01 && (
          <div className="flex justify-between gap-2 text-accent-600">
            <dt>Extra hours from visit minimum</dt>
            <dd className="font-semibold">+{res.minimumAdds.toFixed(1)} /wk</dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Weekly care cost</dt>
          <dd className="font-semibold">{money(res.weekly)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Other recurring expenses</dt>
          <dd className="font-semibold">{money(otherMonthly)}</dd>
        </div>
        <div className="flex justify-between gap-2 border-t border-silver-200 pt-1.5">
          <dt className="font-semibold">Total / month</dt>
          <dd className="font-bold">{money(total)}</dd>
        </div>
      </dl>
      {budget > 0 && (
        <div className="mt-4">
          <div
            className="h-2.5 overflow-hidden rounded-full bg-silver-100"
            role="progressbar"
            aria-label={`${label} share of budget`}
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={cx('h-full rounded-full', left < 0 ? 'bg-red-600' : 'bg-brand-500')} style={{ width: `${pct}%` }} />
          </div>
          <p className={cx('mt-1.5 text-sm font-semibold', left < 0 ? 'text-red-700' : 'text-brand-800')}>
            {left < 0 ? `${money(-left)} over budget` : `${money(left)} left in budget`}
          </p>
        </div>
      )}
    </Card>
  )
}

export default function CostPlanner() {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const pl = state.planner
  const { budget } = totals(state)
  const set = (patch) => dispatch({ type: 'planner', patch })

  // "Other" expenses exclude in-home care, since the planner models that line itself.
  const otherAll = state.expenses
    .filter((e) => e.category !== 'In-home care')
    .reduce((s, e) => s + monthlyEquivalent(e.amount, e.frequency), 0)
  const otherMonthly = pl.includeOtherExpenses ? otherAll : 0

  const hrsErr =
    pl.hoursPerWeek === ''
      ? 'Enter hours per week.'
      : num(pl.hoursPerWeek) < 0 || num(pl.hoursPerWeek) > 168
        ? 'Enter between 0 and 168.'
        : ''
  const visitsErr =
    pl.visitsPerWeek === ''
      ? 'Enter visits per week.'
      : num(pl.visitsPerWeek) < 0 || num(pl.visitsPerWeek) > 21
        ? 'Enter between 0 and 21.'
        : num(pl.hoursPerWeek) > 0 && num(pl.visitsPerWeek) < 1
          ? 'Need at least 1 visit for these hours.'
          : ''
  const valid = !hrsErr && !visitsErr

  const a = valid ? computeOption(pl.optionA, pl.hoursPerWeek, pl.visitsPerWeek) : null
  const b = valid ? computeOption(pl.optionB, pl.hoursPerWeek, pl.visitsPerWeek) : null
  const diff = a && b ? a.monthly - b.monthly : null

  const affordable = (o) => {
    const r = num(o.rate)
    const room = budget - otherMonthly
    if (!(r > 0) || budget <= 0) return null
    return Math.max(0, room / (r * WEEKS_PER_MONTH))
  }

  const swap = () => {
    set({ optionA: pl.optionB, optionB: pl.optionA })
    toast('Options swapped.')
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={state.mode === 'demo' && <DemoTag />}
        title="Cost Planner"
        subtitle="Compare two care options using the rates and hours you enter. Every number here is an estimate based only on your inputs."
      />

      <Card className="mb-6 border-brand-100 bg-brand-50/70 p-5">
        <h2 className="font-bold text-brand-900">What does this page do?</h2>
        <p className="mt-1">
          It answers one question:{' '}
          <strong>
            “If my parent needs this many hours of paid help each week, what will it cost per month — and does it fit our budget?”
          </strong>{' '}
          Put two options side by side, such as two home-care agencies, and see which is cheaper and what’s left of your budget.
        </p>
        <ol className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <li className="rounded-xl bg-white p-3">
            <span className="font-bold text-brand-700">1. Enter the need.</span> Hours of help per week, and how many visits those hours are
            split into.
          </li>
          <li className="rounded-xl bg-white p-3">
            <span className="font-bold text-brand-700">2. Enter two options.</span> Each agency’s hourly rate and its minimum hours per
            visit (ask them — a minimum can raise the bill).
          </li>
          <li className="rounded-xl bg-white p-3">
            <span className="font-bold text-brand-700">3. Read the result.</span> Estimated monthly cost, the difference between options,
            and your budget left.
          </li>
        </ol>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,400px)_1fr]">
        <Card className="h-fit p-5">
          <h2 className="mb-4 text-lg font-bold">Your inputs</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Care hours / week" error={hrsErr}>
                {(p) => (
                  <input
                    {...p}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    className={inputCls}
                    value={pl.hoursPerWeek}
                    onChange={(e) => set({ hoursPerWeek: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Visits / week" error={visitsErr}>
                {(p) => (
                  <input
                    {...p}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    className={inputCls}
                    value={pl.visitsPerWeek}
                    onChange={(e) => set({ visitsPerWeek: e.target.value })}
                  />
                )}
              </Field>
            </div>
            {Number(state.profile.careHoursPerWeek) > 0 && Number(state.profile.careHoursPerWeek) !== num(pl.hoursPerWeek) && (
              <Button variant="ghost" size="sm" onClick={() => set({ hoursPerWeek: state.profile.careHoursPerWeek })}>
                Use household need: {state.profile.careHoursPerWeek} hrs/week
              </Button>
            )}
            <OptionEditor k="optionA" title="Option A" />
            <OptionEditor k="optionB" title="Option B" />
            <Button variant="secondary" size="sm" onClick={swap}>
              ⇅ Swap A and B
            </Button>
            <Toggle
              checked={pl.includeOtherExpenses}
              onChange={(v) => set({ includeOtherExpenses: v })}
              label="Include my other recurring expenses"
              description={`${money(otherAll)}/month from Recurring Expenses, excluding in-home care lines.`}
            />
            <p className="text-sm text-muted">
              Monthly budget: <span className="font-semibold text-ink">{budget > 0 ? money(budget) : 'not set'}</span> — change it from the
              Dashboard.
            </p>
          </div>
        </Card>

        <div className="space-y-4" aria-live="polite">
          {!valid && <Notice tone="danger">Fix the highlighted inputs to update the estimates.</Notice>}
          <div className="grid gap-4 md:grid-cols-2">
            <ResultCard
              label={pl.optionA.label}
              res={a}
              otherMonthly={otherMonthly}
              budget={budget}
              highlight={diff !== null && diff < -0.5}
            />
            <ResultCard
              label={pl.optionB.label}
              res={b}
              otherMonthly={otherMonthly}
              budget={budget}
              highlight={diff !== null && diff > 0.5}
            />
          </div>

          {diff !== null && (
            <Card className="p-5">
              <h2 className="font-bold">Estimated difference</h2>
              {Math.abs(diff) < 0.5 ? (
                <p className="mt-1 text-muted">Based on your inputs, both options come out about the same each month.</p>
              ) : (
                <p className="mt-1">
                  Based on your inputs, <strong>{diff > 0 ? pl.optionB.label || 'Option B' : pl.optionA.label || 'Option A'}</strong> is an
                  estimated <strong className="text-brand-800">{money(Math.abs(diff))}/month</strong> lower ({money(Math.abs(diff) * 12)}
                  /year).
                </p>
              )}
              <p className="mt-2 text-sm text-muted">
                This is a potential difference calculated from rates you entered — not a quote and not savings achieved. Actual costs depend
                on the provider’s current rates, fees, and schedule.
              </p>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="font-bold">What your budget could cover</h2>
            {budget <= 0 ? (
              <p className="mt-1 text-muted">Set a monthly budget on the Dashboard to see this.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {[pl.optionA, pl.optionB].map((o, i) => {
                  const h = affordable(o)
                  return (
                    <li key={i} className="flex flex-wrap justify-between gap-2 rounded-xl bg-silver-50 p-3">
                      <span className="font-semibold">{o.label || `Option ${i ? 'B' : 'A'}`}</span>
                      <span>{h === null ? 'Enter a rate' : `about ${h.toFixed(1)} hours/week`}</span>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="mt-2 text-sm text-muted">
              Remaining budget after other expenses ÷ (hourly rate × {WEEKS_PER_MONTH.toFixed(2)} weeks/month). Visit minimums may lower
              this.
            </p>
          </Card>

          <Card className="p-5 text-sm text-muted">
            <h2 className="mb-1 font-bold text-ink">How we calculate</h2>
            <p>
              Hours per visit = weekly hours ÷ visits. If that’s below a provider’s visit minimum, we bill the minimum. Monthly cost =
              billable weekly hours × hourly rate × 52 ÷ 12. Demo rates are fictional and do not represent current market averages.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
