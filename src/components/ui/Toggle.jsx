/**
 * Segmented Toggle — 2 veya 3 seçenekli yuvarlak buton grubu.
 * Model ve Eksen toggle'larının dayandığı temel bileşen.
 */
export default function Toggle({ options, value, onChange, sliderColor }) {
  const idx = options.findIndex((o) => o.value === value);
  const count = options.length;
  const widthPct = 100 / count;

  return (
    <div className="relative inline-flex bg-slate-900 border border-slate-700 rounded-full p-0.5">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative z-10 px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
            value === opt.value ? 'text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}>
          {opt.label}
        </button>
      ))}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-out"
        style={{
          width: `calc(${widthPct}% - 2px)`,
          left: `calc(${idx * widthPct}% + 1px)`,
          background: sliderColor || '#fbbf24',
        }}
      />
    </div>
  );
}
