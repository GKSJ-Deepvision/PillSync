/**
 * Labelled horizontal bars, for comparing a handful of categories.
 *
 * `rows` is `[{label, value, detail?}]`; `max` fixes the scale (100 for
 * percentages) so two charts side by side are comparable. Rows with a null
 * value are shown as "no data" instead of an empty bar that looks like zero.
 */
export default function HBars({ rows = [], max = 100, unit = '%', tone = 'brand' }) {
  const fill = { brand: 'bg-brand-500', danger: 'bg-rose-500', success: 'bg-emerald-500' }[tone];

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Nothing to compare yet.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => {
        const known = row.value != null;
        const width = known ? Math.min(100, (row.value / max) * 100) : 0;
        return (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-slate-700">{row.label}</span>
              <span className="shrink-0 tabular-nums text-slate-500">
                {known ? `${Math.round(row.value * 10) / 10}${unit}` : 'no data'}
                {row.detail && <span className="ml-2 text-xs text-slate-400">{row.detail}</span>}
              </span>
            </div>
            <div
              role="img"
              aria-label={`${row.label}: ${known ? `${row.value}${unit}` : 'no data'}`}
              className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div className={`h-full rounded-full ${fill}`} style={{ width: `${width}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
