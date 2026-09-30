import { areaPath, countAxis, labelIndices, linePath, linear, shortDate, ticks } from './scale.js';

const W = 640;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

const MARKER_STYLES = {
  danger: { line: 'stroke-rose-500', text: 'fill-rose-700' },
  brand: { line: 'stroke-brand-600', text: 'fill-brand-700' },
};

/**
 * A stock projection: units left, day by day, with the events that matter.
 *
 * `points` is `[{date, remaining}]`. `markers` is `[{date, label, tone}]` - the
 * depletion date and the recommended refill date - drawn as dashed vertical
 * lines, so the chart answers "when do I need to act" without any arithmetic.
 */
export default function LineChart({ points = [], markers = [], label = 'Stock remaining' }) {
  if (points.length < 2) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
        Not enough information to draw a projection.
      </p>
    );
  }

  const { max, count } = countAxis(Math.max(...points.map((p) => p.remaining)));
  const innerW = W - PAD.left - PAD.right;
  const x = linear([0, points.length - 1], [PAD.left, PAD.left + innerW]);
  const y = linear([0, max], [H - PAD.bottom, PAD.top]);
  const coords = points.map((p, i) => [x(i), y(p.remaining)]);
  const indexByDate = new Map(points.map((p, i) => [p.date, i]));

  const first = points[0];
  const last = points[points.length - 1];
  const zeroAt = points.find((p) => p.remaining <= 0);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          `${label}: ${first.remaining} now` +
          (zeroAt
            ? `, running out on ${shortDate(zeroAt.date)}`
            : `, ${last.remaining} left by ${shortDate(last.date)}`)
        }
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

        <path d={areaPath(coords, y(0))} className="fill-brand-500/15" />
        <path d={linePath(coords)} className="fill-none stroke-brand-600" strokeWidth="2" />

        {markers
          .filter((m) => indexByDate.has(m.date))
          .map((m) => {
            const style = MARKER_STYLES[m.tone] ?? MARKER_STYLES.brand;
            const mx = x(indexByDate.get(m.date));
            const nearRightEdge = mx > W - 110;
            return (
              <g key={`${m.date}-${m.label}`}>
                <line
                  x1={mx}
                  x2={mx}
                  y1={PAD.top}
                  y2={y(0)}
                  strokeDasharray="4 3"
                  strokeWidth="1.5"
                  className={style.line}
                />
                <text
                  x={nearRightEdge ? mx - 4 : mx + 4}
                  y={PAD.top + 10}
                  textAnchor={nearRightEdge ? 'end' : 'start'}
                  className={`${style.text} text-[10px] font-medium`}
                >
                  {m.label}
                </text>
              </g>
            );
          })}

        {labelIndices(points.length, 5).map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-slate-500 text-[10px]"
          >
            {shortDate(points[i].date)}
          </text>
        ))}
      </svg>
    </figure>
  );
}
