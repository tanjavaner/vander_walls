/**
 * Gaz Veritabanı
 * ==============
 *
 * 28 yaygın gaz için vdW sabitleri (a, b), kritik noktalar (Tcr, Pcr) ve
 * molyar kütleler (M) — CRC Handbook of Chemistry and Physics referansından.
 *
 * Birimler:
 *   a   [L²·atm/mol²]
 *   b   [L/mol]
 *   Tcr [K]
 *   Pcr [atm]
 *   M   [g/mol]
 *
 * Donma sıcaklığı Tfreeze — T-t termogramı için kullanılır (1 atm'de, K).
 */

import { criticalTemperature, criticalPressure, criticalVolume } from '../physics/vdw.js';

export const GAS_DB = {
  // Asal gazlar
  he:   { name: 'Helyum  He',            group: 'Asal gazlar',   a: 0.0346, b: 0.0238,   Tcr: 5.19,   Pcr: 2.24,   M: 4.003,   Tfreeze: 0.95 },
  ne:   { name: 'Neon  Ne',              group: 'Asal gazlar',   a: 0.2107, b: 0.01709,  Tcr: 44.40,  Pcr: 27.20,  M: 20.18,   Tfreeze: 24.56 },
  ar:   { name: 'Argon  Ar',             group: 'Asal gazlar',   a: 1.355,  b: 0.03201,  Tcr: 150.87, Pcr: 48.34,  M: 39.95,   Tfreeze: 83.80 },
  kr:   { name: 'Kripton  Kr',           group: 'Asal gazlar',   a: 2.325,  b: 0.0396,   Tcr: 209.4,  Pcr: 54.3,   M: 83.80,   Tfreeze: 115.78 },
  xe:   { name: 'Ksenon  Xe',            group: 'Asal gazlar',   a: 4.194,  b: 0.05105,  Tcr: 289.7,  Pcr: 57.6,   M: 131.29,  Tfreeze: 161.40 },

  // Küçük moleküller
  h2:   { name: 'Hidrojen  H₂',          group: 'Küçük moleküller', a: 0.2453, b: 0.02651, Tcr: 33.2,   Pcr: 12.80,  M: 2.016,   Tfreeze: 13.99 },
  n2:   { name: 'Azot  N₂',              group: 'Küçük moleküller', a: 1.390,  b: 0.0391,  Tcr: 126.2,  Pcr: 33.50,  M: 28.014,  Tfreeze: 63.15 },
  o2:   { name: 'Oksijen  O₂',           group: 'Küçük moleküller', a: 1.382,  b: 0.03186, Tcr: 154.58, Pcr: 49.77,  M: 31.998,  Tfreeze: 54.36 },
  co:   { name: 'Karbonmonoksit  CO',    group: 'Küçük moleküller', a: 1.485,  b: 0.03985, Tcr: 132.9,  Pcr: 34.50,  M: 28.01,   Tfreeze: 68.13 },
  no:   { name: 'Azotmonoksit  NO',      group: 'Küçük moleküller', a: 1.358,  b: 0.02789, Tcr: 180.0,  Pcr: 64.85,  M: 30.006,  Tfreeze: 109.50 },
  cl2:  { name: 'Klor  Cl₂',             group: 'Küçük moleküller', a: 6.579,  b: 0.05622, Tcr: 417.2,  Pcr: 76.00,  M: 70.906,  Tfreeze: 171.60 },

  // Su ve oksitler
  h2o:  { name: 'Su  H₂O',               group: 'Su & oksitler', a: 5.464,  b: 0.03049, Tcr: 647.1, Pcr: 217.75, M: 18.015,  Tfreeze: 273.15 },
  co2:  { name: 'Karbondioksit  CO₂',    group: 'Su & oksitler', a: 3.592,  b: 0.04267, Tcr: 304.2, Pcr: 72.90,  M: 44.01,   Tfreeze: 216.58 },
  so2:  { name: 'Kükürtdioksit  SO₂',    group: 'Su & oksitler', a: 6.865,  b: 0.05679, Tcr: 430.8, Pcr: 77.80,  M: 64.066,  Tfreeze: 200.00 },
  n2o:  { name: 'Diazotmonoksit  N₂O',   group: 'Su & oksitler', a: 3.832,  b: 0.04415, Tcr: 309.6, Pcr: 71.50,  M: 44.013,  Tfreeze: 182.30 },
  nh3:  { name: 'Amonyak  NH₃',          group: 'Su & oksitler', a: 4.170,  b: 0.03707, Tcr: 405.5, Pcr: 111.3,  M: 17.031,  Tfreeze: 195.40 },
  hcl:  { name: 'Hidrojen klorür  HCl',  group: 'Su & oksitler', a: 3.667,  b: 0.04081, Tcr: 324.7, Pcr: 82.00,  M: 36.461,  Tfreeze: 158.95 },
  sf6:  { name: 'Kükürthekzaflorür  SF₆',group: 'Su & oksitler', a: 7.857,  b: 0.0879,  Tcr: 318.7, Pcr: 37.10,  M: 146.06,  Tfreeze: 222.45 },

  // Hidrokarbonlar
  ch4:  { name: 'Metan  CH₄',            group: 'Hidrokarbonlar', a: 2.283, b: 0.04278, Tcr: 190.6, Pcr: 45.44,   M: 16.043,  Tfreeze: 90.69 },
  c2h6: { name: 'Etan  C₂H₆',            group: 'Hidrokarbonlar', a: 5.562, b: 0.0638,  Tcr: 305.4, Pcr: 48.20,   M: 30.07,   Tfreeze: 90.35 },
  c2h4: { name: 'Etilen  C₂H₄',          group: 'Hidrokarbonlar', a: 4.612, b: 0.0582,  Tcr: 282.4, Pcr: 49.70,   M: 28.054,  Tfreeze: 103.99 },
  c3h8: { name: 'Propan  C₃H₈',          group: 'Hidrokarbonlar', a: 8.779, b: 0.0845,  Tcr: 369.8, Pcr: 41.90,   M: 44.097,  Tfreeze: 85.53 },
  c4h10:{ name: 'n-Bütan  C₄H₁₀',        group: 'Hidrokarbonlar', a: 14.66, b: 0.1226,  Tcr: 425.2, Pcr: 37.50,   M: 58.124,  Tfreeze: 134.60 },
  c6h6: { name: 'Benzen  C₆H₆',          group: 'Hidrokarbonlar', a: 18.00, b: 0.1154,  Tcr: 562.0, Pcr: 48.30,   M: 78.114,  Tfreeze: 278.68 },
  c7h8: { name: 'Toluen  C₇H₈',          group: 'Hidrokarbonlar', a: 24.38, b: 0.1463,  Tcr: 591.8, Pcr: 41.00,   M: 92.141,  Tfreeze: 178.15 },

  // Alkoller & organikler
  meoh: { name: 'Metanol  CH₃OH',        group: 'Alkoller & organik', a: 9.649, b: 0.06702, Tcr: 512.6, Pcr: 79.90, M: 32.042,  Tfreeze: 175.47 },
  etoh: { name: 'Etanol  C₂H₅OH',        group: 'Alkoller & organik', a: 12.02, b: 0.08407, Tcr: 513.9, Pcr: 60.60, M: 46.069,  Tfreeze: 159.05 },
  ac:   { name: 'Aseton  (CH₃)₂CO',      group: 'Alkoller & organik', a: 16.02, b: 0.1124,  Tcr: 508.1, Pcr: 46.40, M: 58.08,   Tfreeze: 178.50 },
};

