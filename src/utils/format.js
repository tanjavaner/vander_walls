/**
 * Yardımcı Fonksiyonlar
 * =====================
 * Sayı formatlama, aralık üretme vs.
 */

/** Doğrusal aralıkta n nokta üretir. */
export function linspace(a, b, n) {
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
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

/** Clamp (değeri sınırlar içinde tut). */
export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
