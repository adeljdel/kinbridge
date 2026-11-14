# KinBridge

Care-coordination web app for adult children supporting an aging parent. React 18 + Vite + Tailwind CSS v4. No backend, no accounts, no external APIs. Data lives in the browser's localStorage only.

```bash
npm install
npm run dev      # local dev server
npm run build    # static build in dist/ (deployable to any static host)
```

- Routes are hash-based (`#/dashboard`, `#/care`, `#/planner`, `#/expenses`, `#/resources`), so refreshing works on any static host.
- Demo data and the fictional provider directory are in `src/store.jsx`.
- The care-navigator check is **simulated**. Nothing is ever shown as verified.

## Features
Dashboard (clickable cards), Recurring Expenses, Cost Planner, Pharmacy price finder (state/city/ZIP, budget-based recommendation, schematic map), Family Split (Plus), Monthly check-in (history is Plus), Tasks with .ics export, Pricing with demo checkout (Free / Plus $9.99 mo or $79 yr), Support, Privacy policy with consent, Resources.
Coverage: 46 demo cities in 29 states/DC; ZIP lookup by 3-digit prefix.

## Dependencies
react, react-dom, vite, tailwindcss v4. No backend, no external APIs, no map tiles. Pharmacies are generated deterministically per city and are fictional.
