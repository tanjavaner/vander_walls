/**
 * Yardımcı Fonksiyonlar
 * =====================
 * Sayı formatlama, aralık üretme vs.
 */

/** Doğrusal aralıkta n nokta üretir. */
export function linspace(a, b, n) {
  const count = Math.floor(n);
  if (!Number.isFinite(count) || count <= 0) return [];
  if (count === 1) return [a];
  return Array.from({ length: count }, (_, i) => a + ((b - a) * i) / (count - 1));
}

/** Bir sayıyı değerine göre uygun ondalıkla formatlar. */
export function formatTick(v) {
  const abs = Math.abs(v);
  if (abs >= 1000) return v.toFixed(0);
  if (abs >= 100)  return v.toFixed(1);
  if (abs >= 10)   return v.toFixed(2);
  if (abs >= 0.1)  return v.toFixed(3);
  return v.toFixed(4);
}

/** Eksen üzerinde taşmayı azaltmak için kompakt sayı formatı. */
export function formatCompactTick(v) {
  if (!Number.isFinite(v)) return '';

  const abs = Math.abs(v);
  if (abs >= 1e6 || (abs > 0 && abs < 1e-3)) return v.toExponential(1);
  if (abs >= 1e4) return `${(v / 1000).toFixed(0)}k`;
  if (abs >= 1000) return `${(v / 1000).toFixed(1)}k`;
  if (abs >= 100) return v.toFixed(0);
  if (abs >= 10) return v.toFixed(1);
  if (abs >= 1) return v.toFixed(2);
  return v.toFixed(3);
}

/** Clamp (değeri sınırlar içinde tut). */
export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
