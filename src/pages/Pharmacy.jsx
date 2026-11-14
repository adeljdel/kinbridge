import { useState } from 'react'
import { FREE_MED_LIMIT, PLUS_MED_LIMIT, locLabel } from '../data.js'
import { money, pharmacyResults, useStore, useToast } from '../store.jsx'
import { Badge, Button, Card, DemoTag, EmptyState, Field, MoneyInput, Notice, PageHeader, cx, inputCls } from '../ui.jsx'
import { LocationPicker } from '../extras.jsx'

/* ---------- Schematic map (no external tiles; positions are fictional and not to scale) ---------- */
function PharmacyMap({ rows, selectedId, onSelect, home }) {
  const W = 640
  const H = 400
  const cx0 = W / 2
  const cy0 = H / 2
  const maxR = Math.max(5, Math.ceil(Math.max(0, ...rows.map((r) => r.distance))))
  const sx = 270 / maxR
  const sy = 155 / maxR
  const rings = [maxR / 3, (2 * maxR) / 3, maxR]
  const best = rows.find((r) => r.within)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl border border-silver-200 bg-[#ECEBE0]" role="group" aria-label={`Schematic map of pharmacies near ${home}. Not to scale.`}>
      {/* decorative streets */}
      <g stroke="#ffffff" strokeWidth="10" strokeLinecap="round" opacity=".9">
        <path d="M0 110 L640 150" />
        <path d="M0 300 L640 250" />
        <path d="M210 0 L250 400" />
        <path d="M450 0 L400 400" />
      </g>
      <g stroke="#E3DCCB" strokeWidth="2" fill="none">
        <path d="M0 40 L640 70" />
        <path d="M0 360 L640 340" />
        <path d="M90 0 L110 400" />
        <path d="M560 0 L540 400" />
      </g>
      <rect x="470" y="300" width="110" height="60" rx="14" fill="#D7E1D3" opacity=".8" />
      {rings.map((r, i) => (
        <g key={i}>
          <ellipse cx={cx0} cy={cy0} rx={r * sx} ry={r * sy} fill="none" stroke="#708A81" strokeOpacity=".35" strokeDasharray="5 5" />
          <text x={cx0 + r * sx + 4} y={cy0 - 4} fontSize="11" fill="#4a5566">
            {Math.round(r * 10) / 10} mi
          </text>
        </g>
      ))}
      {/* home pin */}
      <g transform={`translate(${cx0} ${cy0})`}>
        <circle r="14" fill="#4B665C" />
        <text textAnchor="middle" y="5" fontSize="14" fill="#fff">
          ⌂
        </text>
        <text y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="#3A5148">
          Parent’s home
        </text>
      </g>
      {rows.map((r, i) => {
        const x = cx0 + Math.cos(r.angle) * r.distance * sx
        const y = cy0 + Math.sin(r.angle) * r.distance * sy
        const sel = r.id === selectedId
        const fill = r.within ? '#15803d' : '#b45309'
        return (
          <g
            key={r.id}
            transform={`translate(${x} ${y})`}
            role="button"
            tabIndex={0}
            aria-label={`${i + 1}. ${r.name}, ${money(r.price)} per month, ${r.distance} miles, ${r.within ? 'within' : 'over'} budget`}
            onClick={() => onSelect(r.id)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(r.id))}
            className="cursor-pointer outline-none"
          >
            {sel && <circle r="25" fill={fill} opacity=".18" />}
            <path d="M0 -26 C-14 -26 -17 -10 0 4 C17 -10 14 -26 0 -26Z" fill={fill} stroke="#fff" strokeWidth="2" />
            <text y="-12" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">
              {i + 1}
            </text>
            <g transform="translate(0 18)">
              <rect x="-30" y="-12" width="60" height="18" rx="9" fill="#fff" stroke={sel ? fill : '#d9dde4'} strokeWidth={sel ? 2 : 1} />
              <text textAnchor="middle" y="1" fontSize="11" fontWeight="700" fill="#1b2430">
                {money(r.price)}
              </text>
            </g>
            {best && best.id === r.id && (
              <text y="-32" textAnchor="middle" fontSize="14">
                ⭐
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function MedsEditor({ limit }) {
  const { state, dispatch, isPlus } = useStore()
  const { toast } = useToast()
  const meds = state.pharmacy.meds
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [err, setErr] = useState({})
  const atLimit = meds.length >= limit

  const add = (e) => {
    e.preventDefault()
    const er = {}
    if (!name.trim()) er.name = 'Enter a name or label.'
    const n = Number(price)
    if (price === '' || !Number.isFinite(n) || n < 0) er.price = 'Enter what you pay per month.'
    else if (n > 20000) er.price = 'That looks too large.'
    setErr(er)
    if (Object.keys(er).length) return
    dispatch({ type: 'med-add', med: { name: name.trim(), monthly: n } })
    setName('')
    setPrice('')
    toast('Added.')
  }

  return (
    <div>
      {meds.length === 0 ? (
        <EmptyState icon="💊" title="No medications or supplies yet">
          Add what your parent buys at the pharmacy each month and what you pay today. Use general labels — no need for exact doses or diagnoses.
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {meds.map((m) => (
            <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_6.5rem_auto] items-end gap-2 rounded-xl border border-silver-200 p-2">
              <Field label="Name">{(p) => <input {...p} className={cx(inputCls, 'min-h-11')} value={m.name} maxLength={60} onChange={(e) => dispatch({ type: 'med-update', id: m.id, patch: { name: e.target.value } })} />}</Field>
              <Field label="$ / month">{(p) => <MoneyInput {...p} className="min-h-11" value={m.monthly} onChange={(e) => dispatch({ type: 'med-update', id: m.id, patch: { monthly: e.target.value } })} />}</Field>
              <button type="button" className="mb-0.5 min-h-11 min-w-11 rounded-lg text-muted hover:bg-red-50 hover:text-red-700" aria-label={`Remove ${m.name}`} onClick={() => dispatch({ type: 'med-delete', id: m.id })}>
                🗑️
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} noValidate className="mt-3 rounded-xl bg-silver-50 p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <Field label="Add item" error={err.name} className="col-span-2">
            {(p) => <input {...p} className={inputCls} value={name} maxLength={60} placeholder="e.g. Maintenance medication C" onChange={(e) => setName(e.target.value)} />}
          </Field>
          <Field label="You pay today ($/mo)" error={err.price}>
            {(p) => <MoneyInput {...p} value={price} onChange={(e) => setPrice(e.target.value)} />}
          </Field>
          <Button type="submit" disabled={atLimit}>
            + Add
          </Button>
        </div>
        {atLimit && (
          <p className="mt-2 text-sm text-accent-600">
            {isPlus ? `You’ve reached the ${PLUS_MED_LIMIT}-item limit.` : `Free plan tracks up to ${FREE_MED_LIMIT} items.`}{' '}
            {!isPlus && (
              <a className="font-semibold underline" href="#/pricing">
                Unlock up to {PLUS_MED_LIMIT} with Plus
              </a>
            )}
          </p>
        )}
      </form>
    </div>
  )
}

function AddPharmacy() {
  const { dispatch } = useStore()
  const { toast } = useToast()
  const [f, setF] = useState({ name: '', quote: '', distance: '' })
  const [err, setErr] = useState({})
  const submit = (e) => {
    e.preventDefault()
    const er = {}
    if (!f.name.trim()) er.name = 'Enter a pharmacy name.'
    if (!(Number(f.quote) > 0)) er.quote = 'Enter the monthly total they quoted.'
    const d = Number(f.distance)
    if (f.distance === '' || !(d >= 0) || d > 50) er.distance = 'Enter miles (0–50).'
    setErr(er)
    if (Object.keys(er).length) return
    dispatch({ type: 'pharm-add', pharm: { name: f.name.trim(), quote: Number(f.quote), distance: d } })
    setF({ name: '', quote: '', distance: '' })
    toast('Pharmacy added to the comparison.')
  }
  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
      <Field label="Pharmacy name" error={err.name} className="col-span-3">
        {(p) => <input {...p} className={inputCls} value={f.name} maxLength={50} onChange={(e) => setF({ ...f, name: e.target.value })} />}
      </Field>
      <Field label="Quote ($/mo)" error={err.quote}>
        {(p) => <MoneyInput {...p} value={f.quote} onChange={(e) => setF({ ...f, quote: e.target.value })} />}
      </Field>
      <Field label="Miles away" error={err.distance}>
        {(p) => <input {...p} type="number" inputMode="decimal" min="0" step="0.1" className={inputCls} value={f.distance} onChange={(e) => setF({ ...f, distance: e.target.value })} />}
      </Field>
      <Button type="submit" variant="secondary">
        + Add
      </Button>
    </form>
  )
}

export default function Pharmacy() {
  const { state, dispatch, isPlus } = useStore()
  const { toast } = useToast()
  const [selected, setSelected] = useState(null)
  const res = pharmacyResults(state)
  const ph = state.pharmacy
  const limit = isPlus ? PLUS_MED_LIMIT : FREE_MED_LIMIT
  const demo = state.mode === 'demo'
  const sel = res.rows.find((r) => r.id === selected) || res.best || res.cheapest
  const set = (patch) => dispatch({ type: 'pharmacy', patch })
  const hasMeds = ph.meds.length > 0 && res.current > 0

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={demo && <DemoTag />}
        title="Pharmacy price finder"
        subtitle="Set a monthly pharmacy budget, enter what you pay today, and compare nearby pharmacies. We highlight the lowest price that fits your budget."
      />
      <Notice tone="warn" className="mb-6" title="Estimates, not quotes">
        {demo ? 'Pharmacies, distances and price levels here are fictional demo data. ' : ''}Prices are estimated from what you enter. Call the pharmacy, ask for a written monthly total, and type it in as “your quote” — your quote always replaces our estimate. KinBridge doesn’t recommend
        medications or doses; ask the prescriber or pharmacist about those.
      </Notice>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-bold">1. Where &amp; how much</h2>
            <LocationPicker value={state.profile} onChange={(loc) => dispatch({ type: 'profile', patch: loc })} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Monthly pharmacy budget">{(p) => <MoneyInput {...p} value={ph.budget} onChange={(e) => set({ budget: e.target.value })} />}</Field>
              <Field label={`Max distance: ${ph.maxMiles} mi`}>
                {(p) => <input {...p} type="range" min="1" max="12" step="1" className="h-12 w-full accent-brand-700" value={ph.maxMiles} onChange={(e) => set({ maxMiles: Number(e.target.value) })} />}
              </Field>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-bold">2. What you pay today</h2>
            <MedsEditor limit={limit} />
            <p className="mt-3 text-sm text-muted">
              Total today: <strong className="text-ink">{money(res.current)}/month</strong>
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="mb-1 text-lg font-bold">3. Add a pharmacy you called</h2>
            <p className="mb-3 text-sm text-muted">Works for any area — enter the monthly total they quoted.</p>
            <AddPharmacy />
            {ph.custom.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {ph.custom.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-silver-50 px-3 py-1">
                    <span>
                      {c.name} · {money(Number(c.quote))} · {c.distance} mi
                    </span>
                    <button type="button" className="min-h-10 min-w-10 text-muted hover:text-red-700" aria-label={`Remove ${c.name}`} onClick={() => dispatch({ type: 'pharm-delete', id: c.id })}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6" aria-live="polite">
          {!hasMeds ? (
            <EmptyState icon="🗺️" title="Add what you pay today to see the map">
              We compare pharmacies using your monthly total and your budget. Add at least one item with a price on the left.
            </EmptyState>
          ) : (
            <>
              <Card className={cx('p-5', res.best ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50')}>
                <p className="text-sm font-bold tracking-wide uppercase text-muted">Recommendation for your {money(res.budget)} budget</p>
                {res.best ? (
                  <>
                    <p className="mt-1 text-xl font-bold">
                      ⭐ {res.best.name} — about {money(res.best.price)}/month
                    </p>
                    <p className="mt-1">
                      That’s {money(res.budget - res.best.price)} under your budget, {res.best.distance} miles away ({res.best.source}).
                      {res.vsCurrent > 0.5 && <> Compared with what you pay today ({money(res.current)}), that’s an estimated <strong>{money(res.vsCurrent)}/month</strong> lower if the estimate holds.</>}
                    </p>
                    {res.closestWithin && (
                      <p className="mt-2 text-sm">
                        Prefer a shorter trip? <strong>{res.closestWithin.name}</strong> is also within budget at {money(res.closestWithin.price)} and only {res.closestWithin.distance} mi away.
                      </p>
                    )}
                    <p className="mt-2 text-sm text-muted">
                      {res.withinCount} of {res.rows.length} pharmacies in range fit your budget.
                    </p>
                  </>
                ) : res.cheapest ? (
                  <>
                    <p className="mt-1 text-xl font-bold">No pharmacy in range fits {money(res.budget)}</p>
                    <p className="mt-1">
                      The lowest is <strong>{res.cheapest.name}</strong> at about {money(res.cheapest.price)}/month — <strong>{money(res.gap)} over</strong> your budget.
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      <li>Raise the max distance or your budget to see how the result changes.</li>
                      <li>Ask each pharmacy about their lowest-cost options and whether 90-day fills are available (confirm anything medical with the prescriber or pharmacist).</li>
                      <li>
                        A free SHIP counselor can review plan options — see <a className="font-semibold underline" href="#/resources">Resources</a>.
                      </li>
                    </ul>
                  </>
                ) : (
                  <p className="mt-1">No pharmacies within {ph.maxMiles} miles. Increase the distance or add one you found.</p>
                )}
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-bold">Map · near {locLabel(state.profile)}</h2>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge tone="success">● Within budget</Badge>
                    <Badge tone="warn">● Over budget</Badge>
                  </div>
                </div>
                <PharmacyMap rows={res.rows} selectedId={sel?.id} onSelect={setSelected} home={locLabel(state.profile)} />
                <p className="mt-2 text-xs text-muted">Schematic only — not to scale and not real locations. Tap a pin for details.</p>
              </Card>

              {sel && (
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold">{sel.name}</h3>
                      <p className="text-sm text-muted">
                        {sel.type} · {sel.distance} mi{sel.hours ? ` · ${sel.hours}` : ''}
                        {sel.phone ? ` · ${sel.phone}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {demo && !sel.custom && <DemoTag />}
                      <Badge tone={sel.within ? 'success' : 'warn'}>{sel.within ? 'Within budget' : 'Over budget'}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-3xl font-bold">
                    {money(sel.price)}
                    <span className="text-base font-medium text-muted">/month · {sel.source}</span>
                  </p>
                  {!sel.custom && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                      <Field label="Got a real quote? Enter the monthly total" hint="Replaces our estimate for this pharmacy.">
                        {(p) => <MoneyInput {...p} value={ph.quotes[sel.id] ?? ''} placeholder={String(Math.round(sel.est))} onChange={(e) => dispatch({ type: 'quote', id: sel.id, value: e.target.value })} />}
                      </Field>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          dispatch({ type: 'task-add', task: { title: `Call ${sel.name} for a written monthly price quote` } })
                          toast('Follow-up task added.', { action: { label: 'View', onClick: () => (window.location.hash = '/dashboard') } })
                        }}
                      >
                        + Follow-up task
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              <Card className="p-5">
                <h2 className="mb-3 font-bold">All pharmacies in range (lowest price first)</h2>
                <ol className="space-y-2">
                  {res.rows.map((r, i) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(r.id)}
                        aria-pressed={sel?.id === r.id}
                        className={cx('flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-left hover:bg-brand-50', sel?.id === r.id ? 'border-brand-500 bg-brand-50' : 'border-silver-200')}
                      >
                        <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white', r.within ? 'bg-emerald-700' : 'bg-amber-700')}>{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">
                            {r.name} {res.best?.id === r.id && <span aria-label="best pick">⭐</span>}
                          </span>
                          <span className="block text-sm text-muted">
                            {r.distance} mi · {r.source}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="block text-lg font-bold">{money(r.price)}</span>
                          <span className={cx('block text-xs font-semibold', r.within ? 'text-emerald-800' : 'text-amber-800')}>{r.within ? `${money(res.budget - r.price)} under` : `${money(r.price - res.budget)} over`}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
                {res.hiddenByDistance > 0 && <p className="mt-2 text-sm text-muted">{res.hiddenByDistance} more beyond {ph.maxMiles} miles — raise the distance to see them.</p>}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
