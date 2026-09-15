import { useMemo, useState } from "react";
import medicationsDataset from "../../data/medicationsDataset.json";

/**
 * Free-text name input backed by a 74-entry synthetic medicine reference
 * dataset (`src/data/medicationsDataset.json`, mirrored in
 * `ml/data/samples/`) so patients get suggestions with generic name,
 * common strengths and category as they type — without calling any
 * external API. Picking a suggestion also prefills strength/form.
 */
export default function MedicationAutocomplete({ value, onChange, onSelectSuggestion }) {
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 1) return [];
    return medicationsDataset
      .filter((m) => m.name.toLowerCase().includes(q) || m.generic_name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [value]);

  return (
    <div className="relative">
      <input
        className="field-input"
        placeholder="e.g. Metformin"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        autoComplete="off"
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-ink/10 bg-white shadow-soft">
          {matches.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelectSuggestion(m);
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-porcelain-dim"
              >
                <span className="font-body text-sm font-semibold text-ink">{m.name}</span>
                <span className="font-body text-[12px] text-ink-fog">
                  {m.generic_name} · {m.category} · {m.common_strengths.join(", ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
