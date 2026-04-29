export default function Toggle({ options, value, onChange, sliderColor }) {
  const idx = options.findIndex((option) => option.value === value);
  const count = options.length;
  const widthPct = 100 / count;

  return (
    <div className="relative inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            value === option.value ? 'text-slate-950' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {option.label}
        </button>
      ))}
      <div
        className="absolute bottom-1 top-1 rounded-lg transition-all duration-300 ease-out"
        style={{
          width: `calc(${widthPct}% - 8px)`,
          left: `calc(${idx * widthPct}% + 4px)`,
          background: sliderColor || '#0f172a',
          opacity: 0.18,
        }}
      />
    </div>
  );
}
