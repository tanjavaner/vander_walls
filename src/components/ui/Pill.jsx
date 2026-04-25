/**
 * Pill — küçük, yuvarlak kategori etiketi.
 */
const COLORS = {
  stone:   'bg-stone-800 text-stone-300',
  amber:   'bg-amber-500/15 text-amber-200 border border-amber-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  rose:    'bg-rose-500/15 text-rose-200 border border-rose-500/30',
  violet:  'bg-violet-500/15 text-violet-200 border border-violet-500/30',
  blue:    'bg-blue-500/15 text-blue-200 border border-blue-500/30',
  cyan:    'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30',
};

export default function Pill({ children, color = 'stone' }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${COLORS[color]}`}>
      {children}
    </span>
  );
}
