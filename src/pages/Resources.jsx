/** Links to trusted public resources and a short FAQ. */
import { useState } from 'react'
import { useStore } from '../store.jsx'
import { Card, PageHeader, cx } from '../ui.jsx'

const RESOURCES = [
  {
    topic: 'Finding local help',
    items: [
      {
        name: 'Eldercare Locator',
        url: 'https://eldercare.acl.gov',
        desc: 'A public service of the U.S. Administration on Aging that connects you to your local Area Agency on Aging and services.',
      },
      {
        name: '211',
        url: 'https://www.211.org',
        desc: 'Free, confidential referrals to local community services, including meals, rides, and utility help.',
      },
    ],
  },
  {
    topic: 'Medicare & insurance questions',
    items: [
      {
        name: 'Medicare.gov Care Compare',
        url: 'https://www.medicare.gov/care-compare/',
        desc: 'Official tool to look up Medicare-certified home health agencies, nursing homes, and more.',
      },
      {
        name: 'State Health Insurance Assistance Program (SHIP)',
        url: 'https://www.shiphelp.org',
        desc: 'Free, unbiased one-on-one Medicare counseling from trained local counselors.',
      },
    ],
  },
  {
    topic: 'Prescription costs',
    items: [
      {
        name: 'Medicare Plan Finder',
        url: 'https://www.medicare.gov/plan-compare/',
        desc: 'Official tool to compare Medicare drug and health plans by ZIP code.',
      },
      {
        name: 'NeedyMeds',
        url: 'https://www.needymeds.org',
        desc: 'Nonprofit directory of patient-assistance programs and discount information. Confirm details with the program.',
      },
    ],
  },
  {
    topic: 'Benefits & programs',
    items: [
      {
        name: 'BenefitsCheckUp (NCOA)',
        url: 'https://benefitscheckup.org',
        desc: 'Screens for programs that may help with costs. Results are a starting point, not an eligibility decision.',
      },
    ],
  },
  {
    topic: 'Caregiver support',
    items: [
      {
        name: 'Family Caregiver Alliance',
        url: 'https://www.caregiver.org',
        desc: 'Practical guides, fact sheets, and support resources for family caregivers.',
      },
    ],
  },
]

const FAQ = [
  {
    q: 'What’s the difference between non-medical home care and home health?',
    a: 'Non-medical home care covers help like companionship, meals, errands, and personal care. Home health usually means skilled services such as nursing or therapy, and typically requires a clinician’s order. Ask your parent’s doctor’s office which applies.',
  },
  {
    q: 'Does Medicare pay for in-home companion care?',
    a: 'Coverage rules are specific and change. KinBridge can’t determine what any plan covers. A SHIP counselor or the plan itself can answer this for your parent’s situation.',
  },
  {
    q: 'Are the pharmacies and prices real?',
    a: 'No. In this prototype all pharmacies and price levels are fictional. Always confirm prices, availability, and insurance directly with the pharmacy.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Only in this browser’s local storage. Nothing is uploaded or sent to a server. Use “Clear demo data” at the top of the page, or the Privacy page, to remove it.',
  },
]

export default function Resources() {
  const { state } = useStore()
  const demo = state?.mode === 'demo'
  const [openIdx, setOpenIdx] = useState(0)
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Resources"
        subtitle="Trusted public starting points for questions KinBridge can’t answer. Links open official or nonprofit websites in a new tab."
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {RESOURCES.map((g) => (
            <section key={g.topic}>
              <h2 className="mb-2 text-lg font-bold">{g.topic}</h2>
              <ul className="space-y-2">
                {g.items.map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl border border-silver-200 bg-white p-4 hover:border-brand-200 hover:bg-brand-50"
                    >
                      <span className="flex items-center justify-between gap-2 font-semibold text-brand-800">
                        {r.name} <span aria-hidden="true">↗</span>
                        <span className="sr-only">(opens in a new tab)</span>
                      </span>
                      <span className="mt-1 block text-sm text-muted">{r.desc}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="border-red-200 bg-red-50 p-5">
            <h2 className="font-bold text-red-900">In an emergency</h2>
            <p className="mt-1 text-sm text-red-900">
              Call <strong>911</strong>. For a mental health crisis, call or text <strong>988</strong>. KinBridge is not monitored and can’t
              respond to emergencies.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-2 text-lg font-bold">Common questions</h2>
            <div className="divide-y divide-silver-200">
              {FAQ.map((f, i) => (
                <div key={f.q}>
                  <button
                    type="button"
                    className="flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left font-semibold"
                    aria-expanded={openIdx === i}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                  >
                    {f.q}
                    <span className={cx('text-muted transition-transform', openIdx === i && 'rotate-180')} aria-hidden="true">
                      ▾
                    </span>
                  </button>
                  {openIdx === i && (
                    <p id={`faq-${i}`} className="pb-4 text-sm text-muted">
                      {f.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 text-sm text-muted">
            <h2 className="mb-1 font-bold text-ink">What KinBridge does — and doesn’t — do</h2>
            <p>
              KinBridge helps you organize care options, costs, and follow-ups. It does not diagnose, recommend treatment, determine benefit
              eligibility, or replace a clinician, pharmacist, insurer, attorney, or qualified benefits counselor. It is not HIPAA compliant
              and doesn’t claim to be.
            </p>
            {demo && <p className="mt-2">You’re viewing fictional demo data.</p>}
          </Card>
        </div>
      </div>
    </div>
  )
}
