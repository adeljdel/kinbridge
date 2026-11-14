/* ---------- Locations: state -> cities -> ZIP prefixes (first 3 digits) ---------- */
const C = (name, prefixes, sample) => ({ name, prefixes, sample })
export const LOCATIONS = [
  { code: 'AZ', name: 'Arizona', cities: [C('Phoenix', ['850', '852'], '85004'), C('Tucson', ['856', '857'], '85701')] },
  { code: 'CA', name: 'California', cities: [C('Los Angeles', ['900', '901', '902', '903', '904', '905', '906', '907', '908'], '90012'), C('San Diego', ['919', '920', '921'], '92101'), C('San Francisco', ['941'], '94103'), C('Sacramento', ['956', '957', '958'], '95814')] },
  { code: 'CO', name: 'Colorado', cities: [C('Denver', ['802'], '80202')] },
  { code: 'DC', name: 'District of Columbia', cities: [C('Washington', ['200'], '20001')] },
  { code: 'FL', name: 'Florida', cities: [C('Jacksonville', ['322'], '32202'), C('Miami', ['331', '332'], '33130'), C('Orlando', ['327', '328'], '32801'), C('Tampa', ['335', '336'], '33602')] },
  { code: 'GA', name: 'Georgia', cities: [C('Atlanta', ['303'], '30303')] },
  { code: 'HI', name: 'Hawaii', cities: [C('Honolulu', ['968'], '96813')] },
  { code: 'IL', name: 'Illinois', cities: [C('Chicago', ['606'], '60601'), C('Springfield', ['627'], '62701')] },
  { code: 'IN', name: 'Indiana', cities: [C('Indianapolis', ['462'], '46204')] },
  { code: 'KY', name: 'Kentucky', cities: [C('Louisville', ['402'], '40202')] },
  { code: 'LA', name: 'Louisiana', cities: [C('New Orleans', ['701'], '70112')] },
  { code: 'MA', name: 'Massachusetts', cities: [C('Boston', ['021', '022'], '02108')] },
  { code: 'MD', name: 'Maryland', cities: [C('Baltimore', ['212'], '21202')] },
  { code: 'MI', name: 'Michigan', cities: [C('Detroit', ['482'], '48226')] },
  { code: 'MN', name: 'Minnesota', cities: [C('Minneapolis', ['554'], '55401')] },
  { code: 'MO', name: 'Missouri', cities: [C('Kansas City', ['641'], '64106'), C('St. Louis', ['631'], '63101')] },
  { code: 'NC', name: 'North Carolina', cities: [C('Charlotte', ['282'], '28202'), C('Raleigh', ['276'], '27601')] },
  { code: 'NJ', name: 'New Jersey', cities: [C('Newark', ['071'], '07102')] },
  { code: 'NV', name: 'Nevada', cities: [C('Las Vegas', ['889', '891'], '89101')] },
  { code: 'NY', name: 'New York', cities: [C('Albany', ['122'], '12207'), C('Buffalo', ['142'], '14202'), C('New York', ['100', '101', '102'], '10001')] },
  { code: 'OH', name: 'Ohio', cities: [C('Cleveland', ['441'], '44113'), C('Columbus', ['432'], '43215')] },
  { code: 'OK', name: 'Oklahoma', cities: [C('Oklahoma City', ['731'], '73102')] },
  { code: 'OR', name: 'Oregon', cities: [C('Portland', ['972'], '97204')] },
  { code: 'PA', name: 'Pennsylvania', cities: [C('Philadelphia', ['191'], '19103'), C('Pittsburgh', ['152'], '15222')] },
  { code: 'TN', name: 'Tennessee', cities: [C('Nashville', ['372'], '37203')] },
  { code: 'TX', name: 'Texas', cities: [C('Austin', ['786', '787'], '78701'), C('Dallas', ['752', '753'], '75201'), C('Houston', ['770', '771', '772', '773', '774', '775'], '77002'), C('San Antonio', ['780', '781', '782'], '78205')] },
  { code: 'UT', name: 'Utah', cities: [C('Salt Lake City', ['841'], '84101')] },
  { code: 'WA', name: 'Washington', cities: [C('Seattle', ['980', '981'], '98101')] },
  { code: 'WI', name: 'Wisconsin', cities: [C('Milwaukee', ['532'], '53202')] },
]
export const DEFAULT_LOC = { state: 'TX', city: 'Austin', zip: '78704' }
export const cityCount = LOCATIONS.reduce((n, s) => n + s.cities.length, 0)

export const stateByCode = (code) => LOCATIONS.find((s) => s.code === code)
export const cityList = (code) => stateByCode(code)?.cities ?? []
export const cityByName = (code, name) => cityList(code).find((c) => c.name === name)

export function lookupZip(zip) {
  if (!/^\d{5}$/.test(zip)) return null
  const p = zip.slice(0, 3)
  for (const s of LOCATIONS) for (const c of s.cities) if (c.prefixes.includes(p)) return { state: s.code, city: c.name }
  return null
}
export const locLabel = (p) => (p.city && p.state ? `${p.city}, ${p.state}` : '')

