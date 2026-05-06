/**
 * Yoğunluk (ρ) ↔ Molyar Hacim (Vₘ) Dönüşümü
 * ==========================================
 *
 *     ρ = M / Vₘ    (g/L)
 *     Vₘ = M / ρ    (L/mol)
 *
 * Burada M molyar kütledir (g/mol).
 *
 * vdW denkleminin yoğunluk cinsinden formu (türetme):
 *
 *     p = RTρ/(M - bρ) - aρ²/M²
 *
 * Kritik yoğunluk:
 *
 *     ρcr = M/(3b)
 */

/**
 * Molyar hacimden yoğunluğa dönüşüm.
 * @param {number} Vm - molyar hacim (L/mol)
 * @param {number} M  - molyar kütle (g/mol)
 * @returns {number} yoğunluk (g/L)
 */
export function rhoFromVm(Vm, M) {
  if (![Vm, M].every(Number.isFinite) || Vm <= 0 || M <= 0) return NaN;
  return M / Vm;
}

/**
 * Yoğunluktan molyar hacme dönüşüm.
 */
export function vmFromRho(rho, M) {
  if (![rho, M].every(Number.isFinite) || rho <= 0 || M <= 0) return NaN;
  return M / rho;
}

/**
 * Kritik yoğunluk ρcr = M/(3b).
 */
export function criticalDensity(b, M) {
  if (![b, M].every(Number.isFinite) || b <= 0 || M <= 0) return NaN;
  return M / (3 * b);
}
