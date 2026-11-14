/**
 * App state. One reducer holds everything the user entered; it is saved to localStorage
 * only after the user gives consent (see ConsentModal). No data ever leaves the browser.
 */
import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react'
import { DEFAULT_LOC } from './data.js'
import { monthKey, uid } from './calc.js'

export * from './calc.js'

const KEY = 'kinbridge:v2'
const CONSENT_KEY = 'kinbridge:consent'
const SCHEMA_VERSION = 2

/* ---------- Safe storage ---------- */
const read = (k) => {
  try {
    return window.localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k, v) => window.localStorage.setItem(k, v)

/* ---------- Initial states ---------- */
const isoInDays = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const FREE_PLAN = { tier: 'free', billing: null, since: null }

export function makeDemoState() {
  return {
    version: SCHEMA_VERSION,
    mode: 'demo',
    plan: FREE_PLAN,
    profile: { caregiverName: 'Jordan', caregiverAge: 36, parentName: 'Evelyn', ...DEFAULT_LOC, careHoursPerWeek: 16, monthlyBudget: 5000 },
    expenses: [
      { id: 'exp-1', name: 'In-home companion care (fictional agency)', category: 'In-home care', amount: 512, frequency: 'weekly' },
      { id: 'exp-2', name: 'Pharmacy copays', category: 'Medications & pharmacy', amount: 85, frequency: 'monthly' },
      { id: 'exp-3', name: 'Medical alert pendant subscription', category: 'Safety & equipment', amount: 39, frequency: 'monthly' },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Ask the pharmacy for a written price on the monthly refills',
        due: isoInDays(2),
        done: false,
        createdAt: Date.now() - 86400000,
      },
      {
        id: 'task-2',
        title: 'Ask Mom’s long-term care insurer what home-care paperwork they need',
        due: isoInDays(5),
        done: false,
        createdAt: Date.now() - 3600000,
      },
    ],
    planner: {
      hoursPerWeek: 16,
      visitsPerWeek: 4,
      optionA: { label: 'Agency A (fictional rate)', rate: 32, minHours: 4 },
      optionB: { label: 'Agency B (fictional rate)', rate: 29, minHours: 3 },
      includeOtherExpenses: true,
    },
    pharmacy: {
      budget: 90,
      maxMiles: 10,
      meds: [
        { id: 'med-1', name: 'Maintenance medication A (example)', monthly: 18 },
        { id: 'med-2', name: 'Maintenance medication B (example)', monthly: 27 },
        { id: 'med-3', name: 'Diabetes testing supplies (example)', monthly: 64 },
      ],
      quotes: {},
      custom: [],
    },
    split: {
      month: monthKey(0),
      people: [
        { id: 'p-1', name: 'Jordan', pct: 50, paid: 1300 },
        { id: 'p-2', name: 'Sam (fictional sibling)', pct: 30, paid: 450 },
        { id: 'p-3', name: 'Riley (fictional sibling)', pct: 20, paid: 0 },
      ],
    },
    checkins: {
      [monthKey(-2)]: { planned: 2290, actual: 2350, note: 'Extra pharmacy copay.', at: Date.now() - 60 * 86400000 },
      [monthKey(-1)]: { planned: 2343, actual: 2310, note: '', at: Date.now() - 30 * 86400000 },
    },
    support: { tickets: [] },
  }
}

export function makeBlankState() {
  return {
    version: SCHEMA_VERSION,
    mode: 'blank',
    plan: FREE_PLAN,
    profile: { caregiverName: '', caregiverAge: '', parentName: '', ...DEFAULT_LOC, careHoursPerWeek: 0, monthlyBudget: 0 },
    expenses: [],
    tasks: [],
    planner: {
      hoursPerWeek: 10,
      visitsPerWeek: 3,
      optionA: { label: 'Option A', rate: 0, minHours: 0 },
      optionB: { label: 'Option B', rate: 0, minHours: 0 },
      includeOtherExpenses: true,
    },
    pharmacy: { budget: 0, maxMiles: 10, meds: [], quotes: {}, custom: [] },
    split: { month: monthKey(0), people: [{ id: uid(), name: '', pct: 100, paid: 0 }] },
    checkins: {},
    support: { tickets: [] },
  }
}

/* ---------- Reducer ---------- */
const patchIn = (list, id, patch) => list.map((x) => (x.id === id ? { ...x, ...patch } : x))

