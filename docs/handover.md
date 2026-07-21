# CareerTrack handover

## Swapping the mocks for a real backend

The whole point of the data layer is that this takes three steps and touches no component.

1. Set `VITE_API_BASE_URL` to the real API origin, for example `https://api.oxygene.africa`.
2. Set `VITE_ENABLE_MOCKS=false`.
3. Delete `src/mocks/` once you are confident the real API answers every path in `src/api/endpoints.ts`.

No component imports fixtures. Every screen already makes real `fetch` calls; today MSW answers them, tomorrow the backend does. The contract those calls expect is in `docs/api-contract.md`, generated from the same Zod schemas the client parses with, so it cannot drift from the code.

## Running locally

```bash
npm install
npm run dev
```

The app starts fully self contained: a fixture user, the mock API, and the role preview bar. No tenant or backend is required. Other scripts:

- `npm run build` type checks and builds for production.
- `npm run lint` runs ESLint with zero tolerance for warnings.
- `npm test` runs the Vitest suite.
- `npm run format` applies Prettier.

## Environment variables

| Variable | What it does |
| --- | --- |
| `VITE_API_BASE_URL` | Origin every request is prefixed with. Empty means same origin, which lets the mock worker intercept. Set to the backend origin at handover. |
| `VITE_ENABLE_MOCKS` | `true` starts MSW and serves fixtures. `false` lets requests reach `VITE_API_BASE_URL`. |
| `VITE_AUTH_MODE` | `mock` uses a fixture user and a fake token. `msal` uses Microsoft Entra ID. |
| `VITE_ENABLE_ROLE_PREVIEW` | Shows the "Demo, view as" role switcher. Development only; keep it `false` in production. |
| `VITE_ENTRA_TENANT_ID` | Entra tenant id. Required only when `VITE_AUTH_MODE=msal`. |
| `VITE_ENTRA_CLIENT_ID` | Entra app registration client id. |
| `VITE_ENTRA_REDIRECT_URI` | Redirect URI registered on the app registration. |
| `VITE_ENTRA_API_SCOPE` | Scope requested for the access token sent to the backend. |

Three env files carry these: `.env.development` (local, mock everything), `.env.production` (the real backend and Entra), and `.env.demo` (the standalone Vercel demo that runs on mock data). The live demo builds with `npm run build:demo`, which loads `.env.demo`. To deploy against a real backend, change the `buildCommand` in `vercel.json` back to `npm run build` so it uses `.env.production`, and fill in the Entra values.

## Folder map

| Path | Purpose |
| --- | --- |
| `src/app/` | Router, route guards, providers, top level app gate. |
| `src/auth/` | The `useAuth` surface, the two providers, and the role and claim maps. |
| `src/api/` | The fetch client, the endpoint table, Zod schemas, and TanStack Query hooks. |
| `src/mocks/` | MSW handlers and fixtures. Deleted at handover. |
| `src/components/layout/` | The two shells, sidebar, top bar, tab bar, command palette. |
| `src/components/ui/` | Shared primitives: buttons, cards, badges, avatar, modal, sheet, skeletons, charts helpers. |
| `src/components/charts/` | The hand built donut and trend charts. |
| `src/components/icons/` | The `Icon` component and the raw path set. |
| `src/features/` | One folder per screen area. Features import from `components/` and `api/`, never from each other. |
| `src/styles/` | `tokens.css` (the design system) and `global.css`. |
| `src/types/` | The shared domain model. |
| `docs/` | This file, the API contract, and the decision log. |
| `tools/` | The one time design unpacker. |

## Routing and role guards

`src/app/router.tsx` defines the route table. Every route sits behind `AccessGuard`, which checks the current role against `routeAccess` in `src/auth/roles.ts` using the same `matchPath` logic the test suite exercises. A role that cannot reach a route gets the 403 screen, never a blank page. Unknown paths get the 404 screen.

Navigation is data, not scattered conditionals. `sidebarOrder` drives the desktop sidebar, `mobileTabs` drives the mobile tab bar, and `routeAccess` guards the routes. Adding a fifth role means adding one row to each of those maps and nothing else.

## How auth resolves

Components only ever call `useAuth()`. They never import MSAL.

- **Mock mode** (`VITE_AUTH_MODE=mock`): `MockAuthProvider` returns a fixture user and resolves a fake token, so the app runs with no tenant. The role preview bar can switch the active persona in this mode.
- **MSAL mode** (`VITE_AUTH_MODE=msal`): `MsalAuthProvider` wraps `@azure/msal-react`, reads the Entra config from the environment, and resolves the role from the token.

Entra sends application roles in the token's `roles` claim, for example `{ "roles": ["CareerTrack.Manager"] }`. `roleFromClaims` in `roles.ts` maps those to the internal `Role`, falling back to `employee` for unknown or missing claims.

Staff photos should come from Microsoft Graph at `/users/{id}/photo/$value`, cached by the backend and returned as `User.avatarUrl`. The `Avatar` component renders that photo when present and falls back to deterministic initials otherwise, so no frontend change is needed once photos arrive.

## Where mock data lives

`src/mocks/fixtures/` holds plain typed objects that satisfy the domain types, so a type change breaks the mocks immediately. `src/mocks/handlers/` mirrors `endpoints.ts` one for one, adds realistic latency, and includes at least one deliberate error per resource so the error states stay reachable (for example, the report export endpoint rejects formats other than PDF and Excel).

## Adding a new screen

1. Add the route pattern to `routeAccess` for every role that may reach it, and add the screen to `sidebarOrder` or `mobileTabs` if it belongs in navigation.
2. Add the endpoint paths to `src/api/endpoints.ts` and a Zod schema under `src/api/schemas/`.
3. Add a TanStack Query hook under `src/api/queries/`.
4. Add a matching MSW handler and fixture so the screen works before the backend exists.
5. Build the feature under `src/features/<name>/` with its own components and CSS modules, and register it in `src/app/router.tsx`.
