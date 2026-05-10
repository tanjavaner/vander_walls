import { Maximize2, Minimize2 } from 'lucide-react';

export default function FullscreenButton({ isFullscreen, onClick, className = '' }) {
  const Icon = isFullscreen ? Minimize2 : Maximize2;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950 ${className}`}
      title={isFullscreen ? 'Tam ekrandan çık' : 'Grafiği tam ekran yap'}
    >
      <Icon size={13} />
      {isFullscreen ? 'Çık' : 'Tam ekran'}
    </button>
  );
}