/* ---------- Deterministic fictional pharmacy generator ---------- */
export function hash(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}
function rng(seed) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const NAMES = [
  ['Maple Street Pharmacy', 'Independent'], ['Harbor Health Drugstore', 'Independent'], ['Sunrise Rx', 'Independent'], ['Northgate Pharmacy', 'Independent'],
  ['Greenleaf Drug', 'Independent'], ['Union Square Pharmacy', 'Independent'], ['Pioneer Rx', 'Discount pharmacy'], ['BrightPath Pharmacy', 'Discount pharmacy'],
  ['Cedar Corner Market Pharmacy', 'Grocery pharmacy'], ['Lakeside Family Pharmacy', 'Independent'], ['Summit Value Drug', 'Discount pharmacy'], ['Willow Park Market Pharmacy', 'Grocery pharmacy'],
]
// Every pharmacy here is FICTIONAL. `index` is a made-up price level relative to what the user pays today.
export function generatePharmacies(state, city) {
  const r = rng(hash(`${state}|${city}`))
  const pool = [...NAMES].sort(() => r() - 0.5).slice(0, 7)
  return pool.map(([name, type], i) => {
    const bias = type === 'Discount pharmacy' ? -0.08 : type === 'Grocery pharmacy' ? -0.03 : 0.03
    return {
      id: `ph-${hash(`${state}${city}${name}`).toString(36)}`,
      name,
      type,
      distance: Math.round((0.6 + r() * 8.4) * 10) / 10,
      angle: r() * Math.PI * 2,
      index: Math.round((0.78 + r() * 0.38 + bias) * 100) / 100,
      phone: `(555) 010-${String(Math.floor(r() * 10000)).padStart(4, '0')}`,
      hours: r() > 0.5 ? 'Mon–Sat, 9a–8p' : 'Daily, 8a–9p',
    }
  })
}

/* ---------- Plans ---------- */
export const PLUS_MONTHLY = 9.99
export const PLUS_YEARLY = 79
export const yearlyPerMonth = PLUS_YEARLY / 12
export const yearlySavingsPct = Math.round((1 - PLUS_YEARLY / (PLUS_MONTHLY * 12)) * 100)
export const FREE_MED_LIMIT = 3
export const PLUS_MED_LIMIT = 12
export const SUPPORT_EMAIL = 'support@kinbridge.example' // placeholder address for the prototype

/* ---------- Help content ---------- */
export const FAQ = [
  { q: 'Where is my data stored?', a: 'Only in this browser’s local storage, and only if you allow it. Nothing is uploaded to a server. You can delete it anytime from Privacy or with “Clear demo data”.', k: 'data store storage privacy local browser delete' },
  { q: 'Are the pharmacies and prices real?', a: 'No. In this prototype every pharmacy, address, distance and price level is fictional. Prices are estimates based on what you enter. Call a pharmacy to confirm a real price, then type it in as “your quote”.', k: 'pharmacy price real fictional map cheapest quote' },
  { q: 'How does the pharmacy recommendation work?', a: 'You enter your pharmacy budget and what you pay today. KinBridge ranks pharmacies by estimated monthly cost and highlights the lowest one that fits your budget. It doesn’t choose medications or doses.', k: 'recommend budget pharmacy cheapest how work' },
  { q: 'What does Plus include?', a: 'Family Split (share costs with siblings and settle up), monthly check-in history, printable family summary, and tracking up to 12 medications. Plus is $9.99/month or $79/year. Checkout here is a demo and charges nothing.', k: 'plus price subscription pay upgrade yearly monthly cost' },
  { q: 'Does checkout charge my card?', a: 'No. Checkout in this prototype is a demo. No card details are collected and no payment is processed.', k: 'checkout card payment stripe charge' },
  { q: 'Can KinBridge tell me what Medicare covers?', a: 'No. KinBridge can’t determine coverage or eligibility. A SHIP counselor, your plan, or Medicare.gov can answer that. See Resources.', k: 'medicare medicaid coverage insurance eligibility benefits' },
  { q: 'Does KinBridge give medical advice?', a: 'No. It is an organizing and cost-planning tool. It doesn’t diagnose, recommend treatment, or replace a clinician or pharmacist.', k: 'medical advice doctor diagnose treatment pharmacist' },
  { q: 'How do I split costs with my siblings?', a: 'Open Family Split (Plus). Add everyone, set each share (or split equally), enter what each person paid this month, and KinBridge shows who owes whom.', k: 'split sibling family share settle owe' },
  { q: 'I changed my mind about saving data.', a: 'Open Privacy and choose “Stop saving & delete my data”. You can allow saving again later.', k: 'consent withdraw stop saving delete permission' },
  { q: 'I found a bug or need help.', a: 'Send a message from the form on this page. In this prototype there is no live support team: your request is saved on this device and you can send it by email.', k: 'bug help contact support problem broken' },
]
