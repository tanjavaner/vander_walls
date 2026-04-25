/**
 * Özel Slider — etiket + değer + aralık.
 */
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
        <label className="text-[11px] uppercase tracking-[0.15em] text-slate-400">{label}</label>
        <span className="font-mono text-sm text-amber-300 tabular-nums">
          {format(value)}
          <span className="text-slate-500 ml-1 text-xs">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#fbbf24' }}
      />
    </div>
  );
}
