/**
 * Spinodal Nokta Tespiti
 * ======================
 *
 * Subkritik izotermlerde S-bölgesinin sınırlarını bulur:
 *
 *     dp/dVₘ = 0  iki noktada sağlanır:
 *       - sıvı tarafında yerel MAKSIMUM (spinodal üst sınır)
 *       - gaz tarafında yerel MINIMUM  (spinodal alt sınır)
 *
 * Bu iki nokta arasında kalan bölge metastabilite için geçerlidir.
 * Kararsız orta bölge bu iki spinodal arasında yer alır.
 */

import { vdw } from './vdw.js';
import { linspace } from '../utils/format.js';

/**
 * İzoterm üzerinde spinodal noktaları (yerel max/min) bulur.
 *
 * @returns {null | { Vliq, Vgas, pMax, pMin }} Kritik üstü ise null
 */
export function findSpinodal(T, a, b, Vmin, Vmax) {
  const Vs = linspace(Math.max(Vmin, b * 1.01), Vmax, 800);
  const ps = Vs.map((v) => vdw(v, T, a, b));

  let maxIdx = -1;
  let minIdx = -1;
  let maxP = -Infinity;
  let minP = Infinity;

  for (let i = 2; i < ps.length - 2; i++) {
    if (!Number.isFinite(ps[i])) continue;

    // Sıvı tarafında yerel maksimum
    if (ps[i - 1] < ps[i] && ps[i + 1] < ps[i]) {
      if (ps[i] > maxP) {
        maxP = ps[i];
        maxIdx = i;
      }
    }
    // Gaz tarafında yerel minimum
    if (ps[i - 1] > ps[i] && ps[i + 1] > ps[i]) {
      if (ps[i] < minP) {
        minP = ps[i];
        minIdx = i;
      }
    }
  }

  if (maxIdx < 0 || minIdx < 0 || maxIdx >= minIdx) return null;

  return {
    Vliq: Vs[maxIdx],
    Vgas: Vs[minIdx],
    pMax: maxP,
    pMin: minP,
  };
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
    const d =
      Math.exp(-1 / (params.tau > 1e-6 ? params.tau : 1e-6)) *
      params.A *
      Math.exp(-((v - params.V0) ** 2) / (2 * params.sigma * params.sigma));

    if (Math.abs(d) > maxAbs) {
      maxAbs = Math.abs(d);
      atV = v;
      signed = d;
    }
  }

  return { maxAbs, atV, signed };
}
