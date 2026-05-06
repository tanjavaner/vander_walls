import { Download, FileSpreadsheet, Image, Shapes } from 'lucide-react';

export default function ExportMenu({ onPng, onSvg, onCsv, allowSvg = true }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1">
      <span className="sr-only">Disari aktar</span>
      {onPng && (
        <button
          type="button"
          onClick={onPng}
          title="PNG indir"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          <Image size={14} />
        </button>
      )}
      {allowSvg && onSvg && (
        <button
          type="button"
          onClick={onSvg}
          title="SVG indir"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          <Shapes size={14} />
        </button>
      )}
      {onCsv && (
        <button
          type="button"
          onClick={onCsv}
          title="CSV indir"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          <FileSpreadsheet size={14} />
        </button>
      )}
      <Download size={13} className="mx-1 text-slate-400" />
    </div>
  );
}
