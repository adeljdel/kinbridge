import { useState } from 'react'
import { checkinStreak, money, monthKey, monthLabel, pharmacyResults, totals, useStore, useToast } from '../store.jsx'
import { locLabel } from '../data.js'
import { Button, Card, DemoTag, Field, Modal, MoneyInput, PageHeader, cx, inputCls } from '../ui.jsx'
import { LocationPicker } from '../extras.jsx'
import { TaskList } from './Tasks.jsx'

function ProfileModal({ open, onClose }) {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const [form, setForm] = useState(state.profile)
  const [errors, setErrors] = useState({})
  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setWasOpen(true)
    setForm(state.profile)
    setErrors({})
  }
  if (!open && wasOpen) setWasOpen(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const save = (e) => {
    e.preventDefault()
    const errs = {}
    const budget = Number(form.monthlyBudget)
    if (form.monthlyBudget === '' || !Number.isFinite(budget) || budget < 0) errs.monthlyBudget = 'Enter a budget of $0 or more.'
    else if (budget > 1000000) errs.monthlyBudget = 'That looks too large — please check the number.'
    const hrs = Number(form.careHoursPerWeek)
    if (!Number.isFinite(hrs) || hrs < 0 || hrs > 168) errs.careHoursPerWeek = 'Enter between 0 and 168 hours.'
    const age = form.caregiverAge === '' ? '' : Number(form.caregiverAge)
    if (age !== '' && (!Number.isFinite(age) || age < 18 || age > 110)) errs.caregiverAge = 'Enter an age between 18 and 110, or leave blank.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    dispatch({ type: 'profile', patch: { ...form, monthlyBudget: budget, careHoursPerWeek: hrs, caregiverAge: age } })
    toast('Household details saved.')
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Edit household details"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="profile-form">
            Save
          </Button>
        </>
      }
    >
      <form id="profile-form" onSubmit={save} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your first name">{(p) => <input {...p} className={inputCls} value={form.caregiverName} onChange={set('caregiverName')} maxLength={40} />}</Field>
          <Field label="Your age (optional)" error={errors.caregiverAge}>
            {(p) => <input {...p} type="number" inputMode="numeric" className={inputCls} value={form.caregiverAge} onChange={set('caregiverAge')} />}
          </Field>
          <Field label="Parent’s first name or nickname" hint="No last names needed.">
            {(p) => <input {...p} className={inputCls} value={form.parentName} onChange={set('parentName')} maxLength={40} />}
          </Field>
          <Field label="Care hours needed per week" error={errors.careHoursPerWeek}>
            {(p) => <input {...p} type="number" inputMode="decimal" min="0" className={inputCls} value={form.careHoursPerWeek} onChange={set('careHoursPerWeek')} />}
          </Field>
          <Field label="Monthly family care budget" error={errors.monthlyBudget} className="sm:col-span-2">
            {(p) => <MoneyInput {...p} value={form.monthlyBudget} onChange={set('monthlyBudget')} />}
          </Field>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Where does your parent live?</p>
          <LocationPicker value={form} onChange={(loc) => setForm((f) => ({ ...f, ...loc }))} />
        </div>
      </form>
      <p className="mt-4 text-sm text-muted">We never ask for Social Security numbers, Medicare numbers, birth dates, or medical records.</p>
    </Modal>
  )
}

function StatCard({ href, onClick, label, value, sub, tone, children }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cx(
        'group block rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md',
        tone === 'danger' ? 'border-red-200 bg-red-50' : 'border-silver-200'
      )}
    >
      <p className="flex items-center justify-between text-sm font-semibold text-muted">
        {label}
        <span className="text-brand-700 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true">
          →
        </span>
      </p>
      <p className={cx('mt-1 text-3xl font-bold', tone === 'danger' && 'text-red-700', tone === 'good' && 'text-brand-800')}>{value}</p>
      {children}
      <p className="mt-1 text-sm text-muted">{sub}</p>
    </a>
  )
}

