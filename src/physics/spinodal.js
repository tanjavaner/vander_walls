/**
 * Spinodal Nokta Tespiti
 * ======================
 *
 * Subkritik izotermlerde spinodal sınırlarını bulur:
 *
 *     dp/dVₘ = 0  iki noktada sağlanır:
 *       - sıvı tarafında yerel MINIMUM basınç
 *       - gaz tarafında yerel MAKSIMUM basınç
 *
 * Bu iki nokta arasında kalan bölge mekanik olarak kararsızdır.
 * Metastabil kollar spinodal sınırlarına kadar uzanır.
 */

import { R } from './constants.js';
import { vdw, criticalTemperature, criticalVolume } from './vdw.js';
import { metaContribution } from './metastable.js';
import { linspace } from '../utils/format.js';

/**
 * İzoterm üzerinde spinodal noktaları bulur.
 *
 * vdW için spinodal koşulu:
 *     dp/dVm = -RT/(Vm-b)^2 + 2a/Vm^3 = 0
 *
 * T < Tcr iken iki kök vardır:
 *   - küçük hacim kökü: sıvı spinodalı, yerel basınç minimumu
 *   - büyük hacim kökü: gaz spinodalı, yerel basınç maksimumu
 *
 * @returns {null | { Vliq, Vgas, pMax, pMin }} Kritik üstü ise null
 */
export function findSpinodal(T, a, b, Vmin, Vmax) {
  if (![T, a, b].every(Number.isFinite) || T <= 0 || a <= 0 || b <= 0) return null;

  const Tcr = criticalTemperature(a, b);
  if (!Number.isFinite(Tcr) || T >= Tcr * (1 - 1e-10)) return null;

  const Vc = criticalVolume(b);
  const dPdV = (Vm) => -(R * T) / ((Vm - b) * (Vm - b)) + (2 * a) / (Vm * Vm * Vm);
  const lower = b * (1 + 1e-8);

  const Vliq = bisectRoot(dPdV, lower, Vc);
  if (!Number.isFinite(Vliq)) return null;

  let upper = Math.max(Number.isFinite(Vmax) ? Vmax : Vc * 10, Vc * 1.01);
  let fUpper = dPdV(upper);
  let guard = 0;
  while (Number.isFinite(fUpper) && fUpper > 0 && guard < 80) {
    upper *= 1.5;
    fUpper = dPdV(upper);
    guard += 1;
  }

  const Vgas = bisectRoot(dPdV, Vc, upper);
  if (!Number.isFinite(Vgas) || Vliq >= Vgas) return null;

  const pMin = vdw(Vliq, T, a, b);
  const pMax = vdw(Vgas, T, a, b);
  if (![pMin, pMax].every(Number.isFinite)) return null;

  return {
    Vliq,
    Vgas,
    pMax,
    pMin,
  };
}

/**
 * Gaz kolunda verilen basınca karşılık gelen molyar hacmi bulur.
 * Başlangıç hacmi gaz spinodalının sağında seçilmelidir.
 */
export function findGasVolumeAtPressure(T, a, b, targetP, Vstart, Vmax) {
  if (![T, a, b, targetP, Vstart].every(Number.isFinite)) return null;
  if (T <= 0 || a <= 0 || b <= 0 || targetP <= 0 || Vstart <= b) return null;

  const f = (Vm) => vdw(Vm, T, a, b) - targetP;
  const lower = Vstart * (1 + 1e-8);
  const fLower = f(lower);
  if (!Number.isFinite(fLower) || fLower < 0) return null;

  let upper = Math.max(Number.isFinite(Vmax) ? Vmax : lower * 2, lower * 1.1);
  let fUpper = f(upper);
  let guard = 0;
  while (Number.isFinite(fUpper) && fUpper > 0 && guard < 100) {
    upper *= 1.5;
    fUpper = f(upper);
    guard += 1;
  }

  const root = bisectRoot(f, lower, upper, 100);
  return Number.isFinite(root) ? root : null;
}

function bisectRoot(fn, lo, hi, maxIter = 80) {
  let fLo = fn(lo);
  let fHi = fn(hi);

  if (!Number.isFinite(fLo) || !Number.isFinite(fHi)) return NaN;
  if (Math.abs(fLo) < 1e-12) return lo;
  if (Math.abs(fHi) < 1e-12) return hi;
  if (fLo * fHi > 0) return NaN;

  let a = lo;
  let b = hi;
  for (let i = 0; i < maxIter; i++) {
    const mid = (a + b) / 2;
    const fMid = fn(mid);

    if (!Number.isFinite(fMid)) return NaN;
    if (Math.abs(fMid) < 1e-12 || Math.abs(b - a) < 1e-12) return mid;

    if (fLo * fMid <= 0) {
      b = mid;
      fHi = fMid;
    } else {
      a = mid;
      fLo = fMid;
    }
  }

  return (a + b) / 2;
}

/**
 * TAĞ ve klasik vdW arasındaki maksimum basınç sapmasını hesaplar.
 * Sunum ve karşılaştırma amaçlı bir tek-satır özet üretir.
 */
export function maxDeviation(T, params) {
  const Vs = linspace(Math.max(params.Vmin, params.b * 1.02), params.Vmax, 200);
  let maxAbs = 0;
  let atV = 0;
  let signed = 0;

  for (const v of Vs) {
    const d = metaContribution(v, params);

    if (Math.abs(d) > maxAbs) {
      maxAbs = Math.abs(d);
      atV = v;
      signed = d;
    }
  }

  return { maxAbs, atV, signed };
}
