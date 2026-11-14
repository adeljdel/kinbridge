import { useEffect, useState } from 'react'
import { useStore, useToast } from './store.jsx'
import { Button, Modal, Notice, Toasts, Wordmark, cx } from './ui.jsx'
import { ConsentModal, SiteFooter } from './extras.jsx'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Expenses from './pages/Expenses.jsx'
import CostPlanner from './pages/CostPlanner.jsx'
import Pharmacy from './pages/Pharmacy.jsx'
import Split from './pages/Split.jsx'
import Checkin from './pages/Checkin.jsx'
import Summary from './pages/Summary.jsx'
import Pricing from './pages/Pricing.jsx'
import Support from './pages/Support.jsx'
import Privacy from './pages/Privacy.jsx'
import Resources from './pages/Resources.jsx'

export const NAV = [
  { path: 'dashboard', label: 'Home', icon: '🏠' },
  { path: 'expenses', label: 'Expenses', icon: '🧾' },
  { path: 'planner', label: 'Cost Planner', icon: '🧮' },
  { path: 'pharmacy', label: 'Pharmacy Prices', short: 'Pharmacy', icon: '💊' },
  { path: 'split', label: 'Family Split', short: 'Split', icon: '👨‍👩‍👧', plus: true },
  { path: 'checkin', label: 'Check-in', icon: '📅' },
]
const APP_PAGES = { dashboard: Dashboard, expenses: Expenses, planner: CostPlanner, pharmacy: Pharmacy, split: Split, checkin: Checkin, summary: Summary }
const PUBLIC_PAGES = { pricing: Pricing, support: Support, privacy: Privacy, resources: Resources }
const MOBILE_MAIN = ['dashboard', 'expenses', 'pharmacy', 'split']

function useHashRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('?')[0] || ''
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
export const navigate = (path) => {
  window.location.hash = `/${path}`
}