export default function Dashboard() {
  const { state, isPlus } = useStore()
  const [editing, setEditing] = useState(false)
  const { monthlySpending, budget, remaining } = totals(state)
  const p = state.profile
  const pct = budget > 0 ? Math.min(100, (monthlySpending / budget) * 100) : 0
  const over = remaining < 0
  const openTasks = state.tasks.filter((t) => !t.done).length
  const ph = pharmacyResults(state)
  const pick = ph.best || ph.cheapest
  const thisMonth = monthKey(0)
  const checked = !!state.checkins[thisMonth]
  const streak = checkinStreak(state.checkins)

  const steps = [
    { done: budget > 0, label: 'Set your monthly care budget', href: '#/dashboard', onClick: () => setEditing(true) },
    { done: state.expenses.length > 0, label: 'Add recurring expenses', href: '#/expenses' },
    { done: state.pharmacy.meds.length > 0, label: 'Compare pharmacy prices', href: '#/pharmacy' },
    { done: state.split.people.filter((x) => x.name.trim()).length >= 2, label: 'Set up a family split', href: '#/split' },
    { done: checked, label: `Log your ${monthLabel(thisMonth)} check-in`, href: '#/checkin' },
  ]
  const doneCount = steps.filter((s) => s.done).length

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={state.mode === 'demo' && <DemoTag />}
        title={p.caregiverName ? `Hi, ${p.caregiverName}` : 'Your care dashboard'}
        subtitle={
          p.parentName
            ? `Planning costs for ${p.parentName} in ${locLabel(p)}${p.careHoursPerWeek ? ` · about ${p.careHoursPerWeek} hours/week of non-medical support` : ''}.`
            : `Add a few household details to personalize your plan. Location: ${locLabel(p)}.`
        }
        actions={
          <Button variant="secondary" onClick={() => setEditing(true)}>
            ✏️ Edit household details
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard href="#/expenses" label="Estimated monthly care spending" value={money(monthlySpending)} sub={`From ${state.expenses.length} recurring expense${state.expenses.length === 1 ? '' : 's'} · View`} />
        <StatCard href="#/planner" label="Planned budget remaining" value={`${over ? '−' : ''}${money(Math.abs(remaining))}`} tone={over ? 'danger' : 'good'} sub={budget > 0 ? `${over ? 'Over' : `${Math.round(pct)}% used of`} your ${money(budget)} budget · Open planner` : 'Set a budget · Open planner'}>
          {budget > 0 && (
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-silver-100" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Share of budget used">
              <div className={cx('h-full rounded-full', over ? 'bg-red-600' : pct > 85 ? 'bg-amber-500' : 'bg-brand-500')} style={{ width: `${pct}%` }} />
            </div>
          )}
        </StatCard>
        <StatCard
          href="#/dashboard"
          onClick={(e) => {
            e.preventDefault()
            const el = document.getElementById('tasks')
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            el?.focus({ preventScroll: true })
          }}
          label="Open follow-up tasks"
          value={openTasks}
          sub={`${state.tasks.length - openTasks} completed · Jump to tasks`}
        />
        <StatCard href="#/checkin" label="Monthly check-in" value={checked ? 'Done ✓' : 'Due'} sub={checked ? `${streak}-month streak · View` : `${monthLabel(thisMonth)} · Log it`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card className="scroll-mt-24 p-5" id="tasks" tabIndex={-1}>
            <TaskList calendar />
            <p className="mt-3 text-xs text-muted">Tip: tap 📅 on a task with a due date to add it to your phone’s calendar.</p>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Pharmacy pick for your budget</h2>
              <a href="#/pharmacy" className="flex min-h-10 items-center text-sm font-semibold text-brand-700 hover:underline">
                Open map →
              </a>
            </div>
            {!pick ? (
              <p className="text-muted">Add your monthly medications and a pharmacy budget to see a recommendation.</p>
            ) : (
              <>
                <p>
                  {ph.best ? (
                    <>
                      <strong>{pick.name}</strong> fits your {money(ph.budget)}/month pharmacy budget at about <strong>{money(pick.price)}</strong> ({pick.distance} mi, {pick.source}).
                    </>
                  ) : (
                    <>
                      No listed pharmacy fits your {money(ph.budget)} budget. Lowest is <strong>{pick.name}</strong> at about <strong>{money(pick.price)}</strong> ({money(ph.gap)} over).
                    </>
                  )}
                </p>
                <p className="mt-2 text-sm text-muted">Estimates only{state.mode === 'demo' ? ' — fictional pharmacies' : ''}. Confirm prices with the pharmacy.</p>
              </>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Setup progress</h2>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-semibold text-brand-800">
                {doneCount}/{steps.length}
              </span>
            </div>
            <ul className="space-y-1.5">
              {steps.map((s) => (
                <li key={s.label}>
                  <a href={s.href} onClick={s.onClick} className="flex min-h-12 items-center gap-3 rounded-xl border border-silver-200 px-3 hover:bg-brand-50">
                    <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold', s.done ? 'border-brand-700 bg-brand-700 text-white' : 'border-silver-300')}>{s.done ? '✓' : ''}</span>
                    <span className={cx('text-sm font-medium', s.done && 'text-muted')}>{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-lg font-bold">Shortcuts</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['#/split', '👨‍👩‍👧', 'Family Split'],
                ['#/pharmacy', '💊', 'Pharmacy Prices'],
                ['#/summary', '🖨️', 'Printable summary'],
                ['#/support', '💬', 'Get help'],
              ].map(([h, i, l]) => (
                <a key={h} href={h} className="flex min-h-14 items-center gap-2 rounded-xl border border-silver-200 px-3 text-sm font-semibold hover:bg-brand-50">
                  <span aria-hidden="true">{i}</span>
                  {l}
                </a>
              ))}
            </div>
            {!isPlus && (
              <a href="#/pricing" className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-accent-100 px-3 text-sm font-bold text-accent-600 hover:bg-amber-100">
                ⭐ Unlock Plus — from $6.58/mo billed yearly
              </a>
            )}
          </Card>
        </div>
      </div>

      <ProfileModal open={editing} onClose={() => setEditing(false)} />
    </div>
  )
}
