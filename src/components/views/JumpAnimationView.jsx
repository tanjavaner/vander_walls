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
  ResponsiveContainer, ReferenceLine, ReferenceDot, ReferenceArea,
} from 'recharts';

import { vdw } from '../../physics/vdw.js';
import { tagVdw, lambda } from '../../physics/metastable.js';
import { rhoFromVm } from '../../physics/density.js';
import { ATM_TO_BAR } from '../../physics/constants.js';
import { findSpinodal, findGasVolumeAtPressure } from '../../physics/spinodal.js';
import { useChartZoom } from '../../hooks/useChartZoom.js';
import { useFullscreen } from '../../hooks/useFullscreen.js';
import { formatCompactTick, linspace } from '../../utils/format.js';
import { chartAxisLabel, chartLegendStyle, chartReferenceLabel, chartTick } from '../../utils/chartStyles.js';
import { exportCsv, exportPngFromElement, exportSvgFromElement } from '../../utils/exportChart.js';
import ChartTooltip from '../ui/ChartTooltip.jsx';
import ExportMenu from '../ui/ExportMenu.jsx';
import FullscreenButton from '../ui/FullscreenButton.jsx';

export default function JumpAnimationView({ params, T, modelMode, axisMode }) {
  const { a, b, Pcr, Vmin, Vmax, M } = params;
  const isTag = modelMode === 'tag' || modelMode === 'compare';
  const useRho = axisMode === 'rho';
  const xKey = useRho ? 'rho' : 'Vm';
  const xLabel = useRho ? 'ρ  [g/L]' : 'Vₘ  [L/mol]';
  const xUnit = useRho ? 'g/L' : 'L/mol';
  const pcrTooltipRows = [{ label: 'Pcr', value: `${(Pcr * ATM_TO_BAR).toFixed(1)} bar` }];
  const formatPressureBar = (value, decimals = 2) => `${(Number(value) * ATM_TO_BAR).toFixed(decimals)} bar`;
  const toBarOrNull = (value) => (Number.isFinite(value) ? value * ATM_TO_BAR : null);

  const [playing, setPlaying] = useState(true);
  const [tau, setTau] = useState(3.0);
  const [jumped, setJumped] = useState(false);
  const [trailPos, setTrailPos] = useState(null);

  const rafRef = useRef();
  const lastTickRef = useRef(Date.now());
  const chartRef = useRef(null);
  const { isFullscreen, exitFullscreen, toggleFullscreen } = useFullscreen(chartRef);

  const spinodal = useMemo(
    () => findSpinodal(T, a, b, Vmin, Vmax),
    [T, a, b, Vmin, Vmax]
  );
  const canJump = isTag && Boolean(spinodal);

  const gasLandVm = useMemo(() => {
    if (!spinodal) return null;
    return findGasVolumeAtPressure(T, a, b, spinodal.pMin, spinodal.Vgas, Vmax);
  }, [T, a, b, Vmax, spinodal]);

  const plotVmax = gasLandVm ? Math.max(Vmax, gasLandVm * 1.05) : Vmax;

  const iso = useMemo(() => {
    const baseVs = linspace(Math.max(Vmin, b * 1.02), plotVmax, 420);
    const exactVs = [spinodal?.Vliq, spinodal?.Vgas, gasLandVm].filter(Number.isFinite);
    const Vs = [...new Set([...baseVs, ...exactVs].map((v) => Number(v.toFixed(12))))].sort((x, y) => x - y);

    return Vs.map((v) => ({
      Vm: v,
      rho: rhoFromVm(v, M),
      p_vdw: vdw(v, T, a, b),
      p_ext: tagVdw(v, T, { ...params, tau }),
    }));
  }, [params, T, tau, M, a, b, Vmin, plotVmax, spinodal, gasLandVm]);

  const branchIndexes = useMemo(() => {
    if (!spinodal) return { liqIdx: -1, gasIdx: -1, landIdx: -1 };

    const nearestIndex = (Vm) => {
      if (!Number.isFinite(Vm)) return -1;
      let bestIdx = -1;
      let bestDistance = Infinity;
      for (let i = 0; i < iso.length; i++) {
        const distance = Math.abs(iso[i].Vm - Vm);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIdx = i;
        }
      }
      return bestIdx;
    };

    return {
      liqIdx: nearestIndex(spinodal.Vliq),
      gasIdx: nearestIndex(spinodal.Vgas),
      landIdx: nearestIndex(gasLandVm),
    };
  }, [iso, spinodal, gasLandVm]);

  useEffect(() => {
    if (canJump) return;
    setPlaying(false);
    setJumped(false);
  }, [canJump]);

  // Animasyon döngüsü — sadece TAĞ/Karşılaştır modunda çalışır
  useEffect(() => {
    if (!playing || !canJump) {
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
  }, [playing, canJump]);

  // Parçacık konumu takibi
  useEffect(() => {
    if (!spinodal || branchIndexes.liqIdx < 0) {
      setTrailPos(null);
      return;
    }

    const progress = Math.max(0, Math.min(1, (3 - tau) / 3));
    const i = Math.min(branchIndexes.liqIdx, Math.floor(progress * branchIndexes.liqIdx));
    if (jumped && branchIndexes.landIdx >= 0) {
      setTrailPos({ Vm: iso[branchIndexes.landIdx].Vm, p: spinodal.pMin, gas: true });
    } else if (iso[i]) {
      setTrailPos({ Vm: iso[i].Vm, p: iso[i].p_vdw, gas: false });
    }
  }, [tau, jumped, spinodal, branchIndexes, iso]);

  const reset = () => {
    setTau(3.0); setJumped(false); setPlaying(true);
    lastTickRef.current = Date.now();
  };

  const lambdaVal = lambda(tau);
  const jumpLine = spinodal ? spinodal.pMin : null;

  const shadedData = iso.map((d, i) => {
    const pTagCurve = isTag ? d.p_ext : null;
    const pMetaLiquid = spinodal && i <= branchIndexes.liqIdx ? d.p_vdw : null;
    const pGas = spinodal && i >= branchIndexes.gasIdx ? d.p_vdw : null;
    const pUnstable = spinodal && i > branchIndexes.liqIdx && i < branchIndexes.gasIdx ? d.p_vdw : null;
    const pJumpPath = spinodal && gasLandVm && d.Vm >= spinodal.Vliq && d.Vm <= gasLandVm ? spinodal.pMin : null;
    const pSinglePhase = !spinodal ? d.p_vdw : null;

    return {
      ...d,
      p_tag_curve: pTagCurve,
      p_meta_liquid: pMetaLiquid,
      p_gas: pGas,
      p_unstable: pUnstable,
      p_jump_path: pJumpPath,
      p_single_phase: pSinglePhase,
      p_vdw_bar: toBarOrNull(d.p_vdw),
      p_ext_bar: toBarOrNull(d.p_ext),
      p_tag_curve_bar: toBarOrNull(pTagCurve),
      p_meta_liquid_bar: toBarOrNull(pMetaLiquid),
      p_gas_bar: toBarOrNull(pGas),
      p_unstable_bar: toBarOrNull(pUnstable),
      p_jump_path_bar: toBarOrNull(pJumpPath),
      p_single_phase_bar: toBarOrNull(pSinglePhase),
    };
  });

  const autoDomainData = useMemo(
    () => (spinodal && gasLandVm
      ? iso.filter((point) => point.Vm >= spinodal.Vliq && point.Vm <= gasLandVm)
      : iso),
    [gasLandVm, iso, spinodal]
  );

  const {
    xDomain,
    visibleData,
    selectionDomain,
    containerHandlers,
    chartHandlers,
  } = useChartZoom(iso, xKey, { domainData: autoDomainData, wheelEnabled: isFullscreen });
  const zoomedIso = visibleData.length ? visibleData : iso;

  const yDomain = useMemo(() => {
    if (spinodal) {
      const tagValues = zoomedIso
        .filter((d) => !gasLandVm || (d.Vm >= spinodal.Vliq && d.Vm <= gasLandVm))
        .map((d) => d.p_ext)
        .filter(Number.isFinite);
      const lo = Math.min(spinodal.pMin, spinodal.pMax, ...tagValues);
      const hi = Math.max(spinodal.pMin, spinodal.pMax, ...tagValues);
      const pad = Math.max((hi - lo) * 0.25, 1);
      return [lo - pad, hi + pad];
    }

    const vals = zoomedIso.map((d) => d.p_vdw).filter(Number.isFinite);
    if (!vals.length) return [0, 1];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = Math.max((hi - lo) * 0.08, 1);
    return [lo - pad, hi + pad];
  }, [zoomedIso, spinodal, gasLandVm]);
  const fileBase = `jump-${modelMode}-${axisMode}-T${T.toFixed(0)}K-tau${tau.toFixed(2)}`;
  const csvColumns = [
    { key: 'Vm', label: 'Vm_L_per_mol' },
    { key: 'rho', label: 'rho_g_per_L' },
    { key: 'p_vdw_bar', label: 'p_classic_bar' },
    { key: 'p_ext_bar', label: 'p_tag_bar' },
    { key: 'p_tag_curve_bar', label: 'p_tag_curve_bar' },
    { key: 'p_meta_liquid_bar', label: 'p_meta_liquid_bar' },
    { key: 'p_unstable_bar', label: 'p_unstable_bar' },
    { key: 'p_gas_bar', label: 'p_gas_bar' },
    { key: 'p_jump_path_bar', label: 'p_jump_path_bar' },
    { key: 'p_single_phase_bar', label: 'p_single_phase_bar' },
  ];

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
          <span className="hidden text-[10px] font-mono text-slate-500 lg:inline">
            yakınlaştır: aralık seçmek için sürükle · sıfırla: çift tık
          </span>
          <ExportMenu
            onPng={() => exportPngFromElement(chartRef.current, `${fileBase}.png`)}
            onSvg={() => exportSvgFromElement(chartRef.current, `${fileBase}.svg`)}
            onCsv={() => exportCsv(shadedData, csvColumns, `${fileBase}.csv`)}
          />
          <FullscreenButton isFullscreen={isFullscreen} onClick={toggleFullscreen} />
          <button onClick={() => setPlaying((p) => !p)} disabled={jumped || !canJump}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30">
            {playing ? <Pause size={13} /> : <Play size={13} />}
            {playing ? 'Durdur' : 'Oynat'}
          </button>
          <button onClick={reset} disabled={!canJump}
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
          !isTag || !spinodal ? 'border-amber-200 bg-amber-50'
            : jumped ? 'border-red-200 bg-red-50'
              : 'border-emerald-200 bg-emerald-50'
        }`}>
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">Durum</div>
          <div className={`text-lg font-semibold ${
            !isTag || !spinodal ? 'text-amber-700' : jumped ? 'text-red-700' : 'text-emerald-700'
          }`}>
            {!isTag ? 'Denge' : !spinodal ? 'Tek faz' : jumped ? 'SIÇRAMA' : 'Metastabil'}
          </div>
          <div className="text-[9px] text-slate-500">
            {!isTag ? 'klasik vdW modu' : !spinodal ? 'spinodal yok' : jumped ? 'gaz dalına geçti' : 'sıvı dalı devam'}
          </div>
        </div>
      </div>

      <div
        ref={chartRef}
        {...containerHandlers}
        className={isFullscreen
          ? 'relative h-screen w-screen cursor-grab overflow-hidden bg-white p-6 active:cursor-grabbing'
          : 'relative flex-1 px-2 pb-2'}
      >
        {isFullscreen && (
          <div className="absolute right-4 top-4 z-20">
            <FullscreenButton isFullscreen onClick={exitFullscreen} className="shadow-md" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={shadedData} margin={{ top: 10, right: 24, left: 8, bottom: 25 }} {...chartHandlers}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" />
            <XAxis dataKey={xKey} type="number" domain={xDomain} allowDataOverflow
              tickFormatter={(v) => (useRho ? v.toFixed(0) : v.toFixed(2))}
              stroke="#64748b" tick={chartTick}
              label={{ ...chartAxisLabel, value: xLabel, position: 'insideBottom', offset: -10 }} />
            <YAxis
              domain={yDomain}
              allowDataOverflow
              width={58}
              tickFormatter={(v) => formatCompactTick(v * ATM_TO_BAR)}
              stroke="#64748b"
              tick={chartTick}
              label={{ ...chartAxisLabel, value: 'p  [bar]', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              content={
                <ChartTooltip
                  xLabel={useRho ? 'ρ' : 'Vₘ'}
                  xUnit={xUnit}
                  xDecimals={useRho ? 1 : 3}
                  valueFormatter={(val, entry) => [formatPressureBar(val), entry.name ?? entry.dataKey]}
                  referenceRows={pcrTooltipRows}
                />
              }
            />
            <Legend wrapperStyle={chartLegendStyle} />

            {selectionDomain && (
              <ReferenceArea
                x1={selectionDomain[0]}
                x2={selectionDomain[1]}
                y1={yDomain[0]}
                y2={yDomain[1]}
                fill="#38bdf8"
                fillOpacity={0.08}
                stroke="#38bdf8"
                strokeOpacity={0.45}
                strokeDasharray="3 3"
              />
            )}

            {!isTag && (
              <Line dataKey="p_vdw" stroke="#fbbf24" dot={false}
                name={`Klasik vdW izotermi  T=${T.toFixed(0)}K`} strokeWidth={3} />
            )}

            {isTag && jumpLine !== null && (
              <ReferenceLine y={jumpLine} stroke="#ef4444" strokeDasharray="4 4"
                strokeOpacity={0.35}
                label={{ ...chartReferenceLabel, value: `p_sıçrama≈${(jumpLine * ATM_TO_BAR).toFixed(2)} bar`, fill: '#ef4444', position: 'right' }} />
            )}
            {isTag && <Line dataKey="p_tag_curve" stroke="#10b981" dot={false} name={`TA-vdW izotermi  τ=${tau.toFixed(2)}`} strokeWidth={1.5} strokeDasharray="5 4" connectNulls={false} isAnimationActive={false} />}
            {isTag && spinodal && <Line dataKey="p_meta_liquid" stroke="#3b82f6" dot={false} name="Metastabil sıvı dalı" strokeWidth={3} connectNulls={false} />}
            {isTag && spinodal && <Line dataKey="p_unstable" stroke="#64748b" dot={false} name="Kararsız bölge" strokeWidth={1.5} strokeDasharray="3 3" connectNulls={false} />}
            {isTag && spinodal && <Line dataKey="p_gas" stroke="#10b981" dot={false} name="Gaz dalı" strokeWidth={3} connectNulls={false} />}
            {isTag && spinodal && gasLandVm && <Line dataKey="p_jump_path" stroke="#ef4444" dot={false} name="Yatay sıçrama yolu" strokeWidth={4} connectNulls={false} isAnimationActive={false} />}
            {isTag && !spinodal && <Line dataKey="p_single_phase" stroke="#10b981" dot={false} name="Tek faz vdW izotermi" strokeWidth={3} connectNulls={false} />}

            {isTag && spinodal && branchIndexes.liqIdx >= 0 && (
              <ReferenceDot x={iso[branchIndexes.liqIdx][xKey]} y={spinodal.pMin} r={5}
                fill="#1e293b" stroke="#ef4444" strokeWidth={2} ifOverflow="visible" />
            )}
            {isTag && spinodal && branchIndexes.landIdx >= 0 && (
              <ReferenceDot x={iso[branchIndexes.landIdx][xKey]} y={spinodal.pMin} r={5}
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
