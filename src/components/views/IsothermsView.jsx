/**
 * İzotermler Görünümü  —  p vs Vₘ (veya ρ)
 *
 * Dört izoterm birden çizilir (subkritik, seçili, kritik, süperkritik).
 * Seçili izoterm compare modunda iki eğri halinde gösterilir.
 * Altında Δp(Vₘ) profil grafiği yer alır.
 */
import { useMemo, useRef } from 'react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Area, ComposedChart,
} from 'recharts';

import { vdw } from '../../physics/vdw.js';
import { deltaPm, lambda } from '../../physics/metastable.js';
import { rhoFromVm } from '../../physics/density.js';
import { ATM_TO_BAR } from '../../physics/constants.js';
import { findSpinodal, maxDeviation } from '../../physics/spinodal.js';
import { useChartZoom } from '../../hooks/useChartZoom.js';
import { useFullscreen } from '../../hooks/useFullscreen.js';
import { formatCompactTick, linspace } from '../../utils/format.js';
import { getFullDomain } from '../../utils/chartDomain.js';
import { chartAxisLabel, chartLegendStyle, chartReferenceLabel, chartSmallTick, chartTick } from '../../utils/chartStyles.js';
import { exportCsv, exportPngFromElement, exportSvgFromElement } from '../../utils/exportChart.js';
import ChartTooltip from '../ui/ChartTooltip.jsx';
import ExportMenu from '../ui/ExportMenu.jsx';
import FullscreenButton from '../ui/FullscreenButton.jsx';

