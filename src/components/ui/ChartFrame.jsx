/**
 * ChartFrame — grafik için başlık + alt yazı taşıyıcı.
 */
export default function ChartFrame({ title, subtitle, children, actions, footer }) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3 flex-wrap">
        <div>
          {title && <h3 className="text-lg font-serif text-slate-100">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="flex-1 min-h-0 px-2 pb-2">{children}</div>
      {footer}
    </div>
  );
}
