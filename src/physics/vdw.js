/**
 * Klasik van der Waals Hal Denklemi
 * ==================================
 *
 *     p = RT/(Vₘ - b) - a/Vₘ²
 *
 * Burada:
 *   p   — basınç (atm)
 *   Vₘ  — molyar hacim (L/mol)
 *   T   — sıcaklık (K)
 *   a   — moleküller arası çekim sabiti (L²·atm/mol²)
 *   b   — moleküler hacim sabiti (L/mol)
 *
 * Kritik nokta parametreleri (vdW'den türetilen):
 *   Vc  = 3b          (kritik molyar hacim)
 *   Tcr = 8a/(27Rb)   (kritik sıcaklık)
 *   Pcr = a/(27b²)    (kritik basınç)
 */

import { R } from './constants.js';

/**
 * van der Waals denklemi — basıncı hesaplar.
 * @param {number} Vm - molyar hacim (L/mol)
 * @param {number} T  - sıcaklık (K)
 * @param {number} a  - çekim sabiti
 * @param {number} b  - hacim sabiti
 * @returns {number} basınç (atm) — fiziksel olmayan durumda NaN
 */
export function vdw(Vm, T, a, b) {
  if (Vm <= b) return NaN; // Vₘ ≤ b fiziksel değil (moleküller üst üste)
  return (R * T) / (Vm - b) - a / (Vm * Vm);
}

/**
 * Ters vdW: verilen P ve Vₘ için T hesapla.
 * Formül:  T = (P + a/Vₘ²)(Vₘ - b) / R
 */
export function tAtP(Vm, P, a, b) {
  if (Vm <= b) return NaN;
  return ((P + a / (Vm * Vm)) * (Vm - b)) / R;
}

/**
 * Kritik sıcaklık (a, b'den türetilmiş).
 */
export function criticalTemperature(a, b) {
  return (8 * a) / (27 * R * b);
}

/**
 * Kritik basınç (a, b'den türetilmiş).
 */
export function criticalPressure(a, b) {
  return a / (27 * b * b);
}

/**
 * Kritik molyar hacim.
 */
export function criticalVolume(b) {
  return 3 * b;
}
