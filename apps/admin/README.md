# Party App Admin

React + TypeScript console for the local Party API. Includes administrator authentication, current community statistics, room/seat visibility, user access moderation, report resolution/dismissal, and virtual-currency ledger inspection. All records come from the API. Seed content is labeled Demo; no real billing.

## Run

Start `../api` first. Then:

```sh
npm install
# optional: copy .env.example to .env and set VITE_API_URL
npm run dev
```

Open the local URL Vite prints. Use an administrator account. **Open demo administrator** calls the API's development-only `/auth/admin-demo` endpoint; production disables this route. Normal user accounts cannot enter the console.

```sh
npm run build
npm run preview
```

The token is scoped to the current browser tab/session in sessionStorage. Sign out clears it and calls server logout. Refresh fetches current records; the console is a snapshot, not a live monitor. User access changes ask for confirmation; report decisions are stored by the API. No browser-side mock data or fabricated activity counts.

## Deployment

Build with the deployed HTTPS API URL in `VITE_API_URL`, configure the API CORS allowlist for the admin origin, and serve `dist` over HTTPS. Do not enable development demo authentication on a public service. Deploy API authentication and persistence suitable for production before accepting real users. Google fonts are optional; system fonts remain available offline.

