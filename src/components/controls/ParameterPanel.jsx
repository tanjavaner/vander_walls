import { Settings2 } from 'lucide-react';
import { ATM_TO_BAR, BAR_TO_ATM } from '../../physics/constants.js';
import Slider from '../ui/Slider.jsx';

export default function ParameterPanel({
  params, T, P, setT, setP, update, updateAB, updateCritical,
}) {
  const toBar = (value) => value * ATM_TO_BAR;
  const toAtm = (value) => value * BAR_TO_ATM;
  const aMax = Math.max(50, params.a * 1.5);
  const bMax = Math.max(0.2, params.b * 1.5);
  const volumeStep = Math.max(0.000001, (params.Vmax - params.Vmin) / 1000);
  const sigmaMax = Math.max(0.1, params.sigma * 1.5);

  return (
    <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Settings2 size={14} className="text-slate-400" />
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
          Parametreler
        </span>
      </div>

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">vdW sabitleri</div>
        <Slider label="a" value={params.a} min={0.000001} max={aMax} step={0.000001} onChange={updateAB('a')} unit="L²·atm/mol²" format={(v) => (v < 0.01 ? v.toExponential(3) : v.toFixed(3))} />
        <Slider label="b" value={params.b} min={0.000001} max={bMax} step={0.000001} onChange={updateAB('b')} unit="L/mol" format={(v) => (v < 0.001 ? v.toExponential(3) : v.toFixed(5))} />
        <Slider label="M" value={params.M ?? 50} min={1} max={300} step={0.001} onChange={update('M')} unit="g/mol" format={(v) => v.toFixed(3)} />
      </div>

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Kritik referans</div>
        <Slider label="Tcr" value={params.Tcr} min={Math.max(0.1, params.Tcr * 0.2)} max={Math.max(params.Tmax, params.Tcr * 2, T + 1)} step={0.1} onChange={updateCritical('Tcr')} unit="K" format={(v) => v.toFixed(1)} />
        <Slider label="Pcr" value={toBar(params.Pcr)} min={Math.max(0.1, toBar(params.Pcr) * 0.05)} max={Math.max(toBar(params.Pmax), toBar(params.Pcr) * 2, toBar(P) + 1)} step={0.1} onChange={(v) => updateCritical('Pcr')(toAtm(v))} unit="bar" format={(v) => v.toFixed(1)} />
      </div>

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Çalışma noktası</div>
        <Slider label="T (izoterm)" value={T} min={params.Tmin} max={params.Tmax} step={0.5} onChange={setT} unit="K" format={(v) => v.toFixed(1)} />
        <Slider label="P (izobar)" value={toBar(P)} min={toBar(params.Pmin)} max={toBar(params.Pmax)} step={0.1} onChange={(v) => setP(toAtm(v))} unit="bar" format={(v) => v.toFixed(1)} />
      </div>

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Metastabil katkı</div>
        <Slider label="A (amplitüd)" value={toBar(params.A)} min={0} max={toBar(Math.max(10, params.Pcr * 0.2, params.A * 1.2))} step={0.01} onChange={(v) => update('A')(toAtm(v))} unit="bar" format={(v) => v.toFixed(2)} />
        <Slider label="V₀ (merkez)" value={params.V0} min={params.Vmin} max={params.Vmax} step={volumeStep} onChange={update('V0')} unit="L/mol" format={(v) => (v < 0.001 ? v.toExponential(3) : v.toFixed(3))} />
        <Slider label="σ (genişlik)" value={params.sigma} min={0.000001} max={sigmaMax} step={Math.max(0.000001, sigmaMax / 1000)} onChange={update('sigma')} unit="L/mol" format={(v) => (v < 0.001 ? v.toExponential(3) : v.toFixed(3))} />
        <Slider label="τ (ömür)" value={params.tau} min={0.05} max={10} step={0.01} onChange={update('tau')} unit="—" format={(v) => v.toFixed(2)} />
      </div>

      <div className="space-y-0.5 border-t border-slate-200 pt-2 font-mono text-[10px] text-slate-500">
        <div>R = 0.08206 L·atm/(mol·K)</div>
        <div>Tcr = {params.Tcr.toFixed(2)} K</div>
        <div>Pcr = {toBar(params.Pcr).toFixed(2)} bar</div>
        <div>Vc ≈ 3b = {(3 * params.b).toFixed(4)} L/mol</div>
        <div>ρcr ≈ M/(3b) = {((params.M ?? 50) / (3 * params.b)).toFixed(2)} g/L</div>
      </div>
    </aside>
  );
}
