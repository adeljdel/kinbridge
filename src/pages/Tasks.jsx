import { useState } from 'react'
import { fmtDate, todayIso, useStore, useToast } from '../store.jsx'
import { Button, EmptyState, Field, Modal, cx, inputCls } from '../ui.jsx'

/* ---------- Calendar export (.ics) ---------- */
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
const ymd = (iso) => iso.replaceAll('-', '')
function nextDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const n = new Date(y, m - 1, d + 1)
  return `${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, '0')}${String(n.getDate()).padStart(2, '0')}`
}
export function downloadIcs(tasks, filename = 'kinbridge-tasks.ics') {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const events = tasks
    .filter((t) => t.due)
    .map((t) => ['BEGIN:VEVENT', `UID:${t.id}@kinbridge.local`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(t.due)}`, `DTEND;VALUE=DATE:${nextDay(t.due)}`, `SUMMARY:${esc(t.title)}`, 'END:VEVENT'].join('\r\n'))
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KinBridge//Prototype//EN', ...events, 'END:VCALENDAR'].join('\r\n')
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function AddTaskModal({ open, onClose, initialTitle = '' }) {
  const { dispatch } = useStore()
  const { toast } = useToast()
  const [title, setTitle] = useState(initialTitle)
  const [due, setDue] = useState('')
  const [error, setError] = useState('')
  const close = () => {
    setTitle('')
    setDue('')
    setError('')
    onClose()
  }
  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return setError('Please describe the task.')
    dispatch({ type: 'task-add', task: { title: title.trim(), due } })
    toast('Task added.')
    close()
  }
  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a task"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="add-task-form">
            Add task
          </Button>
        </>
      }
    >
      <form id="add-task-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="What needs to happen?" error={error} hint="Example: Ask the pharmacy for a written price quote.">
          {(p) => (
            <input
              {...p}
              className={inputCls}
              value={title}
              maxLength={140}
              onChange={(e) => {
                setTitle(e.target.value)
                setError('')
              }}
            />
          )}
        </Field>
        <Field label="Due date (optional)">{(p) => <input {...p} type="date" className={inputCls} value={due} onChange={(e) => setDue(e.target.value)} />}</Field>
      </form>
    </Modal>
  )
}

export function TaskList({ compact, calendar }) {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const [showDone, setShowDone] = useState(false)
  const [adding, setAdding] = useState(false)
  const open = state.tasks.filter((t) => !t.done).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))
  const done = state.tasks.filter((t) => t.done).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
  const today = todayIso()

  const toggle = (t) => {
    dispatch({ type: 'task-toggle', id: t.id })
    if (!t.done) toast('Marked complete.', { action: { label: 'Undo', onClick: () => dispatch({ type: 'task-toggle', id: t.id }) } })
  }

  const row = (t) => {
    const overdue = !t.done && t.due && t.due < today
    return (
      <li key={t.id} className="flex items-center gap-2 rounded-xl border border-silver-200 bg-white p-2 pr-1">
        <button
          type="button"
          role="checkbox"
          aria-checked={t.done}
          aria-label={t.done ? `Mark “${t.title}” as not done` : `Mark “${t.title}” complete`}
          onClick={() => toggle(t)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-brand-50"
        >
          <span className={cx('flex h-6 w-6 items-center justify-center rounded-md border-2 text-sm font-bold', t.done ? 'border-brand-700 bg-brand-700 text-white' : 'border-silver-300')}>{t.done ? '✓' : ''}</span>
        </button>
        <div className="min-w-0 flex-1 py-1">
          <p className={cx('font-medium break-words', t.done && 'text-muted line-through')}>{t.title}</p>
          {t.due && <p className={cx('text-sm', overdue ? 'font-semibold text-red-700' : 'text-muted')}>{overdue ? `Overdue · was due ${fmtDate(t.due)}` : `Due ${fmtDate(t.due)}`}</p>}
        </div>
        {calendar && t.due && (
          <button type="button" onClick={() => downloadIcs([t], 'kinbridge-task.ics')} className="min-h-11 min-w-11 rounded-lg text-muted hover:bg-brand-50" aria-label={`Add “${t.title}” to my calendar`} title="Add to calendar (.ics)">
            📅
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            const copy = { ...t }
            dispatch({ type: 'task-delete', id: t.id })
            toast('Task deleted.', { action: { label: 'Undo', onClick: () => dispatch({ type: 'task-add', task: copy }) } })
          }}
          className="min-h-11 min-w-11 rounded-lg text-muted hover:bg-red-50 hover:text-red-700"
          aria-label={`Delete “${t.title}”`}
        >
          🗑️
        </button>
      </li>
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">
          Open follow-up tasks <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-sm text-brand-800">{open.length}</span>
        </h2>
        <div className="flex gap-2">
          {calendar && open.some((t) => t.due) && (
            <Button size="sm" variant="secondary" onClick={() => downloadIcs(open)}>
              📅 Export all
            </Button>
          )}
          <Button size="sm" onClick={() => setAdding(true)}>
            + Add a task
          </Button>
        </div>
      </div>
      {open.length === 0 ? (
        <EmptyState icon="🎉" title={state.tasks.length ? 'All caught up' : 'No tasks yet'}>
          {state.tasks.length ? 'Every follow-up is marked complete.' : 'Add callbacks, paperwork, or questions to ask so nothing slips.'}
        </EmptyState>
      ) : (
        <ul className="space-y-2">{(compact ? open.slice(0, 5) : open).map(row)}</ul>
      )}
      {compact && open.length > 5 && <p className="mt-2 text-sm text-muted">+ {open.length - 5} more open tasks</p>}
      {done.length > 0 && (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={() => setShowDone((s) => !s)} aria-expanded={showDone}>
            {showDone ? 'Hide' : 'Show'} completed ({done.length})
          </Button>
          {showDone && <ul className="mt-2 space-y-2">{done.map(row)}</ul>}
        </div>
      )}
      <AddTaskModal open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
