# KinBridge — Care smarter, spend less

KinBridge helps US adults (25–45) who coordinate and pay for an aging parent's care to plan monthly costs, compare
pharmacy prices against a budget, share expenses with siblings, and keep follow-up tasks in one place.

- **Track:** Money · **Model:** B2C (the family pays; Free plan + Plus subscription) · **Platform:** web only, mobile-responsive
- **No login:** click **"Try Demo Mode — Instant Access"** on the landing page. All demo names, pharmacies, rates and prices are fictional.
- **Not medical advice.** KinBridge is an organizing and cost-planning tool. It is not HIPAA compliant and does not claim to be.

## Try it in 60 seconds (for reviewers)

1. Open the app and press **Try Demo Mode**. Choose "Allow saving" or "Continue without saving".
2. **Pharmacy Prices:** change the budget and watch the recommendation and map update.
3. **Expenses / Cost Planner:** edit a number; totals and budget remaining update instantly.
4. **Family Split** is a Plus feature: open **Pricing**, choose a plan, and use the _demo_ checkout (no card, nothing charged).
5. Log this month's **Check-in**; add a task with a due date on **Home** and export it to your calendar.

## Run locally

```bash
npm install
npm run dev      # development server
npm run build    # static site in dist/ (deploy to any static host, e.g. Netlify)
npm test         # unit tests for the calculations
npm run lint     # ESLint
npm run format   # Prettier
```

Requires Node 18+.

## How the code is organized

```
src/
  main.jsx          entry point
  App.jsx           app shell: hash routing, navigation, consent + clear-data dialogs
  store.jsx         ALL app state (one reducer), demo data, localStorage saving (only with consent)
  calc.js           pure calculation helpers: monthly costs, care-cost planner, family split,
                    pharmacy ranking, check-in streak   <- start here to understand the math
  calc.test.js      unit tests for calc.js
  data.js           states/cities/ZIP prefixes, fictional-pharmacy generator, plan prices, FAQ text
  ui.jsx            small reusable UI pieces (Button, Card, Field, Modal, toasts, logo)
  extras.jsx        location picker, Plus paywall card, footer, consent dialog
  pages/            one file per screen
    Landing, Dashboard (home + tasks), Expenses, CostPlanner, Pharmacy, Split,
    Checkin, Summary, Pricing, Support, Privacy, Resources
```

Data flow: pages read state with `useStore()` and change it with `dispatch({ type, ... })`; every number shown on
screen is derived from that state by the functions in `calc.js`, so nothing is hard-coded.

## Key calculations (all in `src/calc.js`)

- **Recurring expenses → monthly:** weekly × 52/12, every 2 weeks × 26/12, quarterly ÷ 3, yearly ÷ 12.
- **Cost Planner:** hours per visit = weekly hours ÷ visits; billed hours per visit = the larger of that and the agency's
  minimum; monthly cost = billed hours × hourly rate × 52/12. The difference between two options is shown as an _estimate_.
- **Pharmacy recommendation:** price = the user's own quote if entered, otherwise (what they pay today) × (the pharmacy's
  fictional price index). The best pick is the cheapest pharmacy that fits the user's budget.
- **Family Split:** each person's fair share = total × their %; balance = paid − share; settle-up pairs the biggest debtor with the biggest creditor.

## Honesty and privacy choices

- Demo pharmacies, distances, rates and prices are **fictional** and labeled as such; they are not market data. The map is a
  schematic drawing, not real locations. A real quote typed by the user replaces the estimate.
- Nothing is verified in real life; there is no care-navigator integration.
- **Checkout is a demo.** No payment processor, no card details.
- **No backend, no accounts, no analytics, no third-party requests** (fonts are bundled). Data lives in the browser's
  localStorage and is saved only if the user allows it (Privacy page: change choice or delete everything).
- The app never asks for Social Security numbers, Medicare numbers, birth dates or medical records.

## Tech

React 18, Vite 6, Tailwind CSS 4, Nunito (bundled via `@fontsource-variable/nunito`). Hash-based routing so refreshing
works on any static host. No external APIs or AI services.

## Deploying

`npm run build`, then upload the `dist/` folder to any static host (for example drag it onto https://app.netlify.com/drop).
`netlify.toml` is included for repository-based deploys.
