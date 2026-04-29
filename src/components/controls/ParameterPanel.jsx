import { Settings2 } from 'lucide-react';
import Slider from '../ui/Slider.jsx';

export default function ParameterPanel({
  params, T, P, setT, setP, update, updateAB,
}) {
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
        <Slider label="a" value={params.a} min={0.01} max={50} step={0.01} onChange={updateAB('a')} unit="L²·atm/mol²" format={(v) => v.toFixed(3)} />
        <Slider label="b" value={params.b} min={0.005} max={0.2} step={0.0001} onChange={updateAB('b')} unit="L/mol" format={(v) => v.toFixed(4)} />
        <Slider label="M" value={params.M ?? 50} min={1} max={300} step={0.001} onChange={update('M')} unit="g/mol" format={(v) => v.toFixed(3)} />
      </div>

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Çalışma noktası</div>
        <Slider label="T (izoterm)" value={T} min={params.Tmin} max={params.Tmax} step={0.5} onChange={setT} unit="K" format={(v) => v.toFixed(1)} />
        <Slider label="P (izobar)" value={P} min={params.Pmin} max={params.Pmax} step={0.1} onChange={setP} unit="atm" format={(v) => v.toFixed(2)} />
      </div>

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Metastabil katkı</div>
        <Slider label="A (amplitüd)" value={params.A} min={0} max={10} step={0.01} onChange={update('A')} unit="atm" format={(v) => v.toFixed(2)} />
        <Slider label="V₀ (merkez)" value={params.V0} min={params.Vmin} max={params.Vmax} step={0.001} onChange={update('V0')} unit="L/mol" format={(v) => v.toFixed(3)} />
        <Slider label="σ (genişlik)" value={params.sigma} min={0.002} max={0.1} step={0.0005} onChange={update('sigma')} unit="L/mol" format={(v) => v.toFixed(3)} />
        <Slider label="τ (ömür)" value={params.tau} min={0.05} max={10} step={0.01} onChange={update('tau')} unit="—" format={(v) => v.toFixed(2)} />
      </div>

      <div className="space-y-0.5 border-t border-slate-200 pt-2 font-mono text-[10px] text-slate-500">
        <div>R = 0.08206 L·atm/(mol·K)</div>
        <div>Tcr = {params.Tcr.toFixed(2)} K</div>
        <div>Pcr = {params.Pcr.toFixed(2)} atm</div>
        <div>Vc ≈ 3b = {(3 * params.b).toFixed(4)} L/mol</div>
        <div>ρcr ≈ M/(3b) = {((params.M ?? 50) / (3 * params.b)).toFixed(2)} g/L</div>
      </div>
    </aside>
  );
}
