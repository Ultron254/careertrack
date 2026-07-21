# Decisions

Short notes on the non obvious calls, so the next engineer does not have to reverse engineer the reasoning.

## CSS Modules with a token layer, not Tailwind

The design is hundreds of specific inline values. Porting that to utility classes produces unreadable JSX and buries the intent. CSS Modules keep the components clean, and `src/styles/tokens.css` is the single place a colour, radius, or shadow changes. No raw hex values live outside that file.

## Hand built charts, not a chart library

The Reports screen needs exactly two charts, a status donut and a trend line, both about sixty lines of SVG. They live in `src/components/charts/`. A charting dependency would be heavier and match the design worse.

## A local icon set, not an icon library

The design ships its own icons as raw SVG path data. They are extracted verbatim into `src/components/icons/iconPaths.ts` and drawn by one `Icon` component. A generic icon library would replace a bespoke set with a worse match. A few control glyphs (check, close, chevrons, plus, clock) were added in the same style for controls the design draws with text characters.

## MSW at the network boundary, not fixture imports

Components make real `fetch` calls that MSW intercepts. That is what makes the handover three environment variables rather than a refactor: no component imports a fixture, so nothing needs rewriting when the backend arrives. Every response is parsed through a Zod schema, so an API that drifts from the contract fails with a named field error rather than a blank screen.

## The role preview bar is a development affordance

The "Demo, view as" switcher lets a reviewer and the backend developer reach every role's screens without four accounts. In production the role comes from the Entra token, so the bar renders only when `VITE_ENABLE_ROLE_PREVIEW === 'true'`, which is the default in development and false in production. Delete `RolePreviewBar` and that variable once real accounts exist.

## KpiCard moved to components/ui

The KPI card started in the dashboard feature. Reports needed the same card. Features never import from each other, so it moved to `src/components/ui/KpiCard.tsx`, the shared home for anything two features use.

## categoryOrder lives in components/ui/accent.ts

The fixed order of the four goal categories is shared by the goals wizard, the review step, and HR configuration. It sits in the shared accent module so no feature imports another feature to get it.

## Appraisal comments map to the first goal per category

The appraisal design shows one comment box per category section, but the domain model stores comments per goal. Each section's comment is applied to the first goal in that category. This keeps the UI faithful to the design while writing against the existing `perGoalComments` contract.

## Employee profile rating writes an appraisal draft

The employee profile's rating action reuses the appraisal endpoints for the subject rather than introducing a separate rating resource, since a manager rating is an appraisal in the domain model.

## Deferred items

- Swipe to reveal actions on mobile list rows and the pull to refresh gesture are not implemented. The offline banner, bottom sheet, splash, and full screen mobile sub views are in place. Swipe gestures were deferred to avoid shipping a fragile touch interaction; the underlying actions are all reachable through the standard controls.
- Report export is a stub. The endpoint is real and the UI shows the response state, but only PDF and Excel resolve; other formats return a deliberate 501 so the error path stays reachable.
- The avatar picker sets a local colour preference only. Real photos arrive through `User.avatarUrl` from Microsoft Graph, at which point the picker becomes a photo upload.
