/**
 * TAĞ-vdW Metastabil Modeli — Ana Uygulama
 * =========================================
 *
 * 5 sekme:
 *   - İzotermler  (p-V düzlemi)
 *   - İzobarlar   (T-V düzlemi)
 *   - 3D Yüzey    (serbest eksenli)
 *   - Sıçrama     (τ→0 animasyonu)
 *   - T-t Termogramı (deneysel şekil)
 */
import { useState } from 'react';
import { Atom, Thermometer, Gauge, Activity, LineChart as LineIcon } from 'lucide-react';

import { useParams } from './hooks/useParams.js';

import GasSelector from './components/controls/GasSelector.jsx';
import ModelToggle from './components/controls/ModelToggle.jsx';
import ParameterPanel from './components/controls/ParameterPanel.jsx';
import Tab from './components/ui/Tab.jsx';

import IsothermsView from './components/views/IsothermsView.jsx';
import IsobarsView from './components/views/IsobarsView.jsx';
import Surface3DView from './components/views/Surface3DView.jsx';
import JumpAnimationView from './components/views/JumpAnimationView.jsx';
import ThermogramView from './components/views/ThermogramView.jsx';

export default function App() {
  const paramsHook = useParams();
  const { params, T, P } = paramsHook;

  const [tab, setTab] = useState('iso');
  const [modelMode, setModelMode] = useState('tag');
  const [axisMode, setAxisMode] = useState('Vm');

  return (
    <div className="min-h-screen w-full bg-[#0a0e1a] text-slate-200 relative overflow-hidden">
      {/* Atmosfer */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-5 py-6">
        {/* Başlık */}
        <header className="mb-6 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 border border-amber-400/40 rounded-sm flex items-center justify-center bg-amber-400/5">
              <Atom size={18} className="text-amber-300" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">
              Phase Transition Lab · v2.0 · Modular
            </div>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-slate-50 leading-[1.05] tracking-tight">
            TAĞ<span className="text-amber-300">–</span>vdW
            <span className="italic text-slate-400"> Metastabil Modeli</span>
          </h1>
          <p className="mt-3 text-slate-400 text-sm max-w-3xl leading-relaxed">
            Klasik van der Waals denkleminin metastabil faz ömrü{' '}
            <span className="font-mono text-amber-300">τ(P,T)</span> ile genişletilmiş hali.
            Kritik durum <span className="font-mono text-amber-300">τ→0</span> sonlanma sınırıdır.
          </p>

          <div className="mt-4 p-3 bg-slate-900/60 border border-slate-800 rounded font-mono text-sm text-slate-300 overflow-x-auto">
            <span className="text-slate-500">p(Vₘ,T) = </span>
            <span className="text-cyan-300">RT/(Vₘ−b)</span>
            <span className="text-slate-500"> − </span>
            <span className="text-cyan-300">a/Vₘ²</span>
            <span className="text-slate-500"> + </span>
            <span className="text-emerald-300">Δpₘ(Vₘ,T)</span>
            <span className="text-slate-500"> · </span>
            <span className="text-amber-300">exp(−1/τ(P,T))</span>
          </div>
        </header>

        <GasSelector {...paramsHook} />

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <ParameterPanel {...paramsHook} />

          <main className="bg-slate-900/40 border border-slate-800 rounded-lg backdrop-blur-sm flex flex-col" style={{ minHeight: '680px' }}>
            <ModelToggle
              modelMode={modelMode} setModelMode={setModelMode}
              axisMode={axisMode} setAxisMode={setAxisMode}
            />

            <nav className="flex border-b border-slate-800 overflow-x-auto">
              <Tab active={tab === 'iso'}    onClick={() => setTab('iso')}    icon={Thermometer} label="İzotermler (p-V)" />
              <Tab active={tab === 'isobar'} onClick={() => setTab('isobar')} icon={Gauge}       label="İzobarlar (T-V)" />
              <Tab active={tab === '3d'}     onClick={() => setTab('3d')}     icon={Atom}        label="3D Yüzey" />
              <Tab active={tab === 'jump'}   onClick={() => setTab('jump')}   icon={Activity}    label="Sıçrama (τ→0)" />
              <Tab active={tab === 'thermo'} onClick={() => setTab('thermo')} icon={LineIcon}    label="T-t Termogramı" />
            </nav>

            <div className="flex-1 min-h-0">
              {tab === 'iso'    && <IsothermsView     params={params} T={T} modelMode={modelMode} axisMode={axisMode} />}
              {tab === 'isobar' && <IsobarsView       params={params} P={P} modelMode={modelMode} axisMode={axisMode} />}
              {tab === '3d'     && <Surface3DView     params={params}        modelMode={modelMode} />}
              {tab === 'jump'   && <JumpAnimationView params={params} T={T} modelMode={modelMode} axisMode={axisMode} />}
              {tab === 'thermo' && <ThermogramView    params={params} />}
            </div>
          </main>
        </div>

        <footer className="mt-6 pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 leading-relaxed max-w-4xl">
          <p>
            <span className="text-amber-400/80 font-medium">Not:</span>{' '}
            Δpₘ(Vₘ) Gauss penceresi olarak alınmıştır; gerçek kalibrasyon deneysel metastabil ömür
            verileriyle yapılmalıdır. Λ = exp(−1/τ) → τ→0 limitinde 0'a gider ve model klasik vdW
            formuna döner — kritik sonlanma koşulunun matematiksel ifadesi.
          </p>
        </footer>
      </div>
    </div>
  );
}
