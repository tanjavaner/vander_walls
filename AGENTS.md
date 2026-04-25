# Repository Guidelines

## Project Structure & Module Organization

This is a Vite React application for interactive TA-vdW visualizations. The app entry point is `src/main.jsx`, with high-level layout and tab routing in `src/App.jsx`. Reusable UI primitives live in `src/components/ui/`, control-panel components in `src/components/controls/`, and visualization tabs in `src/components/views/`. Pure model logic belongs in `src/physics/`; keep these modules free of React dependencies so they remain easy to test and reuse. Static model data is in `src/data/`, shared hooks in `src/hooks/`, and formatting/math helpers in `src/utils/`. Global Tailwind and custom styles are in `src/index.css`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server, typically at `http://localhost:5173`.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: serve the production build locally for verification.

Use Node.js 18 or newer, as noted in `README.md`.

## Coding Style & Naming Conventions

Use ES modules, React function components, and explicit `.js` / `.jsx` import paths, matching the existing source. Indent with two spaces. Name React components in PascalCase, hooks as `useSomething`, and physics/helper functions in camelCase. Keep physics functions deterministic and side-effect free. Prefer Tailwind utility classes for layout and styling; reserve `src/index.css` for global rules and shared custom styles. Existing comments are mostly Turkish and domain-focused; add comments only when they clarify equations, units, or non-obvious rendering logic.

## Testing Guidelines

No automated test framework is currently configured. For now, validate changes with `npm run build` and manual checks in `npm run dev`, especially across all visualization tabs. When adding tests, start with pure modules in `src/physics/` and use colocated `*.test.js` files or a dedicated `src/__tests__/` directory. Cover numerical edge cases such as invalid molar volumes, critical-point calculations, and density conversions.

## Commit & Pull Request Guidelines

This checkout does not include git history, so no repository-specific commit convention is available. Use concise imperative commits, for example `Add spinodal edge-case handling` or `Refine 3D axis controls`. Pull requests should include a short purpose statement, screenshots or screen recordings for UI changes, manual test notes, and any relevant issue links. Document changes to equations, constants, or gas data explicitly.

## Agent-Specific Instructions

Before making project changes, check `docs/ARCHITECTURE.md` for file routing and `docs/MODEL_NOTES.md` for equations, units, and numerical assumptions. Do not edit `node_modules/` or generated build output. Keep model changes isolated in `src/physics/` unless UI integration is required. After changing equations or visualization behavior, run `npm run build` before handing off.