function reducer(state, a) {
  switch (a.type) {
    case 'start-demo':
      return makeDemoState()
    case 'start-blank':
      return makeBlankState()
    case 'clear':
      return null
    case 'profile':
      return { ...state, profile: { ...state.profile, ...a.patch } }
    case 'expense-add':
      return { ...state, expenses: [...state.expenses, { id: uid(), ...a.expense }] }
    case 'expense-update':
      return { ...state, expenses: patchIn(state.expenses, a.id, a.patch) }
    case 'expense-delete':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== a.id) }
    case 'expense-restore':
      return { ...state, expenses: [...state.expenses.slice(0, a.index), a.expense, ...state.expenses.slice(a.index)] }
    case 'task-add':
      return { ...state, tasks: [{ id: uid(), done: false, createdAt: Date.now(), ...a.task }, ...state.tasks] }
    case 'task-toggle':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === a.id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : null } : t)),
      }
    case 'task-delete':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== a.id) }
    case 'planner':
      return { ...state, planner: { ...state.planner, ...a.patch } }
    case 'planner-option':
      return { ...state, planner: { ...state.planner, [a.key]: { ...state.planner[a.key], ...a.patch } } }
    case 'pharmacy':
      return { ...state, pharmacy: { ...state.pharmacy, ...a.patch } }
    case 'med-add':
      return { ...state, pharmacy: { ...state.pharmacy, meds: [...state.pharmacy.meds, { id: uid(), ...a.med }] } }
    case 'med-update':
      return { ...state, pharmacy: { ...state.pharmacy, meds: patchIn(state.pharmacy.meds, a.id, a.patch) } }
    case 'med-delete':
      return { ...state, pharmacy: { ...state.pharmacy, meds: state.pharmacy.meds.filter((m) => m.id !== a.id) } }
    case 'quote':
      return { ...state, pharmacy: { ...state.pharmacy, quotes: { ...state.pharmacy.quotes, [a.id]: a.value } } }
    case 'pharm-add':
      return { ...state, pharmacy: { ...state.pharmacy, custom: [...state.pharmacy.custom, { id: uid(), ...a.pharm }] } }
    case 'pharm-delete':
      return { ...state, pharmacy: { ...state.pharmacy, custom: state.pharmacy.custom.filter((c) => c.id !== a.id) } }
    case 'person-add':
      return { ...state, split: { ...state.split, people: [...state.split.people, { id: uid(), name: '', pct: 0, paid: 0 }] } }
    case 'person-update':
      return { ...state, split: { ...state.split, people: patchIn(state.split.people, a.id, a.patch) } }
    case 'person-delete':
      return { ...state, split: { ...state.split, people: state.split.people.filter((p) => p.id !== a.id) } }
    case 'split-set-people':
      return { ...state, split: { ...state.split, people: a.people } }
    case 'split-new-month':
      return { ...state, split: { month: monthKey(0), people: state.split.people.map((p) => ({ ...p, paid: 0 })) } }
    case 'checkin':
      return { ...state, checkins: { ...state.checkins, [a.key]: a.entry } }
    case 'checkin-delete': {
      const { [a.key]: _removed, ...rest } = state.checkins
      return { ...state, checkins: rest }
    }
    case 'plan':
      return { ...state, plan: a.plan }
    case 'ticket-add':
      return { ...state, support: { tickets: [{ id: uid(), at: Date.now(), ...a.ticket }, ...state.support.tickets] } }
    case 'ticket-delete':
      return { ...state, support: { tickets: state.support.tickets.filter((t) => t.id !== a.id) } }
    default:
      return state
  }
}

/* ---------- Load ---------- */
function loadInitial() {
  const consent = read(CONSENT_KEY) // 'granted' | 'declined' | null
  if (consent !== 'granted') return { state: null, consent, error: null }
  try {
    const raw = read(KEY)
    if (!raw) return { state: null, consent, error: null }
    const p = JSON.parse(raw)
    if (!p || p.version !== SCHEMA_VERSION || !Array.isArray(p.expenses) || !Array.isArray(p.tasks))
      return { state: null, consent, error: null }
    const base = p.mode === 'demo' ? makeDemoState() : makeBlankState()
    return {
      consent,
      error: null,
      state: {
        ...base,
        ...p,
        plan: { ...FREE_PLAN, ...p.plan },
        profile: { ...base.profile, ...p.profile },
        planner: {
          ...base.planner,
          ...p.planner,
          optionA: { ...base.planner.optionA, ...p.planner?.optionA },
          optionB: { ...base.planner.optionB, ...p.planner?.optionB },
        },
        pharmacy: {
          ...base.pharmacy,
          ...p.pharmacy,
          quotes: p.pharmacy?.quotes || {},
          custom: p.pharmacy?.custom || [],
          meds: p.pharmacy?.meds || [],
        },
        split: { ...base.split, ...p.split, people: p.split?.people?.length ? p.split.people : base.split.people },
        checkins: p.checkins || {},
        support: { tickets: p.support?.tickets || [] },
      },
    }
  } catch {
    return { state: null, consent, error: 'We could not read saved data in this browser, so the app started fresh.' }
  }
}

const StoreContext = createContext(null)
const ToastContext = createContext(null)

export function StoreProvider({ children }) {
  const initial = useRef(null)
  if (initial.current === null) initial.current = loadInitial()
  const [state, dispatch] = useReducer(reducer, initial.current.state)
  const [consent, setConsentState] = useState(initial.current.consent)
  const [storageWarning, setStorageWarning] = useState(initial.current.error)
  const [toasts, setToasts] = useState([])

  const setConsent = useCallback((v) => {
    setConsentState(v)
    try {
      write(CONSENT_KEY, v)
    } catch {
      setStorageWarning('This browser is blocking local storage, so changes will be lost when you refresh.')
    }
  }, [])

  // Persist only while the user has allowed it.
  useEffect(() => {
    try {
      if (consent === 'granted' && state) write(KEY, JSON.stringify(state))
      else window.localStorage.removeItem(KEY)
    } catch {
      if (consent === 'granted') setStorageWarning('This browser is blocking local storage, so changes will be lost when you refresh.')
    }
  }, [state, consent])

  const toast = useCallback((message, opts = {}) => {
    const id = uid()
    setToasts((t) => [...t.slice(-2), { id, message, tone: opts.tone || 'success', action: opts.action }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration || 4500)
  }, [])
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const isPlus = state?.plan?.tier === 'plus'

  return (
    <StoreContext.Provider
      value={{ state, dispatch, consent, setConsent, isPlus, storageWarning, dismissStorageWarning: () => setStorageWarning(null) }}
    >
      <ToastContext.Provider value={{ toast, toasts, dismissToast }}>{children}</ToastContext.Provider>
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
export const useToast = () => useContext(ToastContext)
