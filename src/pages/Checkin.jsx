import { useState } from 'react'
import { checkinStreak, money, monthKey, monthLabel, totals, useStore, useToast } from '../store.jsx'
import { Badge, Button, Card, DemoTag, Field, MoneyInput, PageHeader, cx, inputCls } from '../ui.jsx'
import { PlusGate } from '../extras.jsx'

export default function Checkin() {
  const { state, dispatch, isPlus } = useStore()
  const { toast } = useToast()
  const key = monthKey(0)
  const existing = state.checkins[key]
  const { monthlySpending } = totals(state)
  const [actual, setActual] = useState(existing?.actual ?? '')
  const [note, setNote] = useState(existing?.note ?? '')
  const [err, setErr] = useState('')
  const streak = checkinStreak(state.checkins)
  const planned = existing?.planned ?? monthlySpending
  const a = Number(actual)
  const diff = actual === '' ? null : a - monthlySpending

  const save = (e) => {
    e.preventDefault()
    if (actual === '' || !Number.isFinite(a) || a < 0) return setErr('Enter what you actually spent this month so far.')
    if (a > 1000000) return setErr('That looks too large.')
    setErr('')
    dispatch({ type: 'checkin', key, entry: { planned: Math.round(monthlySpending * 100) / 100, actual: a, note: note.trim(), at: Date.now() } })
    toast(existing ? 'Check-in updated.' : 'Check-in saved. See you next month!')
  }

  const history = Object.entries(state.checkins).sort((x, y) => y[0].localeCompare(x[0]))
  const maxVal = Math.max(1, ...history.map(([, v]) => Math.max(v.planned, v.actual)))

  return (
    <div className="animate-fade-in">
      <PageHeader eyebrow={state.mode === 'demo' && <DemoTag />} title="Monthly check-in" subtitle="Two minutes a month: compare what you planned with what you actually spent, and keep a record the whole family can trust." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className="h-fit p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{monthLabel(key)}</h2>
            {existing ? <Badge tone="success">✓ Logged</Badge> : <Badge tone="warn">Due</Badge>}
          </div>
          <p className="mb-4 text-sm text-muted">
            Planned spending from your expenses: <strong className="text-ink">{money(monthlySpending)}</strong>
          </p>
          <form onSubmit={save} noValidate className="space-y-4">
            <Field label="Actually spent so far this month" error={err}>
              {(p) => <MoneyInput {...p} value={actual} onChange={(e) => (setActual(e.target.value), setErr(''))} />}
            </Field>
            <Field label="Note (optional)" hint="e.g. extra pharmacy copay, one-time repair">
              {(p) => <input {...p} className={inputCls} value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} />}
            </Field>
            {diff !== null && Number.isFinite(diff) && (
              <p className={cx('rounded-xl p-3 text-sm font-semibold', diff > 0.5 ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900')} role="status">
                {Math.abs(diff) < 0.5 ? 'Right on plan.' : diff > 0 ? `${money(diff)} over your plan.` : `${money(-diff)} under your plan.`}
              </p>
            )}
            <Button type="submit" className="w-full">
              {existing ? 'Update check-in' : 'Save check-in'}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-silver-50 p-3">
                <div className="text-2xl font-bold">{streak}</div>
                <div className="text-xs text-muted">month streak</div>
              </div>
              <div className="rounded-xl bg-silver-50 p-3">
                <div className="text-2xl font-bold">{history.length}</div>
                <div className="text-xs text-muted">check-ins logged</div>
              </div>
              <div className="rounded-xl bg-silver-50 p-3">
                <div className="text-2xl font-bold">{existing ? 'Done' : 'Due'}</div>
                <div className="text-xs text-muted">this month</div>
              </div>
            </div>
          </Card>

          {isPlus ? (
            <Card className="p-5">
              <h2 className="mb-3 text-lg font-bold">History</h2>
              {history.length === 0 ? (
                <p className="text-muted">Your check-ins will appear here.</p>
              ) : (
                <ul className="space-y-4">
                  {history.map(([k, v]) => (
                    <li key={k}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-semibold">{monthLabel(k)}</span>
                        <span className={cx('font-semibold', v.actual > v.planned + 0.5 ? 'text-amber-800' : 'text-emerald-800')}>
                          {v.actual > v.planned + 0.5 ? `+${money(v.actual - v.planned)}` : v.actual < v.planned - 0.5 ? `−${money(v.planned - v.actual)}` : 'on plan'}
                        </span>
                      </div>
                      <div className="space-y-1" aria-label={`${monthLabel(k)}: planned ${money(v.planned)}, actual ${money(v.actual)}`}>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-14 text-muted">Planned</span>
                          <div className="h-3 flex-1 rounded bg-silver-100">
                            <div className="h-3 rounded bg-silver-300" style={{ width: `${(v.planned / maxVal) * 100}%` }} />
                          </div>
                          <span className="w-16 text-right font-semibold">{money(v.planned)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-14 text-muted">Actual</span>
                          <div className="h-3 flex-1 rounded bg-silver-100">
                            <div className="h-3 rounded bg-brand-700" style={{ width: `${(v.actual / maxVal) * 100}%` }} />
                          </div>
                          <span className="w-16 text-right font-semibold">{money(v.actual)}</span>
                        </div>
                      </div>
                      {v.note && <p className="mt-1 text-sm text-muted">“{v.note}”</p>}
                    </li>
                  ))}
                </ul>
              )}
              {state.mode === 'demo' && <p className="mt-3 text-xs text-muted">Earlier months are fictional demo entries.</p>}
            </Card>
          ) : (
            <PlusGate icon="📈" title="Unlock your check-in history" bullets={['See planned vs. actual for every month', 'Spot months that ran over and why', 'Keep a record for siblings and tax time']}>
              Free includes this month’s check-in and your streak. Plus keeps the full history.
            </PlusGate>
          )}
        </div>
      </div>
    </div>
  )
}
