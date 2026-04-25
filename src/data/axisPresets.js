/**
 * 3D Yüzey Eksen Seçenekleri ve Hazır Görünümler
 * ================================================
 *
 * Kullanıcı X, Y, Z eksenlerine istediği değişkeni atayabilir.
 * Buradaki "preset"ler tek tıkla çalışan ortak kombinasyonlardır.
 */

import { vdw } from '../physics/vdw.js';
import { deltaPm, lambda } from '../physics/metastable.js';
import { rhoFromVm } from '../physics/density.js';

/** Seçilebilir değişkenler ve UI renkleri. */
export const AXIS_VARS = {
  Vm:     { label: 'Vₘ  (molyar hacim)',     unit: 'L/mol', color: '#60a5fa' },
  rho:    { label: 'ρ  (yoğunluk)',          unit: 'g/L',   color: '#22d3ee' },
  T:      { label: 'T  (sıcaklık)',          unit: 'K',     color: '#fbbf24' },
  p:      { label: 'p  (basınç)',            unit: 'atm',   color: '#10b981' },
  dp:     { label: 'Δp  (metastabil katkı)', unit: 'atm',   color: '#a78bfa' },
  lambda: { label: 'Λ  (ağırlık fonk.)',     unit: '—',     color: '#f472b6' },
};

/** Tek tıkla uygulanabilir eksen kombinasyonları. */
export const AXIS_PRESETS = [
  { name: 'Standart:  p(Vₘ, T)',              x: 'Vm',  y: 'T',  z: 'p'      },
  { name: 'Yoğunluk:  p(ρ, T)',               x: 'rho', y: 'T',  z: 'p'      },
  { name: 'Ters:  p(T, Vₘ)',                  x: 'T',   y: 'Vm', z: 'p'      },
  { name: 'Metastabil katkı:  Δp(Vₘ, T)',     x: 'Vm',  y: 'T',  z: 'dp'     },
  { name: 'Metastabil katkı:  Δp(ρ, T)',      x: 'rho', y: 'T',  z: 'dp'     },
  { name: 'Ağırlık fonksiyonu:  Λ(Vₘ, T)',    x: 'Vm',  y: 'T',  z: 'lambda' },
  { name: 'Hacim projeksiyonu:  Vₘ(T, p)',    x: 'T',   y: 'p',  z: 'Vm'     },
  { name: 'Yoğunluk projeksiyonu:  ρ(T, p)',  x: 'T',   y: 'p',  z: 'rho'    },
  { name: 'Sıcaklık projeksiyonu:  T(Vₘ, p)', x: 'Vm',  y: 'p',  z: 'T'      },
];

/**
 * (Vₘ, T) ızgara noktasından istenen eksen değişkeninin değerini hesaplar.
 * withMeta true ise basınç hesabına metastabil katkı dahil edilir.
 */
export function computeVar(varKey, Vm, T, params, withMeta) {
  switch (varKey) {
    case 'Vm':  return Vm;
    case 'rho': return rhoFromVm(Vm, params.M);
    case 'T':   return T;
    case 'p': {
      let p = vdw(Vm, T, params.a, params.b);
      if (withMeta) p += deltaPm(Vm, params.A, params.V0, params.sigma) * lambda(params.tau);
      return p;
    }
    case 'dp':     return deltaPm(Vm, params.A, params.V0, params.sigma) * lambda(params.tau);
    case 'lambda': return lambda(params.tau);
    default:       return 0;
  }
}
