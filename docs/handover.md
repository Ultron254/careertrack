# CareerTrack handover

## How the Laravel + Inertia swap works

The front end is already shaped like the client half of a Laravel + Inertia.js application, so the swap is a substitution, not a refactor.

- Every screen under `src/Pages/` is a component that receives **typed props** and renders. No page fetches, caches, or knows where its data came from.
- `src/Mock/` is the stand-in for the server. Each file pairs with a page and does exactly what its controller will do: a resolver function assembles the page's props from the data store, and `registerAction` calls play the routes that accept writes (`POST /cycles/:cycleId/goals` and so on), validate the body, and return field-keyed errors.
- `src/Lib/router.ts` and `src/Hooks/useForm.ts` mirror Inertia's `router` and `useForm` signatures. Components call `router.post(url, body, { onSuccess, onError })` and read `errors`, `processing`, `recentlySuccessful` — the same property paths Inertia provides.
- `usePage().props` serves `{ auth, flash, app, nav }` from `src/Context/SharedPropsContext.tsx`, the client half of a `HandleInertiaRequests` middleware.

At handover, each Laravel controller returns `Inertia::render('goals/MyGoals', $props)` with props matching the page's exported interface (`MyGoalsProps` et al.), `router`/`useForm` imports switch to `@inertiajs/react`, and `src/Mock/` plus `src/Lib/router.ts` are deleted. The pages themselves do not change.

The full set of prop shapes and write routes is in `docs/api-contract.md`.

## Running locally

```bash
npm install
npm run dev
```

The app starts fully self contained: a mock session, the in-memory data layer, and the role preview bar. No tenant or backend is required. Other scripts:

- `npm run build` type checks and builds for production.
- `npm run lint` runs ESLint with zero tolerance for warnings.
- `npm test` runs the Vitest suite.
- `npm run format` applies Prettier.

## Environment variables

| Variable | What it does |
| --- | --- |
| `VITE_ENABLE_ROLE_PREVIEW` | Shows the "Demo, view as" role switcher. Development only; keep it `false` in production. |

Three env files carry this: `.env.development` (local), `.env.demo` (the standalone Vercel demo), and `.env.production`. The live demo builds with `npm run build:demo`, which loads `.env.demo`.

## Folder map

The `src/` layout matches what `resources/js/` will look like in the Laravel application.

| Path | Purpose |
| --- | --- |
| `src/Pages/` | One folder per screen area. Pages receive typed props and never fetch. |
| `src/Layouts/` | The two shells, sidebar, top bar, tab bar, command palette. |
| `src/Components/ui/` | Shared primitives: buttons, cards, badges, avatar, modal, sheet, toasts, charts helpers. |
| `src/Components/charts/` | The hand built donut and trend charts. |
| `src/Components/icons/` | The `Icon` component and the raw path set. |
| `src/Context/` | Auth, shared page props, and the provider stack. |
| `src/Hooks/` | `useForm` and other shared hooks. |
| `src/Lib/` | The route table and the Inertia-style router shim. |
| `src/Constants/` | Navigation maps, role access, page metadata. |
| `src/Types/` | The shared domain model and the shared-props shape. |
| `src/Mock/` | Prop resolvers, write actions, fixtures, and the in-memory store. Deleted at handover. |
| `src/Styles/` | `tokens.css` (the design system), `global.css`, and the Tailwind layer. |
| `docs/` | This file, the API contract, and the decision log. |
| `tools/` | The one time design unpacker. |

## Routing and role guards

`src/Lib/routes.tsx` defines the route table. Every route sits behind `AccessGuard`, which checks the current role against `routeAccess` in `src/Constants/navigation.ts` using the same `matchPath` logic the test suite exercises. A role that cannot reach a route gets the 403 screen, never a blank page. Unknown paths get the 404 screen. React Router's footprint is deliberately confined to the shell — pages never import it — so Inertia can take over routing without touching a page.

Navigation is data, not scattered conditionals. `sidebarOrder` drives the desktop sidebar, `mobileTabs` drives the mobile tab bar, and `routeAccess` guards the routes. Adding a fifth role means adding one row to each of those maps and nothing else.

## How auth resolves

Components only ever call `useAuth()` or read `usePage().props.auth`. The mock session in `src/Mock/session.ts` resolves a persona per role and persists the signed-in flag in `sessionStorage`. When Laravel arrives, authentication happens server side (Entra ID via Socialite or the SAML bridge), and `auth.user` simply arrives in the shared props.

Staff photos should come from Microsoft Graph at `/users/{id}/photo/$value`, cached by the backend and returned as `User.avatarUrl`. The `Avatar` component renders that photo when present and falls back to deterministic initials otherwise, so no frontend change is needed once photos arrive.

## Where mock data lives

`src/Mock/fixtures/` holds plain typed objects that satisfy the domain types, so a type change breaks the mocks immediately. `src/Mock/store.ts` seeds them into a mutable in-memory database that actions mutate the way Eloquent models would, and every commit re-renders the page with freshly resolved props — the same rhythm as an Inertia visit. Each resolver keeps at least one deliberate error path so the error states stay reachable (for example, the report export action rejects formats other than PDF and Excel).

## Adding a new screen

1. Add the route pattern to `routeAccess` for every role that may reach it, and add the screen to `sidebarOrder` or `mobileTabs` if it belongs in navigation.
2. Build the page under `src/Pages/<name>/` with an exported props interface, its own components, and CSS modules.
3. Add a resolver and any write actions under `src/Mock/<name>.ts` so the screen works before the backend exists.
4. Register the route in `src/Lib/routes.tsx` with `lazyPage`, pairing the page component with its resolver.
