export default function ChartFrame({ title, subtitle, children, actions, footer }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-2 pt-3">
        <div>
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="min-h-0 flex-1 px-2 pb-2">{children}</div>
      {footer}
    </div>
  );
}
