/**
 * İzobarlar Görünümü — T vs Vₘ (veya ρ)
 *
 * Sabit basınçta T(Vₘ) formülü:
 *     T = (P + a/Vₘ²)(Vₘ - b)/R
 *
 * TAĞ modunda etkili basınç Peff = P - Δpₘ·Λ kullanılır.
 */
import { useMemo, useRef } from 'react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Area, ComposedChart,
} from 'recharts';

import { tAtP } from '../../physics/vdw.js';
import { deltaPm, lambda } from '../../physics/metastable.js';
import { rhoFromVm } from '../../physics/density.js';
import { ATM_TO_BAR } from '../../physics/constants.js';
import { useChartZoom } from '../../hooks/useChartZoom.js';
import { useFullscreen } from '../../hooks/useFullscreen.js';
import { formatCompactTick, linspace } from '../../utils/format.js';
import { getFullDomain } from '../../utils/chartDomain.js';
import { chartAxisLabel, chartLegendStyle, chartReferenceLabel, chartSmallTick, chartTick } from '../../utils/chartStyles.js';
import { exportCsv, exportPngFromElement, exportSvgFromElement } from '../../utils/exportChart.js';
import ChartTooltip from '../ui/ChartTooltip.jsx';
import ExportMenu from '../ui/ExportMenu.jsx';
import FullscreenButton from '../ui/FullscreenButton.jsx';

