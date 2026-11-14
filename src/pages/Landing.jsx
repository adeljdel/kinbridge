/** Landing page with the one-click demo button. */
import { useState } from 'react'
import { cityCount, LOCATIONS, PLUS_MONTHLY, PLUS_YEARLY, yearlyPerMonth } from '../data.js'
import { money } from '../store.jsx'
import { Button, Spinner, Wordmark } from '../ui.jsx'
import { SiteFooter } from '../extras.jsx'
import { navigate } from '../App.jsx'

const FEATURES = [
  {
    icon: '💊',
    title: 'Pharmacy price finder',
    body: 'Set a monthly pharmacy budget and see nearby pharmacies on a map, ranked by price, with a recommendation that fits your budget.',
  },
  {
    icon: '🧮',
    title: 'Cost planning',
    body: 'Turn hours of care and recurring expenses into one monthly number, and see how it fits the family budget.',
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Family split & follow-ups',
    body: 'Share costs fairly with siblings, settle up each month, and keep callbacks and paperwork in one task list.',
  },
]
const JUDGE = [
  'Click “Try Demo Mode”. You land on a dashboard with fictional data.',
  'Open Pharmacy Prices. Change the budget and watch the recommendation and map update.',
  'Edit an expense. Totals, budget remaining and Cost Planner update instantly.',
  'Open Family Split. It’s a Plus feature, so you’ll see the paywall. Go to Pricing → demo checkout (no card, no charge) to unlock it.',
  'Log this month’s check-in and add a task with a due date.',
]

export default function Landing({ hasWorkspace, onStart, onClear }) {
  const [loading, setLoading] = useState(false)
  const startDemo = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onStart('demo')
    }, 400)
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-silver-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-5">
        <Wordmark tagline />
        <div className="flex items-center gap-1">
          <a
            href="#/pricing"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50 sm:flex"
          >
            Pricing
          </a>
          {hasWorkspace && (
            <>
              <Button variant="ghost" size="sm" onClick={onClear}>
                Clear demo data
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('dashboard')}>
                Open dashboard →
              </Button>
            </>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 pb-12">
        <section className="grid items-center gap-10 py-8 sm:py-14 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-brand-100 bg-white px-3 py-1 text-sm font-semibold text-brand-700">
              For adult children supporting an aging parent
            </p>
            <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-ink sm:text-5xl">
              Care for your parent. A clearer next step for you.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">Organize care options, costs, and follow-ups in one place.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button size="lg" onClick={startDemo} disabled={loading} className="w-full whitespace-nowrap sm:w-auto">
                {loading ? <Spinner label="Opening demo…" /> : '🚀 Try Demo Mode — Instant Access'}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => onStart('blank')}
                disabled={loading}
                className="w-full whitespace-nowrap sm:w-auto"
              >
                Start with a blank workspace
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted">No account required. Demo uses fictional sample data.</p>
            <p className="mt-1 text-sm text-muted">
              Works for {cityCount} cities in {LOCATIONS.filter((s) => s.code !== 'DC').length} states and D.C. Free to start; Plus is{' '}
              {money(PLUS_MONTHLY, { cents: true })}/mo or {money(PLUS_YEARLY)}/yr ({money(yearlyPerMonth, { cents: true })}/mo).
            </p>
          </div>

          <div className="relative" aria-hidden="true">
            <div className="rounded-3xl border border-silver-200 bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-muted">Pharmacy pick (example)</span>
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800">Fictional</span>
              </div>
              <svg viewBox="0 0 320 170" className="w-full rounded-2xl bg-[#ECEBE0]">
                <path d="M0 55 L320 75 M0 130 L320 115 M100 0 L120 170 M220 0 L200 170" stroke="#fff" strokeWidth="8" />
                <ellipse cx="160" cy="85" rx="120" ry="65" fill="none" stroke="#708A81" strokeOpacity=".4" strokeDasharray="4 4" />
                <circle cx="160" cy="85" r="9" fill="#4B665C" />
                {[
                  [230, 55, '#15803d', '$82'],
                  [95, 110, '#15803d', '$91'],
                  [255, 120, '#b45309', '$118'],
                  [70, 50, '#b45309', '$104'],
                ].map(([x, y, c, t]) => (
                  <g key={t} transform={`translate(${x} ${y})`}>
                    <path d="M0 -16 C-9 -16 -11 -6 0 3 C11 -6 9 -16 0 -16Z" fill={c} />
                    <rect x="-17" y="6" width="34" height="13" rx="6" fill="#fff" />
                    <text y="16" textAnchor="middle" fontSize="9" fontWeight="700">
                      {t}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                Best fit for a $90 budget: about <strong>$82/month</strong>, 3.4 mi away.
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-silver-50 p-3">
                  <div className="text-xs text-muted">Est. care spending</div>
                  <div className="text-xl font-bold">$2,343</div>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <div className="text-xs text-brand-800">Budget remaining</div>
                  <div className="text-xl font-bold text-brand-800">$2,657</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="features">
          <h2 id="features" className="sr-only">
            What KinBridge helps with
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-silver-200 bg-white p-6">
                <div className="mb-3 text-3xl" aria-hidden="true">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="mt-1 text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-brand-100 bg-white p-6" aria-labelledby="judges">
          <h2 id="judges" className="text-lg font-bold">
            Reviewing this prototype? Try it in 60 seconds
          </h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-muted">
            {JUDGE.map((j) => (
              <li key={j}>{j}</li>
            ))}
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border border-silver-200 bg-white p-6 text-sm text-muted">
          <h2 className="mb-2 text-base font-bold text-ink">Good to know</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>KinBridge is an organizing tool. It does not diagnose, recommend treatment, or decide benefit eligibility.</li>
            <li>
              We ask your permission before saving anything. Data stays in this browser; nothing is uploaded. Read the{' '}
              <a className="font-semibold text-brand-700 underline" href="#/privacy">
                privacy policy
              </a>
              .
            </li>
            <li>We never ask for Social Security numbers, Medicare numbers, full birth dates, or medical records.</li>
            <li>Pharmacies and prices in demo mode are fictional. Use your own phone quotes for real decisions.</li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
