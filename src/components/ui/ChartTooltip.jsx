function formatNumber(value, decimals) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(decimals) : String(value ?? '');
}

function formatWithUnit(value, decimals, unit) {
  const formatted = formatNumber(value, decimals);
  return unit ? `${formatted} ${unit}` : formatted;
}

export default function ChartTooltip({
  active,
  payload,
  label,
  xLabel = 'x',
  xUnit = '',
  xDecimals = 2,
  valueUnit = '',
  valueDecimals = 2,
  valueFormatter,
}) {
  if (!active || !payload?.length) return null;

  const rows = payload.filter((entry) => {
    if (!entry || entry.value === null || entry.value === undefined) return false;
    return Number.isFinite(Number(entry.value));
  });
  if (!rows.length) return null;

  return (
    <div className="min-w-44 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-[11px] text-slate-100 shadow-lg">
      <div className="mb-2 border-b border-slate-700 pb-1.5">
        <div className="text-[9px] uppercase tracking-wider text-slate-400">X ekseni</div>
        <div className="tabular-nums text-slate-50">
          {xLabel} = {formatWithUnit(label, xDecimals, xUnit)}
        </div>
      </div>

      <div className="space-y-1">
        {rows.map((entry) => {
          const formatted = valueFormatter
            ? valueFormatter(entry.value, entry)
            : [formatWithUnit(entry.value, valueDecimals, valueUnit), entry.name ?? entry.dataKey];
          const [value, name = entry.name ?? entry.dataKey] = Array.isArray(formatted)
            ? formatted
            : [formatted, entry.name ?? entry.dataKey];

          return (
            <div key={`${entry.dataKey}-${entry.name}`} className="flex items-center justify-between gap-4">
              <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color ?? '#94a3b8' }}
                />
                <span className="truncate">{name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-slate-50">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