export default function App() {
  const { state, dispatch, consent, setConsent, isPlus, storageWarning, dismissStorageWarning } = useStore()
  const { toast } = useToast()
  const route = useHashRoute()
  const [confirmClear, setConfirmClear] = useState(false)
  const [more, setMore] = useState(false)
  const [pendingStart, setPendingStart] = useState(null) // 'demo' | 'blank'

  const isApp = route in APP_PAGES
  const isPublic = route in PUBLIC_PAGES

  useEffect(() => {
    if (isApp && !state) navigate('')
    if (route === 'tasks') navigate('dashboard') // tasks now live on the home page
  }, [isApp, state, route])

  const begin = (kind) => {
    dispatch({ type: kind === 'demo' ? 'start-demo' : 'start-blank' })
    navigate('dashboard')
  }
  const requestStart = (kind) => {
    if (consent === null) setPendingStart(kind)
    else begin(kind)
  }
  const answerConsent = (v) => {
    setConsent(v)
    const k = pendingStart
    setPendingStart(null)
    begin(k)
  }
  const clearAll = () => {
    dispatch({ type: 'clear' })
    setConfirmClear(false)
    navigate('')
    toast('Demo data cleared from this browser.')
  }

  const modals = (
    <>
      <ClearModal open={confirmClear} onClose={() => setConfirmClear(false)} onConfirm={clearAll} />
      <ConsentModal open={!!pendingStart} onClose={() => setPendingStart(null)} onAllow={() => answerConsent('granted')} onDecline={() => answerConsent('declined')} />
      <Toasts />
    </>
  )

  /* ----- Landing (and anything without a workspace) ----- */
  if (!state || (!isApp && !isPublic)) {
    if (isPublic) {
      const Page = PUBLIC_PAGES[route]
      return (
        <div className="min-h-screen">
          <header className="border-b border-silver-200 bg-white">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
              <a href="#/" aria-label="KinBridge home">
                <Wordmark />
              </a>
              <Button size="sm" onClick={() => requestStart('demo')}>
                🚀 Try Demo Mode
              </Button>
            </div>
          </header>
          <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
            <Page onStart={requestStart} />
          </main>
          <SiteFooter />
          {modals}
        </div>
      )
    }
    return (
      <>
        {storageWarning && (
          <div className="mx-auto max-w-6xl px-4 pt-4">
            <Notice tone="warn" onDismiss={dismissStorageWarning}>
              {storageWarning}
            </Notice>
          </div>
        )}
        <Landing hasWorkspace={!!state} onStart={requestStart} onClear={() => setConfirmClear(true)} />
        {modals}
      </>
    )
  }

  /* ----- App shell ----- */
  const Page = APP_PAGES[route] || PUBLIC_PAGES[route]
  const activePath = route

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">
        Skip to content
      </a>
      <header className="no-print sticky top-0 z-30 border-b border-silver-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <a href="#/dashboard" className="rounded-lg" aria-label="KinBridge dashboard">
            <Wordmark />
          </a>
          <nav className="ml-2 hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <a
                key={n.path}
                href={`#/${n.path}`}
                aria-current={activePath === n.path ? 'page' : undefined}
                className={cx('flex min-h-11 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold whitespace-nowrap', activePath === n.path ? 'bg-brand-50 text-brand-800' : 'text-muted hover:bg-silver-100 hover:text-ink')}
              >
                {n.label}
                {n.plus && !isPlus && <span className="rounded bg-accent-100 px-1 text-[10px] font-bold text-accent-600">PLUS</span>}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <a
              href="#/pricing"
              className={cx('inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold', isPlus ? 'bg-emerald-50 text-emerald-800' : 'bg-accent-100 text-accent-600 hover:bg-amber-100')}
            >
              {isPlus ? '✓ Plus' : '⭐ Upgrade'}
            </a>
            <Button variant="ghost" size="sm" className="whitespace-nowrap" onClick={() => setConfirmClear(true)}>
              <span aria-hidden="true">🗑️</span> <span className="hidden sm:inline">Clear demo data</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          </div>
        </div>
        {state.mode === 'demo' && (
          <div className="border-t border-violet-200 bg-violet-50 text-violet-900">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
              <span className="font-bold">🧪 This is demo data.</span>
              <span>All names, pharmacies, prices, expenses, and statuses are fictional. Nothing has been verified.</span>
            </div>
          </div>
        )}
      </header>

      {storageWarning && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <Notice tone="warn" onDismiss={dismissStorageWarning}>
            {storageWarning}
          </Notice>
        </div>
      )}
      {consent === 'declined' && (
        <div className="no-print mx-auto max-w-6xl px-4 pt-4">
          <Notice tone="info">
            Saving is off, so nothing you enter is stored and refreshing will start over. <a className="font-semibold underline" href="#/privacy">Change this in Privacy</a>.
          </Notice>
        </div>
      )}

      <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Page onStart={requestStart} />
      </main>
      <SiteFooter />

      <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-silver-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Main">
        <div className="grid grid-cols-5">
          {NAV.filter((n) => MOBILE_MAIN.includes(n.path)).map((n) => (
            <a key={n.path} href={`#/${n.path}`} aria-current={activePath === n.path ? 'page' : undefined} className={cx('flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold', activePath === n.path ? 'text-brand-700' : 'text-muted')}>
              <span className={cx('text-xl leading-none', activePath === n.path ? '' : 'opacity-70 grayscale')} aria-hidden="true">
                {n.icon}
              </span>
              {n.short || n.label}
            </a>
          ))}
          <button type="button" onClick={() => setMore(true)} className="flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-muted">
            <span className="text-xl leading-none" aria-hidden="true">
              ⋯
            </span>
            More
          </button>
        </div>
      </nav>

      <Modal open={more} onClose={() => setMore(false)} title="All sections">
        <ul className="grid gap-2">
          {[...NAV, { path: 'pricing', label: 'Pricing & Plus', icon: '⭐' }, { path: 'support', label: 'Support', icon: '💬' }, { path: 'resources', label: 'Resources', icon: '📚' }, { path: 'privacy', label: 'Privacy policy', icon: '🔐' }].map((n) => (
            <li key={n.path}>
              <a href={`#/${n.path}`} onClick={() => setMore(false)} className="flex min-h-14 items-center gap-3 rounded-xl border border-silver-200 px-4 font-semibold hover:bg-brand-50">
                <span aria-hidden="true">{n.icon}</span>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </Modal>
      {modals}
    </div>
  )
}

function ClearModal({ open, onClose, onConfirm }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Clear demo data?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Yes, clear everything
          </Button>
        </>
      }
    >
      <p className="text-muted">
        This removes every expense, task, note, plan, and preference KinBridge saved in this browser. Nothing is stored anywhere else, so this can’t be undone. You can start the demo again
        anytime.
      </p>
    </Modal>
  )
}
