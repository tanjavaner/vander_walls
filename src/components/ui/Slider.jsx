import { useEffect, useState } from 'react';

function parseInput(text) {
  const normalized = String(text).trim().replace(',', '.');
  if (!normalized || normalized === '-' || normalized === '.' || normalized === ',') return null;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function clampForRange(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

export default function Slider({
  label,
  value,
  min, max, step,
  onChange,
  unit = '',
  format = (v) => v.toFixed(3),
}) {
  const [draft, setDraft] = useState(() => (Number.isFinite(Number(value)) ? format(value) : ''));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraft(Number.isFinite(Number(value)) ? format(value) : '');
    }
  }, [editing, format, value]);

  const handleTextChange = (event) => {
    const nextText = event.target.value;
    setDraft(nextText);

    const nextValue = parseInput(nextText);
    if (nextValue !== null) onChange(nextValue);
  };

  const commitText = () => {
    const nextValue = parseInput(draft);
    if (nextValue === null) {
      setDraft(Number.isFinite(Number(value)) ? format(value) : '');
    } else {
      onChange(nextValue);
      setDraft(format(nextValue));
    }
    setEditing(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      setDraft(Number.isFinite(Number(value)) ? format(value) : '');
      setEditing(false);
      event.currentTarget.blur();
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] uppercase tracking-[0.15em] text-slate-500">{label}</label>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="decimal"
            value={editing ? draft : (Number.isFinite(Number(value)) ? format(value) : '')}
            onChange={handleTextChange}
            onFocus={() => {
              setEditing(true);
              setDraft(Number.isFinite(Number(value)) ? String(value) : '');
            }}
            onBlur={commitText}
            onKeyDown={handleKeyDown}
            className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-right font-mono text-sm font-semibold tabular-nums text-slate-900 outline-none transition-colors focus:border-slate-900"
            aria-label={label}
          />
          {unit && <span className="text-xs text-slate-400">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clampForRange(value, min, max)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
        style={{ accentColor: '#0f172a' }}
      />
      <div className="sr-only">{format(value)} {unit}</div>
    </div>
  );
}
