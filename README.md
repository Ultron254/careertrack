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

## Stack

Vite, React 18, TypeScript in strict mode, React Router 6, TanStack Query 5, Zod, MSW 2 for the mock API, MSAL for Entra ID auth, CSS Modules over a token layer.

## Documentation

- [Handover](docs/handover.md): the three step backend swap, how to run, the folder map, routing and role guards, auth, and how to add a screen.
- [API contract](docs/api-contract.md): every endpoint, its shapes, and the enums, for the backend developer.
- [Decisions](docs/decisions.md): the non obvious calls and anything deferred.

## Deployment

Deployed on Vercel. `vercel.json` provides the single page app rewrites so client routes resolve on refresh.

Live URL: (add after the first deploy)
