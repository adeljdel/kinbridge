import { useEffect, useState } from 'react'
import { LOCATIONS, cityByName, cityList, lookupZip } from './data.js'
import { Button, Card, Field, Modal, inputCls } from './ui.jsx'

/* ---------- State / city / ZIP picker ---------- */
export function LocationPicker({ value, onChange }) {
  const [zip, setZip] = useState(value.zip || '')
  const [note, setNote] = useState('')
  useEffect(() => setZip(value.zip || ''), [value.zip])

  const onState = (code) => {
    const c = cityList(code)[0]
    onChange({ state: code, city: c.name, zip: c.sample })
    setNote('')
  }
  const onCity = (name) => {
    const c = cityByName(value.state, name)
    onChange({ state: value.state, city: name, zip: c.sample })
    setNote('')
  }
  const onZip = (raw) => {
    const z = raw.replace(/\D/g, '').slice(0, 5)
    setZip(z)
    if (z.length < 5) return setNote('')
    const hit = lookupZip(z)
    if (hit) {
      onChange({ ...hit, zip: z })
      setNote(`ZIP ${z} → ${hit.city}, ${hit.state}`)
    } else setNote(`We don’t have demo data for ZIP ${z} yet. Pick a state and city instead.`)
  }
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="State">
          {(p) => (
            <select {...p} className={inputCls} value={value.state} onChange={(e) => onState(e.target.value)}>
              {LOCATIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="City">
          {(p) => (
            <select {...p} className={inputCls} value={value.city} onChange={(e) => onCity(e.target.value)}>
              {cityList(value.state).map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="ZIP code">
          {(p) => <input {...p} className={inputCls} inputMode="numeric" autoComplete="off" maxLength={5} value={zip} onChange={(e) => onZip(e.target.value)} placeholder="e.g. 78704" />}
        </Field>
      </div>
      {note && (
        <p className={note.startsWith('We don') ? 'mt-2 text-sm font-medium text-accent-600' : 'mt-2 text-sm text-muted'} role="status">
          {note}
        </p>
      )}
    </div>
  )
}

/* ---------- Plus paywall card ---------- */
export function PlusGate({ title, icon = '🔒', children, bullets = [] }) {
  return (
    <Card className="mx-auto max-w-2xl border-brand-200 p-6 text-center sm:p-8">
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h2 className="mt-2 text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-1 max-w-lg text-muted">{children}</p>
      {bullets.length > 0 && (
        <ul className="mx-auto mt-4 max-w-md space-y-1.5 text-left text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-emerald-700" aria-hidden="true">
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <a href="#/pricing" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-700 px-5 font-semibold text-white hover:bg-brand-800">
          See Plus plans
        </a>
      </div>
      <p className="mt-3 text-xs text-muted">Demo checkout — no card needed and nothing is charged.</p>
    </Card>
  )
}

/* ---------- Footer ---------- */
export function SiteFooter() {
  const link = 'flex min-h-11 items-center rounded-lg px-1 font-semibold text-brand-800 hover:underline'
  return (
    <footer className="no-print mx-auto max-w-6xl px-4 pb-8 text-sm text-muted">
      <div className="border-t border-silver-200 pt-6">
        <nav aria-label="Footer" className="mb-4 flex flex-wrap gap-x-6">
          <a href="#/resources" className={link}>
            Resources
          </a>
          <a href="#/support" className={link}>
            Support
          </a>
          <a href="#/privacy" className={link}>
            Privacy policy
          </a>
          <a href="#/pricing" className={link}>
            Pricing
          </a>
        </nav>
        <p>
          KinBridge is an administrative and care-coordination tool. It does not diagnose, recommend treatment, determine benefit eligibility, or replace a clinician, pharmacist, insurer,
          attorney, or qualified benefits counselor. Data stays in this browser only. KinBridge is not HIPAA compliant and does not claim to be. This is a hackathon prototype; all
          sample names, pharmacies, prices and statuses are fictional.
        </p>
      </div>
    </footer>
  )
}

/* ---------- Consent ---------- */
export function ConsentModal({ open, onAllow, onDecline, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Before we start: your data"
      footer={
        <>
          <Button variant="secondary" onClick={onDecline}>
            Continue without saving
          </Button>
          <Button onClick={onAllow}>Allow saving &amp; continue</Button>
        </>
      }
    >
      <p>KinBridge can remember what you enter so it’s still here when you come back.</p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
        <li>
          If you <strong>allow</strong>, your entries are saved in <strong>this browser only</strong> (local storage). They are never uploaded, sold, or shared.
        </li>
        <li>
          If you <strong>continue without saving</strong>, nothing is stored. Refreshing the page starts over.
        </li>
        <li>You can change your choice or delete everything anytime in Privacy.</li>
        <li>Please don’t enter Social Security numbers, Medicare numbers, birth dates, or medical records.</li>
      </ul>
      <p className="mt-3 text-sm text-muted">
        Read the full <a href="#/privacy" className="font-semibold text-brand-700 underline" onClick={onClose}>privacy policy</a>.
      </p>
    </Modal>
  )
}
