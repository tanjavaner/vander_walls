const COLORS = {
  stone: 'border border-slate-200 bg-slate-100 text-slate-600',
  amber: 'border border-amber-200 bg-amber-50 text-amber-700',
  emerald: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  rose: 'border border-rose-200 bg-rose-50 text-rose-700',
  violet: 'border border-violet-200 bg-violet-50 text-violet-700',
  blue: 'border border-blue-200 bg-blue-50 text-blue-700',
  cyan: 'border border-cyan-200 bg-cyan-50 text-cyan-700',
};

export default function Pill({ children, color = 'stone' }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${COLORS[color]}`}>
      {children}
    </span>
  );
}
