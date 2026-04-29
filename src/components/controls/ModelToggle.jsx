import Toggle from '../ui/Toggle.jsx';

const MODEL_OPTIONS = [
  { value: 'classic', label: 'Klasik vdW' },
  { value: 'compare', label: 'Karşılaştır' },
  { value: 'tag', label: 'TAĞ-vdW' },
];

const AXIS_OPTIONS = [
  { value: 'Vm', label: 'Vₘ' },
  { value: 'rho', label: 'ρ' },
];

const MODEL_COLORS = {
  classic: '#f59e0b',
  compare: '#0f172a',
  tag: '#059669',
};

const AXIS_COLORS = {
  Vm: '#2563eb',
  rho: '#0891b2',
};

const MODEL_HINTS = {
  classic: 'yalnızca klasik denge durumları',
  compare: 'iki eğri birlikte gösterilir',
  tag: 'metastabil düzeltmeli genişletilmiş model',
};

export default function ModelToggle({
  modelMode,
  setModelMode,
  axisMode,
  setAxisMode,
  showAxisToggle = true,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Model</span>
      <Toggle
        options={MODEL_OPTIONS}
        value={modelMode}
        onChange={setModelMode}
        sliderColor={MODEL_COLORS[modelMode]}
      />
      <span className="hidden text-[11px] text-slate-500 sm:inline">
        {MODEL_HINTS[modelMode]}
      </span>

      {showAxisToggle && (
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Eksen</span>
          <Toggle
            options={AXIS_OPTIONS}
            value={axisMode}
            onChange={setAxisMode}
            sliderColor={AXIS_COLORS[axisMode]}
          />
          <span className="hidden font-mono text-[10px] text-slate-500 lg:inline">
            {axisMode === 'Vm' ? 'L/mol' : 'g/L'}
          </span>
        </div>
      )}
    </div>
  );
}
