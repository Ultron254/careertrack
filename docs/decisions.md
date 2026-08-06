# Decisions

Short notes on the non obvious calls, so the next engineer does not have to reverse engineer the reasoning.

## CSS Modules carry the design; Tailwind 4 is the utility layer

The design is hundreds of specific inline values. Porting that to utility classes produces unreadable JSX and buries the intent, so the pixel-checked screens stay on CSS Modules and `src/Styles/tokens.css` is the single place a colour, radius, or shadow changes — no raw hex values live outside that file. Tailwind CSS 4 is wired in through Vite (theme and utility layers only, no preflight, so it cannot restyle existing components) and maps the brand tokens into `@theme`, giving new work the utility vocabulary the wider stack expects.

## Hand built charts, not a chart library

The Reports screen needs exactly two charts, a status donut and a trend line, both about sixty lines of SVG. They live in `src/Components/charts/`. A charting dependency would be heavier and match the design worse.

## A local icon set, not an icon library

The design ships its own icons as raw SVG path data. They are extracted verbatim into `src/Components/icons/iconPaths.ts` and drawn by one `Icon` component. A generic icon library would replace a bespoke set with a worse match. A few control glyphs (check, close, chevrons, plus, clock) were added in the same style for controls the design draws with text characters.

## Pages receive props; the mock layer plays the controllers

The application is structured for Laravel + Inertia.js: every page under `src/Pages/` exports a props interface and renders what it is given, and `src/Mock/` pairs each page with a resolver that assembles those props plus actions that accept its writes. Components submit through an Inertia-shaped `router` and `useForm`, so validation errors come back field-keyed the way Laravel sends them. That is what makes the handover a substitution rather than a refactor: controllers take over the resolvers' job, `@inertiajs/react` takes over the shim's, and no page changes.

## The role preview bar is a development affordance

The "Demo, view as" switcher lets a reviewer and the backend developer reach every role's screens without four accounts. In production the role comes from the Entra token, so the bar renders only when `VITE_ENABLE_ROLE_PREVIEW === 'true'`, which is the default in development and false in production. Delete `RolePreviewBar` and that variable once real accounts exist.

## KpiCard moved to Components/ui

The KPI card started in the dashboard feature. Reports needed the same card. Pages never import from each other, so it moved to `src/Components/ui/KpiCard.tsx`, the shared home for anything two screens use.

## categoryOrder lives in Components/ui/accent.ts

The fixed order of the four goal categories is shared by the goals wizard, the review step, and HR configuration. It sits in the shared accent module so no screen imports another screen to get it.

## Appraisal comments map to the first goal per category

The appraisal design shows one comment box per category section, but the domain model stores comments per goal. Each section's comment is applied to the first goal in that category. This keeps the UI faithful to the design while writing against the existing `perGoalComments` contract.

## Employee profile rating writes an appraisal draft

The employee profile's rating action reuses the appraisal routes for the subject rather than introducing a separate rating resource, since a manager rating is an appraisal in the domain model.

## Deferred items

- Pull to refresh is not implemented. The offline banner, bottom sheet, splash, swipe to reveal actions on the notifications list, and full screen mobile sub views are in place. Pull to refresh was left out because every action already re-resolves the page's props on commit, so a manual gesture would duplicate behaviour that is reachable through the standard controls.
- Report export is a stub. The action is real and the UI shows the response state, but only PDF and Excel resolve; other formats return a deliberate field error so the error path stays reachable.
- Profile photo upload is client-side for the demo (`localStorage` via `src/Lib/avatarStore.ts`) until the backend exposes a photo endpoint. Real staff photos will arrive through `User.avatarUrl` from Microsoft Graph and take precedence over the local override.
- The Oxygene creative doodle sheet and photo plates from the design HTML live in `public/brand/` and are applied through global `.oxy-wash` / `.oxy-plate` classes (matching the design's luminosity overlay). Dense working surfaces stay clean; hero banners, onboarding, and empty states carry the brand texture.
