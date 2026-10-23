# Project UI and 3D setup

Inspect the existing project and package.json before implementing changes. Identify the framework, package manager, styling, routing, components, APIs, authentication and database connections.

## Safety

- Preserve existing features, business logic and pending user changes.
- Do not recreate the project, delete files, reset Git, force push or change production data.
- Check Git status before editing. Never expose secrets or overwrite .env files.
- Use the existing package manager and compatible versions.
- Ask before destructive changes, paid services or deployment.

## UI

- Configure compatible Tailwind CSS and use the official shadcn/ui CLI where supported.
- Retain TypeScript and reuse existing components and styling.
- Add Button, Card, Dialog, Avatar, Tabs, Input, Dropdown Menu, Tooltip and Skeleton where useful; reuse Lucide icons.
- Support desktop, tablet and mobile layouts, keyboard navigation, loading, empty and error states.
- Use a premium gaming style: dark surfaces, restrained neon accents, gradients and consistent typography.
- Preserve existing login, profile, social rooms, games, player indicators and rankings. Display actual API data; never imply an unavailable backend feature works.

## 3D

- Introduce 3D only where it adds value, using Three.js, React Three Fiber and Drei for suitable React views.
- Keep forms, dashboards, tables and settings in lightweight 2D.
- Lazy-load 3D with Suspense, responsive sizing, loading and failure fallbacks.
- Respect reduced-motion preferences and provide a WebGL fallback.
- Check asset sizes and licenses; prefer small procedural geometry over large downloaded models.

## Verification

- Install necessary dependencies only.
- Run available lint, type-check, tests and production builds. Report only checks actually executed.
- Verify imports, routes, responsive layouts and existing integrations.
- Do not deploy or change production settings.
- Report changed files, dependencies, commands, 3D components, results and remaining issues.

Implementation and verification: [UI-3D-IMPLEMENTATION.md](UI-3D-IMPLEMENTATION.md).
