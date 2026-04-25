/**
 * Model Toggle (Klasik / Karşılaştır / TAĞ) + Eksen Toggle (Vₘ / ρ)
 * Üst barda yan yana yer alır.
 */
import Toggle from '../ui/Toggle.jsx';

const MODEL_OPTIONS = [
  { value: 'classic', label: 'Klasik vdW' },
  { value: 'compare', label: 'Karşılaştır' },
  { value: 'tag',     label: 'TAĞ-vdW' },
];

const AXIS_OPTIONS = [
  { value: 'Vm',  label: 'Vₘ' },
  { value: 'rho', label: 'ρ' },
];

const MODEL_COLORS = {
  classic: '#fbbf24',
  compare: '#22d3ee',
  tag:     '#10b981',
};

const AXIS_COLORS = {
  Vm:  '#60a5fa',
  rho: '#22d3ee',
};

const MODEL_HINTS = {
  classic: '— yalnızca klasik denge durumları',
  compare: '— iki eğri üst üste, fark doğrudan görünür',
  tag:     '— metastabil düzeltmeli genişletilmiş model',
};

export default function ModelToggle({ modelMode, setModelMode, axisMode, setAxisMode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/40 flex-wrap">
      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono">Model</span>
      <Toggle
        options={MODEL_OPTIONS}
        value={modelMode}
        onChange={setModelMode}
        sliderColor={MODEL_COLORS[modelMode]}
      />
      <span className="text-[11px] text-slate-500 hidden sm:inline">
        {MODEL_HINTS[modelMode]}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono">Eksen</span>
        <Toggle
          options={AXIS_OPTIONS}
          value={axisMode}
          onChange={setAxisMode}
          sliderColor={AXIS_COLORS[axisMode]}
        />
        <span className="text-[10px] font-mono text-slate-500 hidden lg:inline">
          {axisMode === 'Vm' ? 'L/mol' : 'g/L'}
        </span>
      </div>
    </div>
  );
}
