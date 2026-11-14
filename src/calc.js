/**
 * Pure calculation helpers (no React). Everything the UI shows as a number is computed here,
 * which keeps the logic easy to read and unit-test (see calc.test.js).
 */
import { generatePharmacies, hash } from './data.js'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

/* ---------- Money + dates ---------- */
export const money = (n, opts = {}) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: opts.cents ? 2 : 0,
    minimumFractionDigits: opts.cents ? 2 : 0,
  }).format(Number.isFinite(n) ? n : 0)

export const fmtDate = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
export const todayIso = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
export const monthKey = (offset = 0) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/* ---------- Expenses ---------- */
export const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', perMonth: 52 / 12 },
  { value: 'biweekly', label: 'Every 2 weeks', perMonth: 26 / 12 },
  { value: 'monthly', label: 'Monthly', perMonth: 1 },
  { value: 'quarterly', label: 'Quarterly', perMonth: 1 / 3 },
  { value: 'annual', label: 'Yearly', perMonth: 1 / 12 },
]
export const WEEKS_PER_MONTH = 52 / 12
export const EXPENSE_CATEGORIES = [
  'In-home care',
  'Medications & pharmacy',
  'Safety & equipment',
  'Transportation',
  'Household & meals',
  'Insurance premiums',
  'Other',
]

export const monthlyEquivalent = (amount, frequency) => {
  const f = FREQUENCIES.find((x) => x.value === frequency)
  const n = Number(amount)
  if (!f || !Number.isFinite(n)) return 0
  return n * f.perMonth
}
export function totals(state) {
  const monthlySpending = state.expenses.reduce((s, e) => s + monthlyEquivalent(e.amount, e.frequency), 0)
  const budget = Number(state.profile.monthlyBudget) || 0
  return { monthlySpending, budget, remaining: budget - monthlySpending }
}

/* ---------- Care-cost planner ---------- */
/**
 * Monthly cost of one care option (e.g. one home-care agency).
 *
 * Agencies bill at least `minHours` per visit, so the hours billed per visit are
 * max(hours per visit, minimum). Monthly cost = weekly cost x 52 / 12.
 *
 * @param {{rate: number|string, minHours: number|string}} option  hourly rate + visit minimum
 * @param {number|string} hoursPerWeek   hours of help needed each week
 * @param {number|string} visitsPerWeek  how many visits those hours are split into
 * @returns {object|null} cost breakdown, or null when an input is not a valid number
 */
export function computeOption({ rate, minHours }, hoursPerWeek, visitsPerWeek) {
  const r = Number(rate)
  const min = Number(minHours) || 0
  const hrs = Number(hoursPerWeek)
  const visits = Math.max(0, Math.round(Number(visitsPerWeek)))
  if (!(r >= 0) || !(hrs >= 0) || !(visits >= 0)) return null
  const perVisit = visits > 0 ? hrs / visits : 0
  const billablePerVisit = visits > 0 ? Math.max(perVisit, min) : 0
  const billableWeekly = billablePerVisit * visits
  const weekly = billableWeekly * r
  return { perVisit, billablePerVisit, billableWeekly, weekly, monthly: weekly * WEEKS_PER_MONTH, minimumAdds: billableWeekly - hrs }
}

/* ---------- Family split ---------- */
/**
 * Splits `total` between people by percentage and works out who owes whom.
 * `balance` = what a person paid minus their fair share (negative = owes money).
 * Settle-up pairs the biggest debtor with the biggest creditor until everyone is even.
 */
export function computeSplit(people, total) {
  const rows = people.map((p) => {
    const share = (total * (Number(p.pct) || 0)) / 100
    const paid = Number(p.paid) || 0
    return { ...p, share, paid, balance: paid - share }
  })
  const pctSum = people.reduce((s, p) => s + (Number(p.pct) || 0), 0)
  // Greedy settle-up: people who underpaid send money to people who overpaid.
  const debtors = rows
    .filter((r) => r.balance < -0.005)
    .map((r) => ({ name: r.name, amt: -r.balance }))
    .sort((a, b) => b.amt - a.amt)
  const creditors = rows
    .filter((r) => r.balance > 0.005)
    .map((r) => ({ name: r.name, amt: r.balance }))
    .sort((a, b) => b.amt - a.amt)
  const transfers = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].amt, creditors[j].amt)
    if (amt > 0.005) transfers.push({ from: debtors[i].name, to: creditors[j].name, amt })
    debtors[i].amt -= amt
    creditors[j].amt -= amt
    if (debtors[i].amt <= 0.005) i++
    if (creditors[j].amt <= 0.005) j++
  }
  return { rows, pctSum, transfers, totalPaid: rows.reduce((s, r) => s + r.paid, 0) }
}

/* ---------- Pharmacy comparison ---------- */
export const medsTotal = (meds) => meds.reduce((s, m) => s + (Number(m.monthly) || 0), 0)

/**
 * Ranks pharmacies for the user's budget.
 * Price = the user's own quote when given, otherwise (what they pay today) x (the pharmacy's fictional price index).
 * `best` is the cheapest pharmacy inside the budget; `gap` is how far over budget the cheapest is when none fit.
 */
export function pharmacyResults(state) {
  const { pharmacy, profile } = state
  const current = medsTotal(pharmacy.meds)
  const budget = Number(pharmacy.budget) || 0
  const maxMiles = Number(pharmacy.maxMiles) || 99
  const generated = generatePharmacies(profile.state, profile.city).map((p) => {
    const q = Number(pharmacy.quotes?.[p.id])
    const quote = q > 0 ? q : null
    return { ...p, quote, est: current * p.index, price: quote ?? current * p.index, source: quote ? 'your quote' : 'fictional estimate' }
  })
  const custom = pharmacy.custom.map((c) => ({
    id: c.id,
    name: c.name,
    type: 'Added by you',
    distance: Number(c.distance) || 1,
    angle: (hash(c.id) % 628) / 100,
    index: null,
    quote: Number(c.quote),
    est: null,
    price: Number(c.quote) || 0,
    source: 'your quote',
    custom: true,
    phone: '',
    hours: '',
  }))
  const all = [...generated, ...custom].map((r) => ({ ...r, within: r.price <= budget }))
  const inRange = all.filter((r) => r.distance <= maxMiles).sort((a, b) => a.price - b.price || a.distance - b.distance)
  const withinBudget = inRange.filter((r) => r.within)
  const best = withinBudget[0] || null
  const cheapest = inRange[0] || null
  const closestWithin = [...withinBudget].sort((a, b) => a.distance - b.distance)[0] || null
  return {
    current,
    budget,
    rows: inRange,
    hiddenByDistance: all.length - inRange.length,
    withinCount: withinBudget.length,
    best,
    cheapest,
    closestWithin: closestWithin && best && closestWithin.id !== best.id ? closestWithin : null,
    gap: !best && cheapest ? cheapest.price - budget : 0,
    vsCurrent: best || cheapest ? current - (best || cheapest).price : 0,
  }
}

/* ---------- Check-ins ---------- */
/** Number of consecutive months (ending this month, or last month if this one is not logged yet) with a check-in. */
export function checkinStreak(checkins) {
  let n = 0
  let off = checkins[monthKey(0)] ? 0 : -1
  while (checkins[monthKey(off)]) {
    n++
    off--
  }
  return n
}
