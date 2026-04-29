export default function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-slate-950 shadow-sm'
          : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}