/**
 * Verilen a, b değerlerinden grafik sınırları türet.
 * Yeni bir maddeye geçildiğinde eksenlerin otomatik ayarlanması için.
 */
export function deriveBounds(a, b) {
  const Vc = criticalVolume(b);
  const Tcr_calc = criticalTemperature(a, b);
  const Pcr_calc = criticalPressure(a, b);

  return {
    Vmin: b * 1.05,
    Vmax: Vc * 10,
    Tmin: Tcr_calc * 0.3,
    Tmax: Tcr_calc * 1.8,
    Tdef: Tcr_calc * 0.9,
    Pmin: Math.max(0.01, Pcr_calc * 0.05),
    Pmax: Pcr_calc * 2.0,
    Pdef: Pcr_calc * 0.7,
    A: Pcr_calc * 0.08,
    V0: Vc * 0.6,
    sigma: Vc * 0.18,
  };
}

/** Bir gaz girişine grafik sınırlarını ekler. */
export function expandPreset(gas) {
  return { ...gas, ...deriveBounds(gas.a, gas.b) };
}

/** Tüm presetler, sınırları türetilmiş. */
export const PRESETS = Object.fromEntries(
  Object.entries(GAS_DB).map(([k, v]) => [k, expandPreset(v)])
);

/** "Özel madde" modunun varsayılan parametreleri. */
export const CUSTOM_DEFAULT = (() => {
  const bounds = deriveBounds(5.0, 0.05);
  return {
    name: 'Özel madde',
    group: 'Özel',
    a: 5.0,
    b: 0.05,
    M: 50.0,
    Tcr: criticalTemperature(5.0, 0.05),
    Pcr: criticalPressure(5.0, 0.05),
    Tfreeze: 200,
    ...bounds,
  };
})();
