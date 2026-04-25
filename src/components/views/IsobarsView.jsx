/**
 * İzobarlar Görünümü — T vs Vₘ (veya ρ)
 *
 * Sabit basınçta T(Vₘ) formülü:
 *     T = (P + a/Vₘ²)(Vₘ - b)/R
 *
 * TAĞ modunda etkili basınç Peff = P - Δpₘ·Λ kullanılır.
 */
import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from 'recharts';

import { tAtP } from '../../physics/vdw.js';
import { deltaPm, lambda } from '../../physics/metastable.js';
import { rhoFromVm } from '../../physics/density.js';
import { linspace } from '../../utils/format.js';

export default function IsobarsView({ params, P, modelMode, axisMode }) {
  const { a, b, Tcr, Pcr, Vmin, Vmax, M } = params;
  const isTag = modelMode === 'tag';
  const isCompare = modelMode === 'compare';
  const isClassic = modelMode === 'classic';
  const useRho = axisMode === 'rho';
  const xKey = useRho ? 'rho' : 'Vm';
  const xLabel = useRho ? 'ρ  [g/L]' : 'Vₘ  [L/mol]';
  const xUnit = useRho ? 'g/L' : 'L/mol';

  const data = useMemo(() => {
    const Vs = linspace(Math.max(Vmin, b * 1.05), Vmax, 300);
    return Vs.map((v) => {
      const meta = deltaPm(v, params.A, params.V0, params.sigma) * lambda(params.tau);
      const Tclassic = tAtP(v, P, a, b);
      const Ttag = tAtP(v, P - meta, a, b);
      return {
        Vm: v,
        rho: rhoFromVm(v, M),
        Tclassic,
        Ttag,
        Tcritical: tAtP(v, Pcr, a, b),
        Tlow: tAtP(v, Pcr * 0.5, a, b),
        Thigh: tAtP(v, Pcr * 1.5, a, b),
        deltaT: Number.isFinite(Ttag) && Number.isFinite(Tclassic) ? Ttag - Tclassic : 0,
      };
    });
  }, [params, P, M, a, b, Pcr, Vmin, Vmax]);

  const dev = useMemo(() => {
    let m = 0, at = 0, s = 0;
    for (const d of data) {
      if (!Number.isFinite(d.deltaT)) continue;
      if (Math.abs(d.deltaT) > m) { m = Math.abs(d.deltaT); at = d.Vm; s = d.deltaT; }
    }
    return { maxAbs: m, atV: at, signed: s };
  }, [data]);

  const yDomain = useMemo(() => {
    const vals = data.flatMap((d) =>
      [d.Tclassic, d.Ttag, d.Tcritical, d.Tlow, d.Thigh].filter((x) => Number.isFinite(x) && x > 0)
    );
    if (!vals.length) return [0, 1000];
    const lo = Math.min(...vals), hi = Math.max(...vals);
    return [Math.max(0, lo * 0.9), Math.min(hi * 1.05, Tcr * 3)];
  }, [data, Tcr]);

  const mainKey = isTag ? 'Ttag' : 'Tclassic';
  const mainColor = isTag ? '#10b981' : '#fbbf24';
  const mainLabel = isTag ? `TAĞ-vdW @ P=${P.toFixed(1)} atm` : `Klasik vdW @ P=${P.toFixed(1)} atm`;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-serif text-slate-100">T–{useRho ? 'ρ' : 'Vₘ'} Diyagramı · İzobarlar</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCompare && 'İki model üst üste: sarı = klasik, yeşil = TAĞ-vdW'}
            {isTag && 'Metastabil düzeltme ile: T(Vₘ) = [(P − Δpₘ·Λ) + a/Vₘ²](Vₘ − b)/R'}
            {isClassic && 'Klasik van der Waals: T(Vₘ) = (P + a/Vₘ²)(Vₘ − b)/R'}
          </p>
        </div>
        {!isClassic && dev.maxAbs > 0.01 && (
          <div className="flex items-center gap-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded font-mono text-[10px]">
            <div>
              <div className="text-emerald-400/60 uppercase tracking-wider text-[9px]">Max ΔT</div>
              <div className="text-emerald-300 text-sm tabular-nums">
                {dev.signed >= 0 ? '+' : ''}{dev.signed.toFixed(2)} K
              </div>
            </div>
            <div className="w-px h-7 bg-emerald-500/20" />
            <div>
              <div className="text-emerald-400/60 uppercase tracking-wider text-[9px]">@ {useRho ? 'ρ' : 'Vₘ'}</div>
              <div className="text-emerald-300 text-sm tabular-nums">
                {(useRho ? rhoFromVm(dev.atV, M) : dev.atV).toFixed(useRho ? 1 : 3)} {xUnit}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" />
            <XAxis dataKey={xKey} type="number" domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => (useRho ? v.toFixed(0) : v.toFixed(2))}
              stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              label={{ value: xLabel, position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }} />
            <YAxis domain={yDomain}
              stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              label={{ value: 'T  [K]', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              labelFormatter={(v) => `${useRho ? 'ρ' : 'Vₘ'} = ${Number(v).toFixed(useRho ? 1 : 3)} ${xUnit}`}
              formatter={(val) => [Number(val).toFixed(2) + ' K']} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
            <ReferenceLine y={Tcr} stroke="#64748b" strokeDasharray="3 3"
              label={{ value: 'Tcr', fill: '#94a3b8', fontSize: 10, position: 'right' }} />

            <Line dataKey="Tlow" stroke="#c084fc" dot={false}
              name={`P=${(Pcr * 0.5).toFixed(1)} atm`}
              strokeWidth={1} strokeDasharray="3 3" isAnimationActive={false} />
            <Line dataKey="Tcritical" stroke="#ef4444" dot={false}
              name={`Pcr=${Pcr.toFixed(1)} atm`} strokeWidth={1.5} isAnimationActive={false} />
            <Line dataKey="Thigh" stroke="#60a5fa" dot={false}
              name={`P=${(Pcr * 1.5).toFixed(1)} atm`}
              strokeWidth={1} strokeDasharray="3 3" isAnimationActive={false} />

            {isCompare ? (
              <>
                <Line dataKey="Tclassic" stroke="#fbbf24" dot={false}
                  name={`Klasik @ P=${P.toFixed(1)} atm`}
                  strokeWidth={2.5} strokeDasharray="5 3" isAnimationActive={false} />
                <Line dataKey="Ttag" stroke="#10b981" dot={false}
                  name={`TAĞ @ P=${P.toFixed(1)} atm`}
                  strokeWidth={3} isAnimationActive={false} />
              </>
            ) : (
              <Line dataKey={mainKey} stroke={mainColor} dot={false} name={mainLabel}
                strokeWidth={3} isAnimationActive={true} animationDuration={400} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ΔT subchart */}
      <div className="h-24 border-t border-slate-800 px-2 pt-1">
        <div className="flex items-center justify-between px-3 pt-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
            ΔT({useRho ? 'ρ' : 'Vₘ'}) = T_TAĞ − T_klasik · metastabilitenin sıcaklık kayması
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
              formatter={(val) => [Number(val).toFixed(2) + ' K', 'ΔT']} />
            <ReferenceLine y={0} stroke="#475569" />
            <Area dataKey="deltaT" stroke="#10b981" fill="#10b981" fillOpacity={0.25}
              strokeWidth={1.5} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
