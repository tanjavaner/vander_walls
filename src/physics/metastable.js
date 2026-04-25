/**
 * Metastabil Katkı ve TAĞ-vdW Denklemi
 * =====================================
 *
 * Klasik vdW denklemine metastabil fazın varlığını ifade eden bir terim
 * eklenir:
 *
 *     p(Vₘ, T) = [klasik vdW] + Δpₘ(Vₘ) · Λ(τ)
 *
 * İki yeni bileşen:
 *   Δpₘ(Vₘ) — metastabil katkı profili (Gauss kümesi olarak modellenmiş)
 *   Λ(τ)    — ağırlık fonksiyonu (metastabil ömür τ'ya bağlı)
 *
 * Kritik sonlanma koşulu:
 *   τ → 0  ⟹  Λ → 0  ⟹  model klasik vdW'ye iner
 *
 * Bu dosya sadece TAĞ bileşenlerini tanımlar. Klasik vdW için vdw.js'e bakın.
 */

import { vdw } from './vdw.js';

/**
 * Metastabil katkı terimi Δpₘ(Vₘ).
 * Dokümanda önerilen Gauss formu:
 *
 *     Δpₘ(Vₘ) = A · exp(-(Vₘ - V₀)²/(2σ²))
 *
 * @param {number} Vm    - molyar hacim
 * @param {number} A     - tepe yüksekliği (atm)
 * @param {number} V0    - tepe merkezi (L/mol)
 * @param {number} sigma - genişlik (L/mol)
 */
export function deltaPm(Vm, A, V0, sigma) {
  const d = Vm - V0;
  return A * Math.exp(-(d * d) / (2 * sigma * sigma));
}

/**
 * Ağırlık fonksiyonu Λ(τ).
 *
 *     Λ(τ) = exp(-1/τ)   , τ > 0
 *     Λ(τ) = 0           , τ → 0
 *
 * NOT: Dokümanda "exp(1/τ)" yazılmış, ancak τ→0 limitinde Λ→0 olması için
 * işaret eksi olmalıdır. Matematiksel tutarlılık gereği burada -1/τ kullanıldı.
 *
 * @param {number} tau - metastabil ömür (birimsiz)
 */
export function lambda(tau) {
  if (tau <= 1e-6) return 0;
  return Math.exp(-1 / tau);
}

/**
 * Tam TAĞ-vdW denklemi.
 *
 *     p = vdW(Vₘ, T, a, b) + Δpₘ(Vₘ) · Λ(τ)
 *
 * @param {number} Vm - molyar hacim
 * @param {number} T  - sıcaklık
 * @param {object} p  - parametre nesnesi { a, b, A, V0, sigma, tau }
 */
export function tagVdw(Vm, T, p) {
  return vdw(Vm, T, p.a, p.b) + deltaPm(Vm, p.A, p.V0, p.sigma) * lambda(p.tau);
}

/**
 * Metastabil katkının tam etkisi (Δpₘ × Λ).
 * Ek terimin toplam büyüklüğünü tek seferde verir.
 */
export function metaContribution(Vm, p) {
  return deltaPm(Vm, p.A, p.V0, p.sigma) * lambda(p.tau);
}
