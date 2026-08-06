# What changed on 6 August 2026

Commit `9442cd4` — "Reshape the app around typed page props for the Laravel backend". One commit, 302 files, and it changes how the whole front end is put together. This page explains what moved, why, and where to look, so you can find your way around without diffing the commit yourself.

## The short version

The app used to fetch its data the SPA way: query hooks calling REST endpoints, with a service worker intercepting requests to serve mock responses. That machinery is gone. The app is now built the way it will run inside Laravel with Inertia.js: every page is a component that receives typed props, every write is a form submission through an Inertia-shaped router, and the mock layer plays the part of the controllers until the real ones exist.

Nothing visual changed. Every screen renders exactly as it did before; the difference is entirely in how data reaches the components.

## Toolchain

| Before | After |
| --- | --- |
| React 18 | React 19.2 with the React Compiler enabled |
| Vite 5 | Vite 8 (compiler wired through `@rolldown/plugin-babel` in `vite.config.ts`) |
| TypeScript 5.6 | TypeScript 5.7, strict mode, no `any` anywhere |
| TanStack Query + MSW + zod + MSAL | Removed entirely |
| CSS Modules | Still CSS Modules, with Tailwind CSS 4 available alongside (`src/Styles/tailwind.css`) |

Vitest moved to v4 to match Vite 8. The test suite (35 tests) and lint config (`--max-warnings 0`) both pass.

## Folder layout

`src/` now mirrors what `resources/js` will look like inside Laravel, so the eventual move is a copy, not a reorganisation:

```
src/
├── app.tsx          entry point (was main.tsx)
├── Components/      shared UI: buttons, dialogs, tables, icons
├── Layouts/         shells: desktop, mobile, top bar, command palette
├── Pages/           one folder per screen, grouped by area
├── Hooks/           useForm, useMediaQuery and friends
├── Context/         auth, shared props, toast
├── Types/           the domain model and every page's prop types
├── Lib/             the router shim, page adapter, route table
├── Constants/       navigation and role access tables
├── Mock/            the stand-in backend: resolvers, actions, fixtures
└── Styles/          tokens, global css, tailwind entry
```

## How data flows now

**Reads.** Each route in `src/Lib/routes.tsx` pairs a page component with a resolver from `src/Mock/`. The resolver builds the page's props the same way a Laravel controller passes data to `Inertia::render` — for example `Mock/goals.ts` is the stand-in for `GoalController@index`. Pages never fetch; they declare a props interface (defined in `src/Types/`) and render what they are given.

**Writes.** Forms and actions go through `src/Lib/router.ts`, which copies Inertia's router surface: `router.post/put/patch/delete` with `onSuccess`, `onError`, and `onFinish`, plus `router.visit` for navigation. `src/Hooks/useForm.ts` copies Inertia's `useForm`: `data`, `setData`, `errors`, `processing`, `recentlySuccessful`. Validation errors come back field-keyed, the way Laravel returns a 422. The mock action handlers registered in `src/Mock/` answer the same URLs the Laravel routes will.

**Shared data.** `src/Context/SharedPropsContext.tsx` provides `{ auth, flash, app, nav }` — the shape `usePage().props` will have once the Laravel middleware supplies it. The top bar, navigation counts, and flash toasts all read from it.

**Auth.** There is no token handling anywhere. The mock session in `src/Mock/session.ts` stands in for Laravel's session auth, and the role switcher swaps the signed-in persona.

## The swap, when Laravel arrives

Three files carry the whole integration:

1. `src/Lib/router.ts` → replace with `import { router } from '@inertiajs/react'`
2. `src/Hooks/useForm.ts` → replace with Inertia's `useForm` (same signature)
3. `src/Context/SharedPropsContext.tsx` → replace with `usePage().props` (same shape)

Then delete `src/Mock/` and the React Router table in `src/Lib/routes.tsx`, and point the Laravel routes at the pages. Pages, layouts, components, forms, and styles need no changes.

`docs/api-contract.md` is the backend's build target: every GET route documents the props its controller must pass, every write route matches a form the pages already submit, and every rule the mock enforces (goal weights, review transitions, the three-party appraisal sign-off) is written down there.

## One thing worth knowing about the React Compiler

The compiler memoises by referential identity, and it cannot see into the mutable mock store. Three functions read that store directly — `usePageProps` in `src/Lib/page.ts`, and the providers in `src/Context/SharedPropsContext.tsx` and `src/Context/MockAuth.tsx` — so each starts with a `'use no memo'` directive, and `usePageProps` returns a `structuredClone` of the resolved props so every commit hands the page fresh object identities, the way a real Inertia response would. If you add another function that reads the store during render, follow the same pattern or the UI will quietly go stale. The comments at each site explain this in place.

Once the mock layer is replaced by real Inertia props, the directives and the clone can go: page props will arrive as fresh JSON on every visit, which is the situation the compiler expects.

## A note on the demo timers

In the appraisal screens, colleagues appear to counter-sign and propose ratings on their own a moment after you act. Those are presentation timers that make a single-user demo feel alive — they are not business logic. The real sequencing rules (who may sign, in what order, what locks the record) live in the mock actions in `src/Mock/appraisals.ts` and in the contract, and the backend implements those, not the timers.

## Where to read more

- `docs/handover.md` — running the app, the folder map, routing and role guards, how to add a screen.
- `docs/api-contract.md` — every route, prop shape, enum, and validation rule for the backend.
- `docs/decisions.md` — the non-obvious calls and anything deferred.
