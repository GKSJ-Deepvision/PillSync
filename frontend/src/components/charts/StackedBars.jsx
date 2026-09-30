import { countAxis, labelIndices, linear, shortDate, ticks } from './scale.js';

const W = 640;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 32 };

/**
 * Doses per day, taken stacked under missed.
 *
 * `data` is `[{date, taken, missed}]`. Each bar carries a <title>, so hovering
 * (or a screen reader) gets the exact figures rather than a guess from bar height.
 */
export default function StackedBars({ data = [], label = 'Doses per day' }) {
  const totals = data.map((d) => (d.taken || 0) + (d.missed || 0));
  const { max, count } = countAxis(Math.max(0, ...totals));
  const y = linear([0, max], [H - PAD.bottom, PAD.top]);
  const innerW = W - PAD.left - PAD.right;
  const slot = data.length ? innerW / data.length : innerW;
  const barW = Math.max(2, slot * 0.7);

  const taken = data.reduce((sum, d) => sum + (d.taken || 0), 0);
  const missed = data.reduce((sum, d) => sum + (d.missed || 0), 0);

  if (data.length === 0 || totals.every((t) => t === 0)) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
        No doses recorded in this period yet.
      </p>
    );
  }

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label}: ${taken} taken and ${missed} missed over ${data.length} days`}
        className="h-auto w-full"
      >
        {ticks(max, count).map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              className="stroke-slate-200"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 6}
              y={y(t) + 4}
              textAnchor="end"
              className="fill-slate-500 text-[10px]"
            >
              {t}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const takenH = y(0) - y(d.taken || 0);
          const missedH = y(0) - y(d.missed || 0);
          return (
            <g key={d.date}>
              <title>{`${shortDate(d.date)}: ${d.taken || 0} taken, ${d.missed || 0} missed`}</title>
              <rect
                x={x}
                y={y(0) - takenH}
                width={barW}
                height={takenH}
                rx="1.5"
                className="fill-emerald-500"
              />
              <rect
                x={x}
                y={y(0) - takenH - missedH}
                width={barW}
                height={missedH}
                rx="1.5"
                className="fill-rose-500"
              />
            </g>
          );
        })}

        {labelIndices(data.length, 6).map((i) => (
          <text
            key={i}
            x={PAD.left + i * slot + slot / 2}
            y={H - 8}
            textAnchor="middle"
            className="fill-slate-500 text-[10px]"
          >
            {shortDate(data[i].date)}
          </text>
        ))}
      </svg>
      <figcaption className="mt-2 flex gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Taken
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Missed
        </span>
      </figcaption>
    </figure>
  );
}
