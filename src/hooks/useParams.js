/**
 * Parametre state yönetimi için özel hook.
 *
 * Bir preset seçmek, "Özel" moduna geçmek ve kritik referans değerlerini
 * kullanıcı girdisiyle yönetmek gibi işlemleri tek yerden yönetir.
 */

import { useState, useCallback } from 'react';
import { PRESETS, CUSTOM_DEFAULT, deriveBounds } from '../data/gases.js';

const CUSTOM_KEY = '__custom__';
const DEFAULT_KEY = 'c6h6'; // benzen

function clampValue(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

export function useParams() {
  const [presetKey, setPresetKey] = useState(DEFAULT_KEY);
  const [customName, setCustomName] = useState('Özel madde');

  const isCustom = presetKey === CUSTOM_KEY;
  const preset = isCustom ? CUSTOM_DEFAULT : PRESETS[presetKey];

  const [params, setParams] = useState(() => ({ ...preset, tau: 2.0 }));
  const [T, setT] = useState(preset.Tdef);
  const [P, setP] = useState(preset.Pdef);

  const markCustom = useCallback((name) => {
    if (isCustom) return;

    const prev = PRESETS[presetKey];
    setPresetKey(CUSTOM_KEY);
    setCustomName(name ?? (prev ? `Özel (${prev.name} türevi)` : 'Özel madde'));
  }, [isCustom, presetKey]);

  /** Preset seçimi — tüm parametreleri günceller. */
  const applyPreset = useCallback((key) => {
    const pr = key === CUSTOM_KEY ? CUSTOM_DEFAULT : PRESETS[key];
    if (!pr) return;

    setPresetKey(key);
    if (key === CUSTOM_KEY) setCustomName(pr.name);

    setParams({ ...pr, tau: 2.0 });
    setT(pr.Tdef);
    setP(pr.Pdef);
  }, []);

  /** Tek parametre güncelleme. */
  const update = useCallback((k) => (v) => {
    setParams((p) => ({ ...p, [k]: v }));
  }, []);

  /**
   * a veya b değiştiğinde Tcr/Pcr artık otomatik ezilmez.
   * Eğer kullanıcı preset'te ise otomatik "Özel" moduna geçiyoruz.
   */
  const updateAB = useCallback((key) => (v) => {
    setParams((p) => ({ ...p, [key]: v }));
    markCustom();
  }, [markCustom]);

  /** Tcr ve Pcr birbirinden bağımsız düzenlenir; yalnızca ilgili eksen aralığı güncellenir. */
  const updateCritical = useCallback((key) => (v) => {
    if (!Number.isFinite(v) || v <= 0) return;

    setParams((p) => {
      if (key === 'Tcr') {
        return { ...p, Tcr: v, Tmin: v * 0.3, Tmax: v * 1.8 };
      }

      if (key === 'Pcr') {
        return { ...p, Pcr: v, Pmin: Math.max(0.01, v * 0.05), Pmax: v * 2 };
      }

      return p;
    });

    if (key === 'Tcr') {
      setT((current) => clampValue(current, v * 0.3, v * 1.8, v * 0.9));
    } else if (key === 'Pcr') {
      const min = Math.max(0.01, v * 0.05);
      setP((current) => clampValue(current, min, v * 2, v * 0.7));
    }

    markCustom();
  }, [markCustom]);

  /** Grafik sınırlarını a, b'ye göre otomatik yeniden hesapla. */
  const autoFitBounds = useCallback(() => {
    const bounds = deriveBounds(params.a, params.b);
    setParams((p) => ({
      ...p,
      Vmin: bounds.Vmin, Vmax: bounds.Vmax,
      Tmin: bounds.Tmin, Tmax: bounds.Tmax,
      Pmin: bounds.Pmin, Pmax: bounds.Pmax,
    }));
    setT(bounds.Tdef);
    setP(bounds.Pdef);
  }, [params.a, params.b]);

  return {
    presetKey, isCustom, customName, setCustomName,
    params, T, P, setT, setP,
    applyPreset, update, updateAB, updateCritical, autoFitBounds,
  };
}
