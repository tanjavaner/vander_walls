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
  const showsAxisToggle = tab === 'iso' || tab === 'isobar' || tab === 'jump';

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1360px] px-4 py-5 md:px-6 md:py-6">
        <header className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Atom size={18} />
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
              Phase Transition Lab
            </div>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            TAĞ-vdW metastabil modeli
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Klasik van der Waals modelinin metastabil faz ömrü{' '}
            <span className="font-mono text-slate-900">τ(P,T)</span> ile genişletilmiş karşılaştırmalı gösterimi.
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700">
            <span className="text-slate-500">p(Vₘ,T) = </span>
            <span>RT/(Vₘ−b)</span>
            <span className="text-slate-500"> − </span>
            <span>a/Vₘ²</span>
            <span className="text-slate-500"> + </span>
            <span>Δpₘ(Vₘ,T)</span>
            <span className="text-slate-500"> · </span>
            <span>exp(−1/τ(P,T))</span>
          </div>
        </header>

        <GasSelector {...paramsHook} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <ParameterPanel {...paramsHook} />

          <main className="flex min-h-[680px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ModelToggle
              modelMode={modelMode}
              setModelMode={setModelMode}
              axisMode={axisMode}
              setAxisMode={setAxisMode}
              showAxisToggle={showsAxisToggle}
            />

            <nav className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/80 px-2">
              <Tab active={tab === 'iso'} onClick={() => setTab('iso')} icon={Thermometer} label="İzotermler (p-V)" />
              <Tab active={tab === 'isobar'} onClick={() => setTab('isobar')} icon={Gauge} label="İzobarlar (T-V)" />
              <Tab active={tab === '3d'} onClick={() => setTab('3d')} icon={Atom} label="3D Yüzey" />
              <Tab active={tab === 'jump'} onClick={() => setTab('jump')} icon={Activity} label="Sıçrama (τ→0)" />
              <Tab active={tab === 'thermo'} onClick={() => setTab('thermo')} icon={LineIcon} label="T-t Termogramı" />
            </nav>

            <div className="flex-1 min-h-0">
              {tab === 'iso' && <IsothermsView params={params} T={T} modelMode={modelMode} axisMode={axisMode} />}
              {tab === 'isobar' && <IsobarsView params={params} P={P} modelMode={modelMode} axisMode={axisMode} />}
              {tab === '3d' && <Surface3DView params={params} modelMode={modelMode} />}
              {tab === 'jump' && <JumpAnimationView params={params} T={T} modelMode={modelMode} axisMode={axisMode} />}
              {tab === 'thermo' && <ThermogramView params={params} />}
            </div>
          </main>
        </div>

        <footer className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[12px] leading-6 text-slate-500 shadow-sm">
          <p>
            <span className="font-medium text-slate-700">Not:</span>{' '}
            Δpₘ(Vₘ) Gauss penceresi olarak alınmıştır; gerçek kalibrasyon deneysel metastabil ömür verileriyle
            yapılmalıdır. Λ = exp(−1/τ) ifadesi τ→0 limitinde 0&apos;a gider ve model klasik vdW formuna döner.
          </p>
        </footer>
      </div>
    </div>
  );
}
