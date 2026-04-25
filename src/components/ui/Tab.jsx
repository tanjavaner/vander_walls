/**
 * Sekme düğmesi — üst nav için.
 */
export default function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium tracking-wide transition-all border-b-2 whitespace-nowrap ${
        active
          ? 'text-amber-300 border-amber-400'
          : 'text-slate-500 border-transparent hover:text-slate-300'
      }`}>
      <Icon size={15} />
      {label}
    </button>
  );
}
