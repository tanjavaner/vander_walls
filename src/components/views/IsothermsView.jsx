/**
 * İzotermler Görünümü  —  p vs Vₘ (veya ρ)
 *
 * Dört izoterm birden çizilir (subkritik, seçili, kritik, süperkritik).
 * Seçili izoterm compare modunda iki eğri halinde gösterilir.
 * Altında Δp(Vₘ) profil grafiği yer alır.
 */
import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Area, ComposedChart,
} from 'recharts';

import { vdw } from '../../physics/vdw.js';
import { deltaPm, lambda } from '../../physics/metastable.js';
import { rhoFromVm } from '../../physics/density.js';
import { findSpinodal, maxDeviation } from '../../physics/spinodal.js';
import { linspace } from '../../utils/format.js';

export default function IsothermsView({ params, T, modelMode, axisMode }) {
  const { a, b, Tcr, Vmin, Vmax, M } = params;
  const isTag = modelMode === 'tag';
  const isCompare = modelMode === 'compare';
  const isClassic = modelMode === 'classic';
  const useRho = axisMode === 'rho';
  const xKey = useRho ? 'rho' : 'Vm';
  const xLabel = useRho ? 'ρ  [g/L]' : 'Vₘ  [L/mol]';
  const xUnit = useRho ? 'g/L' : 'L/mol';

  // Ana veri: farklı sıcaklıklarda tüm eğriler
  const data = useMemo(() => {
    const Vs = linspace(Math.max(Vmin, b * 1.02), Vmax, 300);
    return Vs.map((v) => {
      const classic = vdw(v, T, a, b);
      const meta = deltaPm(v, params.A, params.V0, params.sigma) * lambda(params.tau);
      return {
        Vm: v,
        rho: rhoFromVm(v, M),
        pClassic: classic,
        pTag: classic + meta,
        pCritical: vdw(v, Tcr, a, b),
        pSup: vdw(v, Tcr * 1.15, a, b),
        pSub: vdw(v, Tcr * 0.85, a, b),
        delta: meta,
      };
    });
  }, [params, T, M, a, b, Tcr, Vmin, Vmax]);

  const spinodal = useMemo(
    () => findSpinodal(T, a, b, Vmin, Vmax),
    [T, a, b, Vmin, Vmax]
  );

  const deviation = useMemo(() => maxDeviation(T, params), [params, T]);

  const yDomain = useMemo(() => {
    const vals = data.flatMap((d) =>
      [d.pClassic, d.pTag, d.pCritical, d.pSup, d.pSub].filter(Number.isFinite)
    );
    if (!vals.length) return [0, 100];
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = (hi - lo) * 0.05;
    return [Math.max(lo - pad, -20), Math.min(hi + pad, params.Pcr * 3)];
  }, [data, params.Pcr]);

  const mainKey = isTag ? 'pTag' : 'pClassic';
  const mainColor = isTag ? '#10b981' : '#fbbf24';
  const mainLabel = isTag ? `TAĞ-vdW @ T=${T.toFixed(0)}K` : `Klasik vdW @ T=${T.toFixed(0)}K`;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-serif text-slate-100">p–{useRho ? 'ρ' : 'Vₘ'} Diyagramı · İzotermler</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCompare && 'İki model üst üste: sarı = klasik, yeşil = TAĞ-vdW'}
            {isTag && 'Metastabil düzeltmeli model: klasik terim + Δpₘ·Λ(τ)'}
            {isClassic && 'Klasik van der Waals — yalnızca denge durumları'}
          </p>
        </div>

        {!isClassic && deviation.maxAbs > 0.001 && (
          <div className="flex items-center gap-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded font-mono text-[10px]">
            <div>
              <div className="text-emerald-400/60 uppercase tracking-wider text-[9px]">Max sapma</div>
              <div className="text-emerald-300 text-sm tabular-nums">
                {deviation.signed >= 0 ? '+' : ''}{deviation.signed.toFixed(2)} atm
              </div>
            </div>
            <div className="w-px h-7 bg-emerald-500/20" />
            <div>
              <div className="text-emerald-400/60 uppercase tracking-wider text-[9px]">@ {useRho ? 'ρ' : 'Vₘ'}</div>
              <div className="text-emerald-300 text-sm tabular-nums">
                {(useRho ? rhoFromVm(deviation.atV, M) : deviation.atV).toFixed(useRho ? 1 : 3)} {xUnit}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" />
            <XAxis
              dataKey={xKey} type="number" domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => (useRho ? v.toFixed(0) : v.toFixed(2))}
              stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              label={{ value: xLabel, position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              domain={yDomain}
              stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              label={{ value: 'p  [atm]', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              labelFormatter={(v) => `${useRho ? 'ρ' : 'Vₘ'} = ${Number(v).toFixed(useRho ? 1 : 3)} ${xUnit}`}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />

            {spinodal && (
              <ReferenceArea
                x1={useRho ? rhoFromVm(spinodal.Vgas, M) : spinodal.Vliq}
                x2={useRho ? rhoFromVm(spinodal.Vliq, M) : spinodal.Vgas}
                y1={yDomain[0]} y2={yDomain[1]}
                fill="#f59e0b" fillOpacity={0.06}
                stroke="#f59e0b" strokeOpacity={0.25} strokeDasharray="2 2"
                label={{ value: 'S-bölgesi (metastabil)', fill: '#fbbf24', fontSize: 10, position: 'insideTop' }}
              />
            )}

            <ReferenceLine y={params.Pcr} stroke="#64748b" strokeDasharray="3 3"
              label={{ value: 'Pcr', fill: '#94a3b8', fontSize: 10, position: 'right' }} />

            <Line dataKey="pSub" stroke="#c084fc" dot={false}
              name={`T=${(Tcr * 0.85).toFixed(0)}K (sub)`}
              strokeWidth={1} strokeDasharray="3 3" isAnimationActive={false} />
            <Line dataKey="pCritical" stroke="#ef4444" dot={false}
              name={`Tcr=${Tcr.toFixed(0)}K`} strokeWidth={1.5} isAnimationActive={false} />
            <Line dataKey="pSup" stroke="#60a5fa" dot={false}
              name={`T=${(Tcr * 1.15).toFixed(0)}K (süper)`}
              strokeWidth={1} strokeDasharray="3 3" isAnimationActive={false} />

            {isCompare ? (
              <>
                <Line dataKey="pClassic" stroke="#fbbf24" dot={false}
                  name={`Klasik vdW @ T=${T.toFixed(0)}K`}
                  strokeWidth={2.5} strokeDasharray="5 3" isAnimationActive={false} />
                <Line dataKey="pTag" stroke="#10b981" dot={false}
                  name={`TAĞ-vdW @ T=${T.toFixed(0)}K`}
                  strokeWidth={3} isAnimationActive={false} />
              </>
            ) : (
              <Line dataKey={mainKey} stroke={mainColor} dot={false} name={mainLabel}
                strokeWidth={3} isAnimationActive={true} animationDuration={400} animationEasing="ease-in-out" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Δp alt paneli */}
      <div className="h-24 border-t border-slate-800 px-2 pt-1">
        <div className="flex items-center justify-between px-3 pt-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
            Δp({useRho ? 'ρ' : 'Vₘ'}) = TAĞ − klasik · metastabil katkının profili
          </span>
          <span className="text-[10px] font-mono text-slate-600">
            τ = {params.tau.toFixed(2)} · Λ = {lambda(params.tau).toFixed(4)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <ComposedChart data={data} margin={{ top: 2, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" />
            <XAxis dataKey={xKey} type="number" domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => (useRho ? v.toFixed(0) : v.toFixed(2))}
              stroke="#475569" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
            <YAxis stroke="#475569" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
              width={40} tickFormatter={(v) => v.toFixed(1)} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              labelFormatter={(v) => `${useRho ? 'ρ' : 'Vₘ'} = ${Number(v).toFixed(useRho ? 1 : 3)}`}
              formatter={(val) => [Number(val).toFixed(3) + ' atm', 'Δp']} />
            <ReferenceLine y={0} stroke="#475569" />
            <Area dataKey="delta" stroke="#10b981" fill="#10b981" fillOpacity={0.25}
              strokeWidth={1.5} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
