export default function Slider({
  label,
  value,
  min, max, step,
  onChange,
  unit = '',
  format = (v) => v.toFixed(3),
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] uppercase tracking-[0.15em] text-slate-500">{label}</label>
        <span className="font-mono text-sm tabular-nums text-slate-900">
          {format(value)}
          <span className="ml-1 text-xs text-slate-400">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
        style={{ accentColor: '#0f172a' }}
      />
    </div>
  );
}
