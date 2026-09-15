import { AGE_GROUPS, GENDERS } from "../lib/exerciseAnimation";

export default function CharacterControls({ ageGroup, gender, onAgeGroupChange, onGenderChange }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="field-label mb-2">Age group</p>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => onAgeGroupChange(g.key)}
              className={`chip ${ageGroup === g.key ? "chip-active" : ""}`}
            >
              {g.label} <span className="text-ink-fog/70">({g.hint})</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="field-label mb-2">Character</p>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => onGenderChange(g.key)}
              className={`chip ${gender === g.key ? "chip-active" : ""}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
