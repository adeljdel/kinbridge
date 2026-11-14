import { useEffect, useRef, useState } from 'react'
import { FREE_MED_LIMIT, PLUS_MED_LIMIT, PLUS_MONTHLY, PLUS_YEARLY, yearlyPerMonth, yearlySavingsPct } from '../data.js'
import { money, useStore, useToast } from '../store.jsx'
import { Badge, Button, Card, Modal, Notice, PageHeader, Spinner, cx } from '../ui.jsx'

const FREE = ['Recurring expense tracker with live monthly totals', 'Cost Planner: compare two care options against your budget', `Pharmacy price finder (up to ${FREE_MED_LIMIT} items)`, 'Follow-up tasks with calendar export', 'This month’s check-in and streak']
const PLUS = ['Everything in Free', 'Family Split: shares, contributions and settle-up', 'Full monthly check-in history', 'Printable family summary (save as PDF)', `Pharmacy finder for up to ${PLUS_MED_LIMIT} items`]

export default function Pricing({ onStart }) {
  const { state, dispatch, isPlus } = useStore()
  const { toast } = useToast()
  const [billing, setBilling] = useState('yearly')
  const [checkout, setCheckout] = useState(false)
  const [phase, setPhase] = useState('review') // review | processing | done
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const current = state?.plan

  const openCheckout = () => {
    if (!state) return onStart?.('demo')
    setPhase('review')
    setCheckout(true)
  }
  const pay = () => {
    setPhase('processing')
    timer.current = setTimeout(() => {
      dispatch({ type: 'plan', plan: { tier: 'plus', billing, since: Date.now() } })
      setPhase('done')
    }, 1200)
  }
  const price = billing === 'yearly' ? PLUS_YEARLY : PLUS_MONTHLY

  return (
    <div className="animate-fade-in">
      <PageHeader title="Simple pricing for family caregivers" subtitle="Start free. Upgrade when you want to share costs with siblings and keep a full record." />

      <div className="mb-6 flex justify-center">
        <div role="group" aria-label="Billing period" className="inline-flex rounded-xl border border-silver-300 bg-white p-1">
          {[['monthly', 'Monthly'], ['yearly', `Yearly · save ${yearlySavingsPct}%`]].map(([v, l]) => (
            <button key={v} type="button" aria-pressed={billing === v} onClick={() => setBilling(v)} className={cx('min-h-11 rounded-lg px-4 text-sm font-semibold', billing === v ? 'bg-brand-700 text-white' : 'text-ink hover:bg-brand-50')}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-bold">Free</h2>
          <p className="mt-1 text-4xl font-extrabold">$0</p>
          <p className="text-sm text-muted">Always free</p>
          <ul className="mt-5 space-y-2 text-sm">{FREE.map((f) => <li key={f} className="flex gap-2"><span className="text-emerald-700" aria-hidden="true">✓</span>{f}</li>)}</ul>
          <div className="mt-6">
            {state ? <Badge tone={isPlus ? 'neutral' : 'success'}>{isPlus ? 'Included in Plus' : 'Your current plan'}</Badge> : <Button variant="secondary" className="w-full" onClick={() => onStart?.('demo')}>🚀 Try Demo Mode</Button>}
          </div>
        </Card>

        <Card className="relative border-2 border-brand-500 p-6">
          <span className="absolute -top-3 right-5 rounded-full bg-brand-700 px-3 py-0.5 text-xs font-bold text-white">{billing === 'yearly' ? `Best value · ${yearlySavingsPct}% off` : 'Flexible'}</span>
          <h2 className="text-xl font-bold">Plus</h2>
          <p className="mt-1 text-4xl font-extrabold">
            {billing === 'yearly' ? money(PLUS_YEARLY) : money(PLUS_MONTHLY, { cents: true })}
            <span className="text-base font-medium text-muted"> / {billing === 'yearly' ? 'year' : 'month'}</span>
          </p>
          <p className="text-sm text-muted">{billing === 'yearly' ? `Just ${money(yearlyPerMonth, { cents: true })}/month — vs ${money(PLUS_MONTHLY * 12, { cents: true })} paying monthly` : `Or ${money(PLUS_YEARLY)}/year (${money(yearlyPerMonth, { cents: true })}/mo) — save ${yearlySavingsPct}%`}</p>
          <ul className="mt-5 space-y-2 text-sm">{PLUS.map((f) => <li key={f} className="flex gap-2"><span className="text-emerald-700" aria-hidden="true">✓</span>{f}</li>)}</ul>
          <div className="mt-6">
            {isPlus ? (
              <div className="space-y-2">
                <Badge tone="success">✓ You’re on Plus ({current.billing === 'yearly' ? 'yearly' : 'monthly'})</Badge>
                <div className="flex flex-wrap gap-2">
                  {current.billing !== billing && <Button size="sm" onClick={() => (dispatch({ type: 'plan', plan: { ...current, billing } }), toast(`Switched to ${billing} billing (demo).`))}>Switch to {billing}</Button>}
                  <Button size="sm" variant="secondary" onClick={() => (dispatch({ type: 'plan', plan: { tier: 'free', billing: null, since: null } }), toast('Plan cancelled (demo). Back to Free.'))}>Cancel Plus (demo)</Button>
                </div>
              </div>
            ) : (
              <Button className="w-full" onClick={openCheckout}>{state ? `Get Plus — ${billing === 'yearly' ? money(PLUS_YEARLY) + '/yr' : money(PLUS_MONTHLY, { cents: true }) + '/mo'}` : '🚀 Try the demo first'}</Button>
            )}
          </div>
        </Card>
      </div>

      <Card className="mx-auto mt-8 max-w-4xl p-6">
        <h2 className="text-lg font-bold">Why this price?</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li>Our users are working adults (25–45) paying for a parent’s care out of their own pocket, so we price like a personal-finance app, not an enterprise tool. Budgeting apps commonly run about $5–$15 per month.</li>
          <li>Families pay for Plus, not care providers, so KinBridge stays on the family’s side.</li>
          <li>The yearly plan costs {yearlySavingsPct}% less per month because caregiving is a long-term job; a year of check-ins is where the value builds.</li>
          <li>These are placeholder prices for the prototype and will be tested with real caregivers.</li>
        </ul>
      </Card>

      <Modal
        open={checkout}
        onClose={() => phase !== 'processing' && setCheckout(false)}
        title={phase === 'done' ? 'Welcome to Plus!' : 'Demo checkout'}
        footer={
          phase === 'done' ? (
            <Button onClick={() => (setCheckout(false), (window.location.hash = '/split'))}>Open Family Split →</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setCheckout(false)} disabled={phase === 'processing'}>Cancel</Button>
              <Button onClick={pay} disabled={phase === 'processing'}>{phase === 'processing' ? <Spinner label="Processing…" /> : `Complete demo checkout · ${money(price, { cents: billing === 'monthly' })}`}</Button>
            </>
          )
        }
      >
        {phase === 'done' ? (
          <div className="text-center">
            <div className="text-5xl" aria-hidden="true">🎉</div>
            <p className="mt-2 font-semibold">Plus is unlocked ({billing}).</p>
            <p className="mt-1 text-sm text-muted">This was a simulation — no card was used and nothing was charged. You can cancel anytime on this page.</p>
          </div>
        ) : (
          <>
            <Notice tone="warn" title="Test mode — nothing is charged">This prototype has no payment processor. We don’t collect card details.</Notice>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Plan</dt><dd className="font-semibold">KinBridge Plus · {billing}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Price</dt><dd className="font-semibold">{money(price, { cents: billing === 'monthly' })} / {billing === 'yearly' ? 'year' : 'month'}</dd></div>
              <div className="flex justify-between border-t border-silver-200 pt-2"><dt className="font-semibold">Due today (demo)</dt><dd className="font-bold">$0.00</dd></div>
            </dl>
            <p className="mt-4 rounded-xl bg-silver-50 p-3 text-sm">In a live version this step would use Stripe test cards (e.g. 4242 4242 4242 4242). Here, just press the button.</p>
          </>
        )}
      </Modal>
    </div>
  )
}
