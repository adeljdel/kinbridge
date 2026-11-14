/** Unit tests for the calculation helpers. Run with `npm test`. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeOption, computeSplit, monthlyEquivalent, pharmacyResults, checkinStreak, monthKey } from './calc.js'
import { lookupZip } from './data.js'

test('recurring amounts convert to a monthly equivalent', () => {
  assert.equal(monthlyEquivalent(100, 'monthly'), 100)
  assert.equal(Math.round(monthlyEquivalent(512, 'weekly')), 2219)
  assert.equal(monthlyEquivalent(1200, 'annual'), 100)
})

test('care option: 16 h/week over 4 visits at $32/h (4 h minimum)', () => {
  const r = computeOption({ rate: 32, minHours: 4 }, 16, 4)
  assert.equal(r.billableWeekly, 16)
  assert.equal(r.weekly, 512)
  assert.equal(Math.round(r.monthly), 2219)
})

test('care option: the visit minimum raises billable hours', () => {
  // 16 h over 8 visits = 2 h each, but the agency bills 4 h per visit => 32 h
  const r = computeOption({ rate: 32, minHours: 4 }, 16, 8)
  assert.equal(r.billableWeekly, 32)
  assert.equal(r.minimumAdds, 16)
})

test('care option: invalid input returns null', () => {
  assert.equal(computeOption({ rate: 'abc', minHours: 1 }, 10, 2), null)
})

test('family split: settle-up moves money from the underpayer to the overpayer', () => {
  const people = [
    { id: 'a', name: 'Jordan', pct: 50, paid: 1000 },
    { id: 'b', name: 'Sam', pct: 50, paid: 0 },
  ]
  const r = computeSplit(people, 1000)
  assert.equal(r.pctSum, 100)
  assert.deepEqual(r.transfers, [{ from: 'Sam', to: 'Jordan', amt: 500 }])
})

test('ZIP codes map to a demo city by their first three digits', () => {
  assert.deepEqual(lookupZip('78704'), { state: 'TX', city: 'Austin' })
  assert.deepEqual(lookupZip('90210'), { state: 'CA', city: 'Los Angeles' })
  assert.equal(lookupZip('00000'), null)
  assert.equal(lookupZip('123'), null)
})

const pharmacyState = (budget) => ({
  profile: { state: 'TX', city: 'Austin' },
  pharmacy: { budget, maxMiles: 12, meds: [{ id: 'm', name: 'Item', monthly: 100 }], quotes: {}, custom: [] },
})

test('pharmacy: best pick is the cheapest one inside the budget', () => {
  const r = pharmacyResults(pharmacyState(10000))
  assert.ok(r.best)
  assert.equal(r.best.id, r.rows[0].id)
  assert.ok(r.rows.every((p, i) => i === 0 || p.price >= r.rows[i - 1].price))
})

test('pharmacy: when nothing fits, there is no best pick and the gap is positive', () => {
  const r = pharmacyResults(pharmacyState(1))
  assert.equal(r.best, null)
  assert.ok(r.gap > 0)
})

test('pharmacy: a typed-in quote replaces the estimate', () => {
  const s = pharmacyState(500)
  const id = pharmacyResults(s).rows[0].id
  s.pharmacy.quotes[id] = '12'
  const r = pharmacyResults(s).rows.find((p) => p.id === id)
  assert.equal(r.price, 12)
  assert.equal(r.source, 'your quote')
})

test('check-in streak counts consecutive months', () => {
  const entry = { planned: 1, actual: 1 }
  assert.equal(checkinStreak({}), 0)
  assert.equal(checkinStreak({ [monthKey(0)]: entry, [monthKey(-1)]: entry, [monthKey(-3)]: entry }), 2)
})
