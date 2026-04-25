/**
 * Gaz Seçici — dropdown + özel madde girişi.
 */
import { useMemo } from 'react';
import { Beaker } from 'lucide-react';
import { PRESETS } from '../../data/gases.js';

export default function GasSelector({
  presetKey,
  isCustom,
  customName,
  setCustomName,
  applyPreset,
  autoFitBounds,
  params,
}) {
  const groupedGases = useMemo(() => {
    const groups = {};
    Object.entries(PRESETS).forEach(([k, v]) => {
      if (!groups[v.group]) groups[v.group] = [];
      groups[v.group].push({ key: k, ...v });
    });
    return groups;
  }, []);

  return (
    <>
      <section className="mb-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Beaker size={14} className="text-slate-500" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Madde Seçimi</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <select
                value={presetKey}
                onChange={(e) => applyPreset(e.target.value)}
                className="w-full appearance-none bg-slate-900/60 border border-slate-700 hover:border-slate-500 focus:border-amber-400 focus:outline-none rounded px-4 py-2.5 pr-10 text-sm text-slate-100 transition-colors cursor-pointer">
                <option value="__custom__">✎ Özel madde (parametreleri kendim gireceğim)</option>
                {Object.entries(groupedGases).map(([group, gases]) => (
                  <optgroup key={group} label={`── ${group} ──`}>
                    {gases.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g.name}  ·  Tcr={g.Tcr.toFixed(1)}K  ·  Pcr={g.Pcr.toFixed(1)}atm
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/60">▾</div>
            </div>
            {isCustom && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Madde adı"
                className="bg-slate-900/60 border border-slate-700 focus:border-amber-400 focus:outline-none rounded px-3 py-2.5 text-sm text-slate-100 sm:w-44"
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCustom && (
            <button
              onClick={autoFitBounds}
              className="px-3 py-2.5 text-xs font-medium bg-slate-900/60 border border-slate-700 hover:border-amber-400/60 text-slate-300 hover:text-amber-200 rounded transition-all whitespace-nowrap"
              title="Vₘ, T, P aralıklarını a ve b değerlerine göre yeniden hesapla">
              ⟲ Sınırları otomatik ayarla
            </button>
          )}
        </div>
      </section>

      <section className="mb-4 p-3 bg-gradient-to-r from-amber-400/5 via-slate-900/0 to-slate-900/0 border border-slate-800 rounded flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono">Aktif</span>
          <span className="font-serif italic text-xl text-slate-100">
            {isCustom ? customName : PRESETS[presetKey]?.name}
          </span>
        </div>
        <div className="flex items-baseline gap-4 font-mono text-xs text-slate-400 ml-auto">
          <span>Tcr = <span className="text-amber-300">{params.Tcr.toFixed(2)}</span> K</span>
          <span>Pcr = <span className="text-amber-300">{params.Pcr.toFixed(2)}</span> atm</span>
          <span>Vc ≈ <span className="text-amber-300">{(3 * params.b).toFixed(4)}</span> L/mol</span>
          <span>M = <span className="text-amber-300">{params.M?.toFixed(2)}</span> g/mol</span>
        </div>
      </section>
    </>
  );
}
