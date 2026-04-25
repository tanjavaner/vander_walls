# Model Notes

This document summarizes the equations, units, and implementation boundaries used by the app.

## Core Units

- Pressure `p`: atm
- Temperature `T`: K
- Molar volume `Vm`: L/mol
- Density `rho`: g/L
- Molar mass `M`: g/mol
- van der Waals constants: `a` in L^2 atm / mol^2, `b` in L/mol

## Classic vdW

Implemented in `src/physics/vdw.js`:

```text
p(Vm, T) = RT / (Vm - b) - a / Vm^2
```

The gas constant is `R = 0.08206`. Values where `Vm <= b` are treated as nonphysical and return `NaN`.

Derived critical values:

```text
Vc  = 3b
Tcr = 8a / (27Rb)
Pcr = a / (27b^2)
```

## TA-vdW Extension

Implemented in `src/physics/metastable.js`:

```text
p = vdW(Vm, T, a, b) + deltaPm(Vm) * lambda(tau)
deltaPm(Vm) = A * exp(-(Vm - V0)^2 / (2 sigma^2))
lambda(tau) = exp(-1 / tau), tau > 0
lambda(tau) = 0, tau <= 1e-6
```

The negative exponent in `lambda` is intentional: as `tau -> 0`, the metastable contribution vanishes and the model returns to classic vdW behavior.

## Density Conversion

Implemented in `src/physics/density.js`:

```text
rho = M / Vm
Vm = M / rho
rhoCr = M / (3b)
```

Use these helpers whenever a view supports both `Vm` and `rho` axes. Do not duplicate conversion math inside components.

## Numerical Notes

`src/physics/spinodal.js` detects local extrema by sampling, not by solving derivatives analytically. This is suitable for visualization, but tests for new physics behavior should include tolerance-based assertions rather than exact equality.

When changing formulas, manually compare all model modes in the UI and run `npm run build`.