export default function IsobarsView({ params, P, modelMode, axisMode }) {
  const chartRef = useRef(null);
  const { isFullscreen, exitFullscreen, toggleFullscreen } = useFullscreen(chartRef);
  const { a, b, Tcr, Pcr, Vmin, Vmax, M } = params;
  const isTag = modelMode === 'tag';
  const isCompare = modelMode === 'compare';
  const isClassic = modelMode === 'classic';
  const useRho = axisMode === 'rho';
  const xKey = useRho ? 'rho' : 'Vm';
  const xLabel = useRho ? 'ρ  [g/L]' : 'Vₘ  [L/mol]';
  const xUnit = useRho ? 'g/L' : 'L/mol';
  const Pbar = P * ATM_TO_BAR;
  const PcrBar = Pcr * ATM_TO_BAR;
  const pcrTooltipRows = [{ label: 'Pcr', value: `${PcrBar.toFixed(1)} bar` }];
  const plotYKeys = ['Tclassic', 'Ttag', 'Tcritical', 'Tlow', 'Thigh'];

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
    let maxAbs = 0;
    let atV = 0;
    let signed = 0;

    for (const point of data) {
      if (!Number.isFinite(point.deltaT)) continue;
      if (Math.abs(point.deltaT) > maxAbs) {
        maxAbs = Math.abs(point.deltaT);
        atV = point.Vm;
        signed = point.deltaT;
      }
    }

    return { maxAbs, atV, signed };
  }, [data]);

  const {
    xDomain,
    visibleData,
    selectionDomain,
    containerHandlers,
    chartHandlers,
  } = useChartZoom(data, xKey, {
    resetKey: `${Tcr}:${Pcr}:${Vmin}:${Vmax}`,
    wheelEnabled: isFullscreen,
  });
  const zoomedData = visibleData.length ? visibleData : data;

  const yDomain = useMemo(() => {
    const vals = zoomedData.flatMap((point) =>
      plotYKeys.map((key) => point[key]).filter(
        (value) => Number.isFinite(value) && value > 0
      )
    );
    vals.push(Tcr);
    return getFullDomain(vals, {
      fallback: [0, Math.max(Tcr, 1000)],
      padRatio: 0.1,
      minPad: 1,
      floor: 0,
    });
  }, [Tcr, zoomedData]);

  const deltaYDomain = useMemo(() => {
    const vals = zoomedData.map((point) => point.deltaT).filter(Number.isFinite);
    if (!vals.length) return [-1, 1];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = hi - lo;
    const pad = span > 1e-9 ? span * 0.08 : Math.max(Math.abs(hi) * 0.2, 0.2);
    return [Math.min(lo - pad, 0), Math.max(hi + pad, 0)];
  }, [zoomedData]);

  const mainKey = isTag ? 'Ttag' : 'Tclassic';
  const mainColor = isTag ? '#10b981' : '#fbbf24';
  const mainLabel = isTag ? `TAĞ-vdW @ P=${Pbar.toFixed(1)} bar` : `Klasik vdW @ P=${Pbar.toFixed(1)} bar`;
  const fileBase = `isobars-${modelMode}-${axisMode}-P${Pbar.toFixed(1)}bar`;
  const csvColumns = [
    { key: 'Vm', label: 'Vm_L_per_mol' },
    { key: 'rho', label: 'rho_g_per_L' },
    { key: 'Tclassic', label: 'T_classic_K' },
    { key: 'Ttag', label: 'T_tag_K' },
    { key: 'Tcritical', label: 'T_at_Pcr_K' },
    { key: 'Tlow', label: 'T_low_pressure_K' },
    { key: 'Thigh', label: 'T_high_pressure_K' },
    { key: 'deltaT', label: 'delta_T_K' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">T–{useRho ? 'ρ' : 'Vₘ'} Diyagramı · İzobarlar</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCompare && 'İki model üst üste: sarı = klasik, yeşil = TAĞ-vdW'}
            {isTag && 'Metastabil düzeltme ile: T(Vₘ) = [(P − Δpₘ·Λ) + a/Vₘ²](Vₘ − b)/R'}
            {isClassic && 'Klasik van der Waals: T(Vₘ) = (P + a/Vₘ²)(Vₘ − b)/R'}
          </p>
        </div>

        {!isClassic && dev.maxAbs > 0.01 && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-mono text-[10px]">
            <div>
              <div className="text-emerald-400/60 uppercase tracking-wider text-[9px]">Max ΔT</div>
              <div className="text-sm tabular-nums text-emerald-700">
                {dev.signed >= 0 ? '+' : ''}{dev.signed.toFixed(2)} K
              </div>
            </div>
            <div className="h-7 w-px bg-emerald-200" />
            <div>
              <div className="text-emerald-400/60 uppercase tracking-wider text-[9px]">@ {useRho ? 'ρ' : 'Vₘ'}</div>
              <div className="text-sm tabular-nums text-emerald-700">
                {(useRho ? rhoFromVm(dev.atV, M) : dev.atV).toFixed(useRho ? 1 : 3)} {xUnit}
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
              tickFormatter={formatCompactTick}
              stroke="#64748b"
              tick={chartTick}
              label={{ ...chartAxisLabel, value: 'T  [K]', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={
                <ChartTooltip
                  xLabel={useRho ? 'ρ' : 'Vₘ'}
                  xUnit={xUnit}
                  xDecimals={useRho ? 1 : 3}
                  valueUnit="K"
                  valueDecimals={2}
                  referenceRows={pcrTooltipRows}
                />
              }
            />
            <Legend wrapperStyle={chartLegendStyle} />
            <ReferenceLine
              y={Tcr}
              stroke="#64748b"
              strokeDasharray="3 3"
              label={{ ...chartReferenceLabel, value: `Tcr=${Tcr.toFixed(1)} K`, position: 'right' }}
            />

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

            <Line
              dataKey="Tlow"
              stroke="#c084fc"
              dot={false}
              name={`P=${(PcrBar * 0.5).toFixed(1)} bar`}
              strokeWidth={1}
              strokeDasharray="3 3"
              isAnimationActive={false}
            />
            <Line
              dataKey="Tcritical"
              stroke="#ef4444"
              dot={false}
              name={`Pcr=${PcrBar.toFixed(1)} bar`}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            <Line
              dataKey="Thigh"
              stroke="#60a5fa"
              dot={false}
              name={`P=${(PcrBar * 1.5).toFixed(1)} bar`}
              strokeWidth={1}
              strokeDasharray="3 3"
              isAnimationActive={false}
            />

            {isCompare ? (
              <>
                <Line
                  dataKey="Tclassic"
                  stroke="#fbbf24"
                  dot={false}
                  name={`Klasik @ P=${Pbar.toFixed(1)} bar`}
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  isAnimationActive={false}
                />
                <Line
                  dataKey="Ttag"
                  stroke="#10b981"
                  dot={false}
                  name={`TAĞ @ P=${Pbar.toFixed(1)} bar`}
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
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="h-24 border-t border-slate-200 px-2 pt-1">
        <div className="flex items-center justify-between px-3 pt-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
            ΔT({useRho ? 'ρ' : 'Vₘ'}) = T_TAĞ − T_klasik
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
              tickFormatter={formatCompactTick}
            />
            <Tooltip
              content={
                <ChartTooltip
                  xLabel={useRho ? 'ρ' : 'Vₘ'}
                  xUnit={xUnit}
                  xDecimals={useRho ? 1 : 3}
                  valueFormatter={(val) => [`${Number(val).toFixed(2)} K`, 'ΔT']}
                  referenceRows={pcrTooltipRows}
                />
              }
            />
            <ReferenceLine y={0} stroke="#475569" />
            <Area
              dataKey="deltaT"
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
