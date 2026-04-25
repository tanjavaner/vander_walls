# Architecture Map

This document is a quick routing guide for contributors and coding agents.

## Runtime Stack

- Vite serves and bundles the app.
- React owns state, layout, controls, and tab selection.
- Tailwind classes handle most styling.
- Recharts renders 2D charts.
- Three.js renders the 3D surface view.
- `lucide-react` provides interface icons.

## Data Flow

`src/main.jsx` mounts `App`. `src/App.jsx` creates app-level UI state:

- selected tab: `iso`, `isobar`, `3d`, `jump`, `thermo`
- model mode: classic, compare, or TA-vdW
- axis mode: molar volume `Vm` or density `rho`

Domain parameters come from `src/hooks/useParams.js`. That hook loads presets from `src/data/gases.js`, tracks the current temperature and pressure, and recalculates critical values when `a` or `b` changes.

## Main Editing Paths

- Add or adjust a gas: edit `src/data/gases.js`.
- Add a parameter control: update `src/components/controls/ParameterPanel.jsx` and, if needed, `useParams.js`.
- Change pure formulas: edit `src/physics/`.
- Add a 2D view: create a component in `src/components/views/`, then add a tab and conditional render in `App.jsx`.
- Add a 3D axis preset: update `src/data/axisPresets.js`.
- Change reusable UI styling: prefer `src/components/ui/` before adding global CSS.

## View Responsibilities

- `IsothermsView.jsx`: pressure-volume curves at fixed temperature.
- `IsobarsView.jsx`: temperature-volume curves at fixed pressure.
- `Surface3DView.jsx`: configurable Three.js surface.
- `JumpAnimationView.jsx`: tau-to-zero transition animation.
- `ThermogramView.jsx`: time-temperature thermogram model.

## Design Constraints

Keep `src/physics/` independent of React and DOM APIs. Views should prepare render data but avoid owning equation logic. Shared formatting, clamping, and sampling helpers belong in `src/utils/format.js`.