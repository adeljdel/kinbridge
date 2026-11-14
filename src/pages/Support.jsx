import { useMemo, useState } from 'react'
import { FAQ, SUPPORT_EMAIL } from '../data.js'
import { money, pharmacyResults, totals, useStore, useToast } from '../store.jsx'
import { Button, Card, EmptyState, Field, Notice, PageHeader, cx, inputCls } from '../ui.jsx'

const TOPICS = ['Question about how something works', 'Something isn’t working', 'Pharmacy prices', 'Plus / billing', 'Privacy or my data', 'Feedback or idea']
const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'i', 'my', 'how', 'what', 'can', 'to', 'of', 'and', 'for', 'it', 'me'])

function search(q) {
  const words = q.toLowerCase().split(/\W+/).filter((w) => w && !STOP.has(w))
  if (!words.length) return []
  return FAQ.map((f) => {
    const hay = `${f.q} ${f.k}`.toLowerCase()
    return { f, score: words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0) }
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.f)
}

export default function Support() {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [asked, setAsked] = useState(null)
  const [form, setForm] = useState({ topic: TOPICS[0], message: '', includePlan: false })
  const [err, setErr] = useState('')
  const [openFaq, setOpenFaq] = useState(-1)
  const matches = useMemo(() => (asked === null ? [] : search(asked)), [asked])

  const planText = () => {
    if (!state) return ''
    const t = totals(state)
    const ph = pharmacyResults(state)
    return `\n\n--- Plan summary (no names) ---\nMonthly spending: ${money(t.monthlySpending)}\nBudget: ${money(t.budget)}\nPharmacy budget: ${money(ph.budget)}\nOpen tasks: ${state.tasks.filter((x) => !x.done).length}`
  }
  const valid = () => {
    if (form.message.trim().length < 10) {
      setErr('Please write at least a sentence (10+ characters).')
      return false
    }
    setErr('')
    return true
  }
  const body = () => `${form.message.trim()}${form.includePlan ? planText() : ''}`

  const save = (e) => {
    e.preventDefault()
    if (!valid()) return
    dispatch({ type: 'ticket-add', ticket: { topic: form.topic, message: body() } })
    setForm({ ...form, message: '' })
    toast('Saved on this device. Press “Send by email” on it to send.')
  }
  const mailto = (topic, message) => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`KinBridge support: ${topic}`)}&body=${encodeURIComponent(message)}`
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Support" subtitle="Find a quick answer, or send us a message." />
      <Notice tone="warn" className="mb-6" title="About support in this prototype">
        There is no live support team yet. Messages are saved on your device and you can send them from your own email app (to a placeholder address: {SUPPORT_EMAIL}). We never see anything unless you send it.
      </Notice>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-lg font-bold">Ask a question</h2>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                setAsked(q)
              }}
            >
              <label htmlFor="ask" className="sr-only">
                Your question
              </label>
              <input id="ask" className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. How does the pharmacy recommendation work?" />
              <Button type="submit">Search</Button>
            </form>
            {asked !== null && (
              <div className="mt-4 space-y-3" aria-live="polite">
                {matches.length === 0 ? (
                  <EmptyState icon="🤔" title="No matching answer">
                    Try different words, or send us a message.
                  </EmptyState>
                ) : (
                  matches.map((f) => (
                    <div key={f.q} className="rounded-xl bg-brand-50 p-3">
                      <p className="font-semibold">{f.q}</p>
                      <p className="mt-1 text-sm">{f.a}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-2 text-lg font-bold">Common questions</h2>
            <div className="divide-y divide-silver-200">
              {FAQ.map((f, i) => (
                <div key={f.q}>
                  <button type="button" className="flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left font-semibold" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    {f.q}
                    <span className={cx('text-muted transition-transform', openFaq === i && 'rotate-180')} aria-hidden="true">
                      ▾
                    </span>
                  </button>
                  {openFaq === i && <p className="pb-4 text-sm text-muted">{f.a}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-lg font-bold">Contact us</h2>
            <form onSubmit={save} noValidate className="mt-3 space-y-4">
              <Field label="Topic">
                {(p) => (
                  <select {...p} className={inputCls} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                    {TOPICS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Your message" error={err} hint="Please don’t include Social Security, Medicare, or medical record details.">
                {(p) => <textarea {...p} rows={5} maxLength={1500} className={cx(inputCls, 'py-2')} value={form.message} onChange={(e) => (setForm({ ...form, message: e.target.value }), setErr(''))} />}
              </Field>
              {state && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-silver-200 p-3 text-sm">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-700" checked={form.includePlan} onChange={(e) => setForm({ ...form, includePlan: e.target.checked })} />
                  <span>
                    <strong>Include a plan summary</strong> (totals and counts only — no names). Optional; off by default.
                  </span>
                </label>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                {state && <Button type="submit">Save request</Button>}
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (valid()) mailto(form.topic, body())
                  }}
                >
                  ✉️ Send by email
                </Button>
              </div>
            </form>
          </Card>

          {state && (
            <Card className="p-5">
              <h2 className="mb-2 text-lg font-bold">Your saved requests</h2>
              {state.support.tickets.length === 0 ? (
                <p className="text-sm text-muted">Nothing saved yet.</p>
              ) : (
                <ul className="space-y-3">
                  {state.support.tickets.map((t) => (
                    <li key={t.id} className="rounded-xl border border-silver-200 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{t.topic}</p>
                        <p className="text-xs text-muted">{new Date(t.at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} · saved on this device, not sent</p>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap break-words text-muted">{t.message}</p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => mailto(t.topic, t.message)}>
                          ✉️ Send by email
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'ticket-delete', id: t.id })}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card className="border-red-200 bg-red-50 p-5">
            <h2 className="font-bold text-red-900">In an emergency</h2>
            <p className="mt-1 text-sm text-red-900">
              Call <strong>911</strong>. For a mental health crisis, call or text <strong>988</strong>. For poison emergencies, call <strong>1-800-222-1222</strong>. KinBridge support can’t respond to emergencies.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
