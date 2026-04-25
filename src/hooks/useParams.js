/**
 * Parametre state yönetimi için özel hook.
 *
 * Bir preset seçmek, "Özel" moduna geçmek, a/b'yi değiştirirken Tcr/Pcr'yi
 * otomatik yeniden hesaplamak gibi işlemleri tek yerden yönetir.
 */

import { useState, useCallback } from 'react';
import { PRESETS, CUSTOM_DEFAULT, deriveBounds } from '../data/gases.js';
import { criticalTemperature, criticalPressure } from '../physics/vdw.js';

const CUSTOM_KEY = '__custom__';
const DEFAULT_KEY = 'c6h6'; // benzen

export function useParams() {
  const [presetKey, setPresetKey] = useState(DEFAULT_KEY);
  const [customName, setCustomName] = useState('Özel madde');

  const isCustom = presetKey === CUSTOM_KEY;
  const preset = isCustom ? CUSTOM_DEFAULT : PRESETS[presetKey];

  const [params, setParams] = useState(() => ({ ...preset, tau: 2.0 }));
  const [T, setT] = useState(preset.Tdef);
  const [P, setP] = useState(preset.Pdef);

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
   * a veya b değiştiğinde Tcr, Pcr yeniden hesaplanmalı.
   * Eğer kullanıcı preset'te ise otomatik "Özel" moduna geçiyoruz.
   */
  const updateAB = useCallback((key) => (v) => {
    setParams((p) => {
      const next = { ...p, [key]: v };
      next.Tcr = criticalTemperature(next.a, next.b);
      next.Pcr = criticalPressure(next.a, next.b);
      return next;
    });

    if (!isCustom) {
      const prev = PRESETS[presetKey];
      setPresetKey(CUSTOM_KEY);
      setCustomName(prev ? `Özel (${prev.name} türevi)` : 'Özel madde');
    }
  }, [isCustom, presetKey]);

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
    applyPreset, update, updateAB, autoFitBounds,
  };
}
