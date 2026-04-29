/**
 * Sıçrama Animasyonu — τ → 0 limitinde ani yatay sıçrama
 *
 * Sistem metastabil sıvı kolu boyunca ilerler. τ sıfıra yaklaşınca,
 * AYNI BASINÇTA (yatay) gaz koluna atlar. Basınç korunur, hacim değişir.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceDot,
} from 'recharts';

import { vdw } from '../../physics/vdw.js';
import { tagVdw, lambda } from '../../physics/metastable.js';
import { rhoFromVm } from '../../physics/density.js';
import { linspace } from '../../utils/format.js';

export default function JumpAnimationView({ params, T, modelMode, axisMode }) {
  const { a, b, Vmin, Vmax, M } = params;
  const isTag = modelMode === 'tag' || modelMode === 'compare';
  const useRho = axisMode === 'rho';
  const xKey = useRho ? 'rho' : 'Vm';
  const xLabel = useRho ? 'ρ  [g/L]' : 'Vₘ  [L/mol]';
  const xUnit = useRho ? 'g/L' : 'L/mol';

  const [playing, setPlaying] = useState(true);
  const [tau, setTau] = useState(3.0);
  const [jumped, setJumped] = useState(false);
  const [trailPos, setTrailPos] = useState(null);

  const rafRef = useRef();
  const lastTickRef = useRef(Date.now());

  const iso = useMemo(() => {
    const Vs = linspace(Math.max(Vmin, b * 1.02), Vmax, 300);
    return Vs.map((v) => ({
      Vm: v,
      rho: rhoFromVm(v, M),
      p_vdw: vdw(v, T, a, b),
      p_ext: tagVdw(v, T, { ...params, tau }),
    }));
  }, [params, T, tau, M, a, b, Vmin, Vmax]);

  // Spinodal noktalar
  const branches = useMemo(() => {
    let maxIdx = -1, minIdx = -1, maxP = -Infinity, minP = Infinity;
    for (let i = 2; i < iso.length - 2; i++) {
      const p = iso[i].p_vdw;
      if (!Number.isFinite(p)) continue;
      if (iso[i - 1].p_vdw < p && iso[i + 1].p_vdw < p && i < iso.length / 2) {
        if (p > maxP) { maxP = p; maxIdx = i; }
      }
      if (iso[i - 1].p_vdw > p && iso[i + 1].p_vdw > p && i > iso.length / 4) {
        if (p < minP) { minP = p; minIdx = i; }
      }
    }
    return { maxIdx, minIdx, maxP, minP };
  }, [iso]);

  // Yatay iniş noktası: gaz kolunda aynı basınçta denk gelen ilk nokta
  const gasLandIdx = useMemo(() => {
    if (branches.maxIdx < 0 || branches.minIdx < 0) return -1;
    const pTarget = branches.maxP;
    for (let k = branches.minIdx + 1; k < iso.length; k++) {
      if (Number.isFinite(iso[k].p_vdw) && iso[k].p_vdw >= pTarget) return k;
    }
    let bestIdx = branches.minIdx, bestP = -Infinity;
    for (let k = branches.minIdx; k < iso.length; k++) {
      if (Number.isFinite(iso[k].p_vdw) && iso[k].p_vdw > bestP) {
        bestP = iso[k].p_vdw; bestIdx = k;
      }
    }
    return bestIdx;
  }, [iso, branches]);

  // Animasyon döngüsü — sadece TAĞ/Karşılaştır modunda çalışır
  useEffect(() => {
    if (!playing || !isTag) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setTau((t) => {
        const next = t - dt * 0.4;
        if (next <= 0.02) { setJumped(true); setPlaying(false); return 0.02; }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    lastTickRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, isTag]);

  // Parçacık konumu takibi
  useEffect(() => {
    if (branches.maxIdx < 0) return;
    const progress = Math.max(0, Math.min(1, (3 - tau) / 3));
    const i = Math.floor(progress * branches.maxIdx);
    if (jumped && gasLandIdx > 0) {
      setTrailPos({ Vm: iso[gasLandIdx].Vm, p: branches.maxP, gas: true });
    } else if (iso[i]) {
      setTrailPos({ Vm: iso[i].Vm, p: iso[i].p_vdw, gas: false });
    }
  }, [tau, jumped, branches, iso, gasLandIdx]);

  const reset = () => {
    setTau(3.0); setJumped(false); setPlaying(true);
    lastTickRef.current = Date.now();
  };

  const lambdaVal = lambda(tau);
  const jumpLine = (branches.maxIdx > 0 && branches.minIdx > 0) ? iso[branches.maxIdx].p_vdw : null;

  const shadedData = iso.map((d, i) => ({
    ...d,
    p_meta_liquid: i <= branches.maxIdx ? d.p_vdw : null,
    p_gas: i >= branches.minIdx ? d.p_vdw : null,
    p_unstable: i > branches.maxIdx && i < branches.minIdx ? d.p_vdw : null,
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Metastabil Sıçrama (τ → 0)
            <span className={`ml-3 text-xs font-mono px-2 py-0.5 rounded ${
              isTag ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {isTag ? 'TAĞ-vdW' : 'Klasik vdW'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTag
              ? 'Sistem metastabil sıvı kolu boyunca ilerler; τ→0 anında aynı basınçta gaz koluna YATAY sıçrama yapar.'
              : 'Klasik vdW\'de metastabilite açık parametre değildir — sıçrama mekanizması yoktur.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPlaying((p) => !p)} disabled={jumped || !isTag}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30">
            {playing ? <Pause size={13} /> : <Play size={13} />}
            {playing ? 'Durdur' : 'Oynat'}
          </button>
          <button onClick={reset} disabled={!isTag}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-950 disabled:opacity-30">
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Durum panelleri */}
      <div className="mx-4 mb-2 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <div className={`rounded-xl border px-3 py-2 ${isTag ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-slate-50 opacity-40'}`}>
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">τ(P,T)</div>
          <div className="text-lg tabular-nums text-slate-900">{isTag ? tau.toFixed(3) : '—'}</div>
          <div className="text-[9px] text-slate-500">metastabil ömür</div>
        </div>
        <div className={`rounded-xl border px-3 py-2 ${isTag ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-slate-50 opacity-40'}`}>
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">Λ = exp(-1/τ)</div>
          <div className="text-lg tabular-nums text-slate-900">{isTag ? lambdaVal.toFixed(4) : '—'}</div>
          <div className="text-[9px] text-slate-500">ağırlık fonksiyonu</div>
        </div>
        <div className={`border rounded px-3 py-2 ${
          !isTag ? 'border-amber-200 bg-amber-50'
            : jumped ? 'border-red-200 bg-red-50'
              : 'border-emerald-200 bg-emerald-50'
        }`}>
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">Durum</div>
          <div className={`text-lg font-semibold ${
            !isTag ? 'text-amber-700' : jumped ? 'text-red-700' : 'text-emerald-700'
          }`}>
            {!isTag ? 'Denge' : jumped ? 'SIÇRAMA' : 'Metastabil'}
          </div>
          <div className="text-[9px] text-slate-500">
            {!isTag ? 'klasik vdW modu' : jumped ? 'gaz dalına geçti' : 'sıvı dalı devam'}
          </div>
        </div>
      </div>

      <div className="flex-1 px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={shadedData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" />
            <XAxis dataKey={xKey} type="number" domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => (useRho ? v.toFixed(0) : v.toFixed(2))}
              stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              label={{ value: xLabel, position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              label={{ value: 'p  [atm]', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              labelFormatter={(v) => `${useRho ? 'ρ' : 'Vₘ'} = ${Number(v).toFixed(useRho ? 1 : 3)} ${xUnit}`} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />

            {!isTag && (
              <Line dataKey="p_vdw" stroke="#fbbf24" dot={false}
                name={`Klasik vdW izotermi  T=${T.toFixed(0)}K`} strokeWidth={3} />
            )}

            {isTag && jumpLine !== null && (
              <ReferenceLine y={jumpLine} stroke="#ef4444" strokeDasharray="4 4"
                label={{ value: `Sıçrama çizgisi  p≈${jumpLine.toFixed(2)} atm (yatay)`, fill: '#ef4444', fontSize: 10, position: 'right' }} />
            )}
            {isTag && <Line dataKey="p_meta_liquid" stroke="#3b82f6" dot={false} name="Metastabil sıvı dalı" strokeWidth={3} connectNulls={false} />}
            {isTag && <Line dataKey="p_unstable" stroke="#64748b" dot={false} name="Kararsız bölge" strokeWidth={1.5} strokeDasharray="3 3" connectNulls={false} />}
            {isTag && <Line dataKey="p_gas" stroke="#10b981" dot={false} name="Gaz dalı" strokeWidth={3} connectNulls={false} />}

            {isTag && branches.maxIdx >= 0 && (
              <ReferenceDot x={iso[branches.maxIdx][xKey]} y={branches.maxP} r={5}
                fill="#1e293b" stroke="#ef4444" strokeWidth={2} ifOverflow="visible" />
            )}
            {isTag && gasLandIdx > 0 && (
              <ReferenceDot x={iso[gasLandIdx][xKey]} y={branches.maxP} r={5}
                fill="#1e293b" stroke="#10b981" strokeWidth={2} ifOverflow="visible" />
            )}
            {isTag && trailPos && (
              <ReferenceDot x={useRho ? rhoFromVm(trailPos.Vm, M) : trailPos.Vm} y={trailPos.p} r={9}
                fill={trailPos.gas ? '#10b981' : jumped ? '#ef4444' : '#fbbf24'}
                stroke="#fff" strokeWidth={2} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
