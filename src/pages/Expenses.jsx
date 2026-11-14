/** Recurring expenses: any frequency is converted to a monthly amount that feeds the dashboard. */
import { useState } from 'react'
import { EXPENSE_CATEGORIES, FREQUENCIES, monthlyEquivalent, money, totals, useStore, useToast } from '../store.jsx'
import { Button, Card, DemoTag, EmptyState, Field, Modal, MoneyInput, PageHeader, cx, inputCls } from '../ui.jsx'

const blank = { name: '', category: EXPENSE_CATEGORIES[0], amount: '', frequency: 'monthly' }

function validate(f) {
  const e = {}
  if (!f.name.trim()) e.name = 'Give this expense a name.'
  const n = Number(f.amount)
  if (f.amount === '' || !Number.isFinite(n)) e.amount = 'Enter an amount.'
  else if (n < 0) e.amount = 'Amount can’t be negative.'
  else if (n > 100000) e.amount = 'That looks too large — please check the number.'
  return e
}

function ExpenseForm({ value, onChange, errors, idPrefix }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value })
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Expense name" error={errors.name} id={`${idPrefix}-name`} className="sm:col-span-2">
        {(p) => (
          <input {...p} className={inputCls} value={value.name} onChange={set('name')} maxLength={80} placeholder="e.g. Grocery delivery" />
        )}
      </Field>
      <Field label="Amount" error={errors.amount} id={`${idPrefix}-amt`}>
        {(p) => <MoneyInput {...p} value={value.amount} onChange={set('amount')} />}
      </Field>
      <Field label="How often" id={`${idPrefix}-freq`}>
        {(p) => (
          <select {...p} className={inputCls} value={value.frequency} onChange={set('frequency')}>
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Category" id={`${idPrefix}-cat`} className="sm:col-span-2">
        {(p) => (
          <select {...p} className={inputCls} value={value.category} onChange={set('category')}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        )}
      </Field>
    </div>
  )
}

export default function Expenses() {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [editing, setEditing] = useState(null)
  const [editErrors, setEditErrors] = useState({})
  const { monthlySpending, budget } = totals(state)

  const add = (e) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    dispatch({ type: 'expense-add', expense: { ...form, name: form.name.trim(), amount: Number(form.amount) } })
    setForm(blank)
    toast('Expense added.')
  }

  const saveEdit = () => {
    const errs = validate(editing)
    setEditErrors(errs)
    if (Object.keys(errs).length) return
    dispatch({ type: 'expense-update', id: editing.id, patch: { ...editing, name: editing.name.trim(), amount: Number(editing.amount) } })
    setEditing(null)
    toast('Expense updated.')
  }

  const remove = (exp) => {
    const index = state.expenses.findIndex((x) => x.id === exp.id)
    dispatch({ type: 'expense-delete', id: exp.id })
    toast('Expense deleted.', { action: { label: 'Undo', onClick: () => dispatch({ type: 'expense-restore', expense: exp, index }) } })
  }

  const byCat = EXPENSE_CATEGORIES.map((c) => ({
    c,
    total: state.expenses.filter((e) => e.category === c).reduce((s, e) => s + monthlyEquivalent(e.amount, e.frequency), 0),
  })).filter((x) => x.total > 0)

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={state.mode === 'demo' && <DemoTag />}
        title="Recurring Expenses"
        subtitle="Track care-related costs that repeat. We convert each to a monthly amount so the dashboard total stays accurate."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,380px)]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted">Estimated monthly total</p>
                <p className="text-3xl font-bold">{money(monthlySpending)}</p>
              </div>
              {budget > 0 && (
                <p className={cx('text-sm font-semibold', budget - monthlySpending < 0 ? 'text-red-700' : 'text-brand-800')}>
                  {budget - monthlySpending < 0 ? `${money(monthlySpending - budget)} over` : `${money(budget - monthlySpending)} under`}{' '}
                  your {money(budget)} budget
                </p>
              )}
            </div>
            {byCat.length > 0 && (
              <div className="mt-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-silver-100" aria-hidden="true">
                  {byCat.map((x, i) => (
                    <div
                      key={x.c}
                      style={{ width: `${(x.total / monthlySpending) * 100}%` }}
                      className={
                        [
                          'bg-brand-700',
                          'bg-brand-500',
                          'bg-brand-200',
                          'bg-amber-400',
                          'bg-violet-400',
                          'bg-emerald-400',
                          'bg-silver-300',
                        ][i % 7]
                      }
                    />
                  ))}
                </div>
                <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                  {byCat.map((x, i) => (
                    <li key={x.c} className="flex items-center gap-2">
                      <span
                        className={cx(
                          'h-3 w-3 rounded-sm',
                          [
                            'bg-brand-700',
                            'bg-brand-500',
                            'bg-brand-200',
                            'bg-amber-400',
                            'bg-violet-400',
                            'bg-emerald-400',
                            'bg-silver-300',
                          ][i % 7]
                        )}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{x.c}</span>
                      <span className="font-semibold">{money(x.total)}/mo</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {state.expenses.length === 0 ? (
            <EmptyState icon="🧾" title="No recurring expenses yet">
              Add things like in-home care visits, pharmacy copays, a medical alert subscription, or grocery delivery.
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {state.expenses.map((e) => {
                const freq = FREQUENCIES.find((f) => f.value === e.frequency)
                return (
                  <li key={e.id}>
                    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold break-words">{e.name}</p>
                        <p className="text-sm text-muted">
                          {e.category} · {money(Number(e.amount), { cents: Number(e.amount) % 1 !== 0 })} {freq?.label.toLowerCase()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <p className="text-right">
                          <span className="block text-lg font-bold">{money(monthlyEquivalent(e.amount, e.frequency))}</span>
                          <span className="block text-xs text-muted">per month</span>
                        </p>
                        <div className="flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing({ ...e })
                              setEditErrors({})
                            }}
                            aria-label={`Edit ${e.name}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-700 hover:bg-red-50"
                            onClick={() => remove(e)}
                            aria-label={`Delete ${e.name}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
          {state.mode === 'demo' && state.expenses.length > 0 && (
            <p className="text-sm text-muted">Demo expenses are fictional examples, not typical costs.</p>
          )}
        </div>

        <Card className="h-fit p-5 lg:sticky lg:top-32">
          <h2 className="mb-4 text-lg font-bold">Add an expense</h2>
          <form onSubmit={add} noValidate className="space-y-4">
            <ExpenseForm value={form} onChange={setForm} errors={errors} idPrefix="add" />
            {form.amount !== '' && Number(form.amount) >= 0 && form.frequency !== 'monthly' && (
              <p className="text-sm text-muted">≈ {money(monthlyEquivalent(form.amount, form.frequency), { cents: true })} per month</p>
            )}
            <Button type="submit" className="w-full">
              + Add expense
            </Button>
          </form>
        </Card>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit expense"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </>
        }
      >
        {editing && <ExpenseForm value={editing} onChange={setEditing} errors={editErrors} idPrefix="edit" />}
      </Modal>
    </div>
  )
}
