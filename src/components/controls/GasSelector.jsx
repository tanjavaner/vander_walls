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
    Object.entries(PRESETS).forEach(([key, value]) => {
      if (!groups[value.group]) groups[value.group] = [];
      groups[value.group].push({ key, ...value });
    });
    return groups;
  }, []);

  return (
    <>
      <section className="mb-4 grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Beaker size={14} className="text-slate-400" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Madde seçimi
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <select
                value={presetKey}
                onChange={(e) => applyPreset(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-800 transition-colors hover:border-slate-400 focus:border-slate-900 focus:outline-none"
              >
                <option value="__custom__">✎ Özel madde (parametreleri kendim gireceğim)</option>
                {Object.entries(groupedGases).map(([group, gases]) => (
                  <optgroup key={group} label={`── ${group} ──`}>
                    {gases.map((gas) => (
                      <option key={gas.key} value={gas.key}>
                        {gas.name} · Tcr={gas.Tcr.toFixed(1)}K · Pcr={gas.Pcr.toFixed(1)}atm
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</div>
            </div>

            {isCustom && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Madde adı"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-slate-900 focus:outline-none sm:w-44"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCustom && (
            <button
              onClick={autoFitBounds}
              className="whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950"
              title="Vₘ, T, P aralıklarını a ve b değerlerine göre yeniden hesapla"
            >
              ⟳ Sınırları otomatik ayarla
            </button>
          )}
        </div>
      </section>

      <section className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Aktif</span>
          <span className="text-lg font-semibold text-slate-900">
            {isCustom ? customName : PRESETS[presetKey]?.name}
          </span>
        </div>

        <div className="ml-auto flex items-baseline gap-4 font-mono text-xs text-slate-500">
          <span>Tcr = <span className="text-slate-900">{params.Tcr.toFixed(2)}</span> K</span>
          <span>Pcr = <span className="text-slate-900">{params.Pcr.toFixed(2)}</span> atm</span>
          <span>Vc ≈ <span className="text-slate-900">{(3 * params.b).toFixed(4)}</span> L/mol</span>
          <span>M = <span className="text-slate-900">{params.M?.toFixed(2)}</span> g/mol</span>
        </div>
      </section>
    </>
  );
}