export default function IsothermsView({ params, T, modelMode, axisMode }) {
  const chartRef = useRef(null);
  const { isFullscreen, exitFullscreen, toggleFullscreen } = useFullscreen(chartRef);
  const { a, b, Tcr, Vmin, Vmax, M } = params;
  const isTag = modelMode === 'tag';
  const isCompare = modelMode === 'compare';
  const isClassic = modelMode === 'classic';
  const useRho = axisMode === 'rho';
  const xKey = useRho ? 'rho' : 'Vm';
  const xLabel = useRho ? 'ρ  [g/L]' : 'Vₘ  [L/mol]';
  const xUnit = useRho ? 'g/L' : 'L/mol';
  const pcrBar = params.Pcr * ATM_TO_BAR;
  const pcrTooltipRows = [{ label: 'Pcr', value: `${pcrBar.toFixed(1)} bar` }];
  const formatPressureBar = (value, decimals = 2) => `${(Number(value) * ATM_TO_BAR).toFixed(decimals)} bar`;
  const plotYKeys = ['pClassic', 'pTag', 'pCritical', 'pSup', 'pSub'];

  const data = useMemo(() => {
    const Vs = linspace(Math.max(Vmin, b * 1.02), Vmax, 300);
    return Vs.map((v) => {
      const classic = vdw(v, T, a, b);
      const meta = deltaPm(v, params.A, params.V0, params.sigma) * lambda(params.tau);
      const pTag = classic + meta;
      const pCritical = vdw(v, Tcr, a, b);
      const pSup = vdw(v, Tcr * 1.15, a, b);
      const pSub = vdw(v, Tcr * 0.85, a, b);
      return {
        Vm: v,
        rho: rhoFromVm(v, M),
        pClassic: classic,
        pTag,
        pCritical,
        pSup,
        pSub,
        delta: meta,
        pClassicBar: classic * ATM_TO_BAR,
        pTagBar: pTag * ATM_TO_BAR,
        pCriticalBar: pCritical * ATM_TO_BAR,
        pSupBar: pSup * ATM_TO_BAR,
        pSubBar: pSub * ATM_TO_BAR,
        deltaBar: meta * ATM_TO_BAR,
      };
    });
  }, [params, T, M, a, b, Tcr, Vmin, Vmax]);

  const spinodal = useMemo(
    () => findSpinodal(T, a, b, Vmin, Vmax),
    [T, a, b, Vmin, Vmax]
  );

  const deviation = useMemo(() => maxDeviation(T, params), [params, T]);
  const {
    xDomain,
    visibleData,
    selectionDomain,
    containerHandlers,
    chartHandlers,
  } = useChartZoom(data, xKey, {
    resetKey: `${Tcr}:${params.Pcr}:${Vmin}:${Vmax}`,
    wheelEnabled: isFullscreen,
  });
  const zoomedData = visibleData.length ? visibleData : data;

  const yDomain = useMemo(() => {
    const vals = zoomedData.flatMap((d) =>
      plotYKeys.map((key) => d[key]).filter(Number.isFinite)
    );
    vals.push(params.Pcr);
    return getFullDomain(vals, {
      fallback: [0, Math.max(params.Pcr, 100)],
      padRatio: 0.1,
      minPad: 1,
    });
  }, [params.Pcr, zoomedData]);

  const deltaYDomain = useMemo(() => {
    const vals = zoomedData.map((d) => d.delta).filter(Number.isFinite);
    if (!vals.length) return [-1, 1];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = hi - lo;
    const pad = span > 1e-9 ? span * 0.08 : Math.max(Math.abs(hi) * 0.2, 0.2);
    return [Math.min(lo - pad, 0), Math.max(hi + pad, 0)];
  }, [zoomedData]);

  const mainKey = isTag ? 'pTag' : 'pClassic';
  const mainColor = isTag ? '#10b981' : '#fbbf24';
  const mainLabel = isTag ? `TAĞ-vdW @ T=${T.toFixed(0)}K` : `Klasik vdW @ T=${T.toFixed(0)}K`;
  const fileBase = `isotherms-${modelMode}-${axisMode}-T${T.toFixed(0)}K`;
  const csvColumns = [
    { key: 'Vm', label: 'Vm_L_per_mol' },
    { key: 'rho', label: 'rho_g_per_L' },
    { key: 'pClassicBar', label: 'p_classic_bar' },
    { key: 'pTagBar', label: 'p_tag_bar' },
    { key: 'pCriticalBar', label: 'p_critical_bar' },
    { key: 'pSupBar', label: 'p_supercritical_bar' },
    { key: 'pSubBar', label: 'p_subcritical_bar' },
    { key: 'deltaBar', label: 'delta_p_bar' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">p–{useRho ? 'ρ' : 'Vₘ'} Diyagramı · İzotermler</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCompare && 'İki model üst üste: sarı = klasik, yeşil = TAĞ-vdW'}
            {isTag && 'Metastabil düzeltmeli model: klasik terim + Δpₘ·Λ(τ)'}
            {isClassic && 'Klasik van der Waals — yalnızca denge durumları'}
          </p>
        </div>

        {!isClassic && deviation.maxAbs > 0.001 && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-mono text-[10px]">
            <div>
              <div className="text-emerald-400/60 uppercase tracking-wider text-[9px]">Max sapma</div>
              <div className="text-sm tabular-nums text-emerald-700">
                {deviation.signed >= 0 ? '+' : ''}{(deviation.signed * ATM_TO_BAR).toFixed(2)} bar
              </div>
            </div>
            <div className="h-7 w-px bg-emerald-200" />
            <div>
              <div className="text-emerald-400/60 uppercase tracking-wider text-[9px]">@ {useRho ? 'ρ' : 'Vₘ'}</div>
              <div className="text-sm tabular-nums text-emerald-700">
                {(useRho ? rhoFromVm(deviation.atV, M) : deviation.atV).toFixed(useRho ? 1 : 3)} {xUnit}
              </div>
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <span>yakınlaştır: aralık seçmek için sürükle · sıfırla: çift tık</span>
          <ExportMenu
            onPng={() => exportPngFromElement(chartRef.current, `${fileBase}.png`)}
            onSvg={() => exportSvgFromElement(chartRef.current, `${fileBase}.svg`)}
            onCsv={() => exportCsv(data, csvColumns, `${fileBase}.csv`)}
          />
          <FullscreenButton isFullscreen={isFullscreen} onClick={toggleFullscreen} />
        </div>
      </div>

      <div
        ref={chartRef}
        {...containerHandlers}
        className={isFullscreen
          ? 'relative h-screen w-screen cursor-grab overflow-hidden bg-white p-6 active:cursor-grabbing'
          : 'relative flex-1 min-h-0 px-2'}
      >
        {isFullscreen && (
          <div className="absolute right-4 top-4 z-20">
            <FullscreenButton isFullscreen onClick={exitFullscreen} className="shadow-md" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }} {...chartHandlers}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" />
            <XAxis
              dataKey={xKey}
              type="number"
              domain={xDomain}
              allowDataOverflow
              tickFormatter={(v) => (useRho ? v.toFixed(0) : v.toFixed(2))}
              stroke="#64748b"
              tick={chartTick}
              label={{ ...chartAxisLabel, value: xLabel, position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              domain={yDomain}
              allowDataOverflow
              width={58}
              tickFormatter={(v) => formatCompactTick(v * ATM_TO_BAR)}
              stroke="#64748b"
              tick={chartTick}
              label={{ ...chartAxisLabel, value: 'p  [bar]', angle: -90, position: 'insideLeft' }}
            />
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

            {spinodal && (
              <ReferenceArea
                x1={useRho ? rhoFromVm(spinodal.Vgas, M) : spinodal.Vliq}
                x2={useRho ? rhoFromVm(spinodal.Vliq, M) : spinodal.Vgas}
                y1={yDomain[0]}
                y2={yDomain[1]}
                fill="#f59e0b"
                fillOpacity={0.06}
                stroke="#f59e0b"
                strokeOpacity={0.25}
                strokeDasharray="2 2"
                label={{ ...chartReferenceLabel, value: 'Spinodal aralığı', fill: '#fbbf24', position: 'insideTop' }}
              />
            )}

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

            <ReferenceLine
              y={params.Pcr}
              stroke="#64748b"
              strokeDasharray="3 3"
              label={{ ...chartReferenceLabel, value: `Pcr=${pcrBar.toFixed(1)} bar`, position: 'right' }}
            />

            <Line
              dataKey="pSub"
              stroke="#c084fc"
              dot={false}
              name={`T=${(Tcr * 0.85).toFixed(0)}K (sub)`}
              strokeWidth={1}
              strokeDasharray="3 3"
              isAnimationActive={false}
            />
            <Line
              dataKey="pCritical"
              stroke="#ef4444"
              dot={false}
              name={`Tcr=${Tcr.toFixed(0)}K`}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            <Line
              dataKey="pSup"
              stroke="#60a5fa"
              dot={false}
              name={`T=${(Tcr * 1.15).toFixed(0)}K (süper)`}
              strokeWidth={1}
              strokeDasharray="3 3"
              isAnimationActive={false}
            />

            {isCompare ? (
              <>
                <Line
                  dataKey="pClassic"
                  stroke="#fbbf24"
                  dot={false}
                  name={`Klasik vdW @ T=${T.toFixed(0)}K`}
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  isAnimationActive={false}
                />
                <Line
                  dataKey="pTag"
                  stroke="#10b981"
                  dot={false}
                  name={`TAĞ-vdW @ T=${T.toFixed(0)}K`}
                  strokeWidth={3}
                  isAnimationActive={false}
                />
              </>
            ) : (
              <Line
                dataKey={mainKey}
                stroke={mainColor}
                dot={false}
                name={mainLabel}
                strokeWidth={3}
                isAnimationActive={true}
                animationDuration={400}
                animationEasing="ease-in-out"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="h-24 border-t border-slate-200 px-2 pt-1">
        <div className="flex items-center justify-between px-3 pt-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
            Δp({useRho ? 'ρ' : 'Vₘ'}) = p_TAĞ − p_klasik = metastabil katkı
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            τ = {params.tau.toFixed(2)} · Λ = {lambda(params.tau).toFixed(4)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <ComposedChart data={data} margin={{ top: 2, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" />
            <XAxis
              dataKey={xKey}
              type="number"
              domain={xDomain}
              allowDataOverflow
              tickFormatter={(v) => (useRho ? v.toFixed(0) : v.toFixed(2))}
              stroke="#475569"
              tick={chartSmallTick}
            />
            <YAxis
              domain={deltaYDomain}
              allowDataOverflow
              stroke="#475569"
              tick={chartSmallTick}
              width={52}
              tickFormatter={(v) => formatCompactTick(v * ATM_TO_BAR)}
            />
            <Tooltip
              content={
                <ChartTooltip
                  xLabel={useRho ? 'ρ' : 'Vₘ'}
                  xUnit={xUnit}
                  xDecimals={useRho ? 1 : 3}
                  valueFormatter={(val) => [formatPressureBar(val, 3), 'Δp']}
                  referenceRows={pcrTooltipRows}
                />
              }
            />
            <ReferenceLine y={0} stroke="#475569" />
            <Area
              dataKey="delta"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.25}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
