const DAYS = [
  { value: 0, label: "S" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
];

/** `value` is an array of 0-6 (0 = Sunday). Toggling all-off snaps back to
 * "every day" since a schedule active on zero days makes no sense. */
export default function DaysOfWeekPicker({ value = [0, 1, 2, 3, 4, 5, 6], onChange }) {
  const toggle = (day) => {
    const has = value.includes(day);
    const next = has ? value.filter((d) => d !== day) : [...value, day].sort();
    onChange(next.length ? next : [0, 1, 2, 3, 4, 5, 6]);
  };

  return (
    <div className="flex gap-1.5">
      {DAYS.map((d) => {
        const active = value.includes(d.value);
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => toggle(d.value)}
            aria-pressed={active}
            aria-label={`Toggle day ${d.value}`}
            className="flex h-8 w-8 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-colors"
            style={
              active
                ? { backgroundColor: "var(--brand)", color: "white" }
                : { backgroundColor: "transparent", color: "#7C879C", border: "1px solid rgba(16,26,46,0.12)" }
            }
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}
