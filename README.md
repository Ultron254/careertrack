# CareerTrack

The internal performance management front end for Oxygene. It reproduces the supplied designs as a production React application that runs standalone on realistic mock data, with one clearly marked seam where a backend, a database, and Microsoft Entra ID are connected later.

## Running it

```bash
npm install
npm run dev
```

The app starts fully self contained: a fixture user, a mock API, and a development role switcher, so no backend or tenant is needed. Use the "Demo, view as" bar to move between the employee, manager, people team, and admin experiences.

Other scripts:

- `npm run build` type checks and builds for production.
- `npm test` runs the unit tests.
- `npm run lint` runs ESLint.

## Demo access and walkthrough

The demo runs on mock auth, so there are **no passwords**. On the sign in screen,
click **Sign in with Microsoft** (it resolves a mock session, no real tenant is
contacted). Once inside, use the **"Demo, view as"** bar in the bottom left to
switch between the four personas, each with its own role, navigation, and data:

| View | Persona | Email | Role | Sees |
| --- | --- | --- | --- | --- |
| Emp | Amara Koech | amara.koech@oxygene.africa | Employee | Own goals, appraisals, feedback |
| Mgr | David Otieno | david.otieno@oxygene.africa | Manager | The above plus their team's reviews and reports |
| PT | Wanjiru Mwangi | wanjiru.mwangi@oxygene.africa | People team | Org wide people directory, reports, and HR configuration |
| Admin | Sam Ndlovu | sam.ndlovu@oxygene.africa | Admin | Everything, including system settings |

Switching a persona clears the query cache so every screen refetches for the
newly active user. On the deployed demo the same switcher is available because
`.env.demo` sets `VITE_ENABLE_ROLE_PREVIEW=true`.

Global search is `Cmd/Ctrl + K`. The onboarding carousel and guided tour can be
replayed from a fresh session (the flags live in `sessionStorage`, so opening a
private window restarts onboarding).

### Mobile view

The layout is responsive and switches automatically at a 900px breakpoint
(`useMediaQuery` drives `MobileShell` vs `DesktopShell`), so opening the Vercel
link on a phone shows the mobile experience with no separate URL. On a desktop
browser you can preview it by narrowing the window below 900px or using the
browser dev tools device toolbar (Ctrl/Cmd + Shift + M in Chrome).

## Stack

Vite, React 18, TypeScript in strict mode, React Router 6, TanStack Query 5, Zod, MSW 2 for the mock API, MSAL for Entra ID auth, CSS Modules over a token layer.

## Documentation

- [Handover](docs/handover.md): the three step backend swap, how to run, the folder map, routing and role guards, auth, and how to add a screen.
- [API contract](docs/api-contract.md): every endpoint, its shapes, and the enums, for the backend developer.
- [Decisions](docs/decisions.md): the non obvious calls and anything deferred.

## Deployment

Live demo: https://careertrack-ten.vercel.app

Deployed on Vercel. `vercel.json` provides the single page app rewrites so client
routes resolve on refresh. The demo builds with `npm run build:demo`, which loads
`.env.demo` and runs the whole product on mock data with no backend and no Entra
tenant, so every screen and role is reachable. To point the deployment at a real
backend, switch the `buildCommand` in `vercel.json` back to `npm run build` and set
the production environment variables described in `docs/handover.md`.
