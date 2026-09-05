import { useCallback, useState } from 'react';

import medicationsApi from '../../api/medications.js';
import referenceApi from '../../api/reference.js';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { useMutation } from '../../hooks/useApi.js';

const SLOT_DEFAULT_TIMES = {
  MORNING: '08:00',
  AFTERNOON: '13:00',
  EVENING: '18:00',
  NIGHT: '21:00',
};

const SLOT_OPTIONS = [
  { value: 'MORNING', label: 'Morning' },
  { value: 'AFTERNOON', label: 'Afternoon' },
  { value: 'EVENING', label: 'Evening' },
  { value: 'NIGHT', label: 'Night' },
];

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Every day' },
  { value: 'SPECIFIC_DAYS', label: 'On chosen days' },
  { value: 'INTERVAL', label: 'Every N days' },
];

const WEEKDAYS = [
  [1, 'Mon'],
  [2, 'Tue'],
  [3, 'Wed'],
  [4, 'Thu'],
  [5, 'Fri'],
  [6, 'Sat'],
  [7, 'Sun'],
];

const emptyMedicine = (patientId) => ({
  patient: patientId ?? '',
  reference: '',
  name: '',
  category: 'OTHER',
  strength: '',
  strength_unit: '',
  instructions: '',
  quantity_remaining: '30',
  quantity_per_refill: '30',
  low_stock_threshold: '5',
});

const newSchedule = () => ({
  slot: 'MORNING',
  time_of_day: SLOT_DEFAULT_TIMES.MORNING,
  quantity_per_dose: '1',
  frequency: 'DAILY',
  days_of_week: [],
  interval_days: 2,
});

/** Search the seeded FDA catalogue and pick a medicine from it. */
function CatalogueSearch({ onPick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const search = useMutation(
    useCallback((term) => referenceApi.medicines({ search: term, page_size: 8 }), [])
  );

  async function handleSearch(event) {
    event.preventDefault();
    if (!query.trim()) return;
    const result = await search.submit(query.trim());
    if (result.ok) setResults(result.data.results ?? []);
  }

  return (
    <div className="rounded-lg bg-slate-50 p-4">
      {/* A nested <form> is invalid HTML, so this is a div with a keydown handler. */}
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Find it in the catalogue"
          placeholder="metformin, amlodipine, levothyroxine…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSearch(event)}
          className="min-w-56 flex-1"
          hint="Optional — picking one fills in the strength and category for you."
        />
        <Button
          type="button"
          variant="secondary"
          loading={search.submitting}
          onClick={handleSearch}
        >
          Search
        </Button>
      </div>

      {search.error && (
        <Alert tone="error" className="mt-3">
          {search.error.message}
        </Alert>
      )}

      {results.length > 0 && (
        <ul className="mt-3 max-h-56 divide-y divide-slate-200 overflow-y-auto rounded border border-slate-200 bg-white">
          {results.map((medicine) => (
            <li key={medicine.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(medicine);
                  setResults([]);
                  setQuery('');
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
              >
                <span className="font-medium text-slate-800">{medicine.generic_name}</span>
                <span className="ml-2 text-slate-500">
                  {medicine.strength} {medicine.strength_unit} · {medicine.dosage_form}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScheduleRow({ schedule, index, onChange, onRemove, removable }) {
  const set = (patch) => onChange(index, { ...schedule, ...patch });

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Time of day"
          options={SLOT_OPTIONS}
          value={schedule.slot}
          onChange={(event) =>
            set({
              slot: event.target.value,
              time_of_day: SLOT_DEFAULT_TIMES[event.target.value],
            })
          }
        />
        <Input
          label="At"
          type="time"
          value={schedule.time_of_day}
          onChange={(event) => set({ time_of_day: event.target.value })}
        />
        <Input
          label="How many"
          type="number"
          step="0.5"
          min="0.5"
          value={schedule.quantity_per_dose}
          onChange={(event) => set({ quantity_per_dose: event.target.value })}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Select
          label="Repeats"
          options={FREQUENCY_OPTIONS}
          value={schedule.frequency}
          onChange={(event) => set({ frequency: event.target.value })}
        />
        {schedule.frequency === 'INTERVAL' && (
          <Input
            label="Every N days"
            type="number"
            min="1"
            max="365"
            value={schedule.interval_days}
            onChange={(event) => set({ interval_days: Number(event.target.value) })}
          />
        )}
      </div>

      {schedule.frequency === 'SPECIFIC_DAYS' && (
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium text-slate-700">On these days</legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(([value, label]) => {
              const selected = schedule.days_of_week.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    set({
                      days_of_week: selected
                        ? schedule.days_of_week.filter((d) => d !== value)
                        : [...schedule.days_of_week, value].sort(),
                    })
                  }
                  className={`rounded-full border px-3 py-1 text-sm ${
                    selected
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {removable && (
        <div className="mt-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
            Remove this dose
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Add a medicine and its dosage schedule in one go.
 *
 * One request, not two: creating the medicine and then failing to create its
 * schedule would leave a medicine that silently never reminds anyone.
 */
export default function AddMedicineForm({ patientId, categories = [], onAdded }) {
  const [values, setValues] = useState(() => emptyMedicine(patientId));
  const [schedules, setSchedules] = useState(() => [newSchedule()]);
  const [fieldErrors, setFieldErrors] = useState({});

  const create = useMutation(useCallback((payload) => medicationsApi.createMedicine(payload), []));

  function pickFromCatalogue(reference) {
    setValues((current) => ({
      ...current,
      reference: reference.id,
      name: reference.generic_name,
      strength: reference.strength ?? '',
      strength_unit: reference.strength_unit ?? '',
      category: reference.category ?? 'OTHER',
    }));
  }

  function updateSchedule(index, next) {
    setSchedules((current) => current.map((entry, i) => (i === index ? next : entry)));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!values.name.trim()) {
      setFieldErrors({ name: 'Name the medicine, or pick one from the catalogue.' });
      return;
    }
    setFieldErrors({});

    const result = await create.submit({
      ...values,
      patient: patientId,
      reference: values.reference || null,
      quantity_per_refill: values.quantity_per_refill || null,
      schedules: schedules.map((entry) => ({
        ...entry,
        days_of_week: entry.frequency === 'SPECIFIC_DAYS' ? entry.days_of_week : [],
      })),
    });

    if (result.ok) {
      setValues(emptyMedicine(patientId));
      setSchedules([newSchedule()]);
      onAdded?.(result.data);
    }
  }

  const errorFor = (field) => fieldErrors[field] || create.error?.details?.[field]?.[0];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {create.error && <Alert tone="error">{create.error.message}</Alert>}

      <CatalogueSearch onPick={pickFromCatalogue} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Medicine name"
          required
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          error={errorFor('name')}
        />
        <Select
          label="Condition"
          options={categories}
          value={values.category}
          onChange={(event) => setValues({ ...values, category: event.target.value })}
        />
        <Input
          label="Strength"
          placeholder="500"
          value={values.strength}
          onChange={(event) => setValues({ ...values, strength: event.target.value })}
        />
        <Input
          label="Unit"
          placeholder="mg/1"
          value={values.strength_unit}
          onChange={(event) => setValues({ ...values, strength_unit: event.target.value })}
        />
        <Input
          label="How many do you have?"
          type="number"
          min="0"
          value={values.quantity_remaining}
          onChange={(event) => setValues({ ...values, quantity_remaining: event.target.value })}
          error={errorFor('quantity_remaining')}
          hint="Used to predict when you will run out."
        />
        <Input
          label="Pack size"
          type="number"
          min="0"
          value={values.quantity_per_refill}
          onChange={(event) => setValues({ ...values, quantity_per_refill: event.target.value })}
          hint="So a refill can be recorded in one tap."
        />
      </div>

      <Input
        label="Instructions"
        placeholder="After food"
        value={values.instructions}
        onChange={(event) => setValues({ ...values, instructions: event.target.value })}
        hint="Shown on every reminder."
      />

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-700">When to take it</h3>
        <div className="space-y-3">
          {schedules.map((schedule, index) => (
            <ScheduleRow
              key={index}
              schedule={schedule}
              index={index}
              onChange={updateSchedule}
              onRemove={(i) => setSchedules((current) => current.filter((_, j) => j !== i))}
              removable={schedules.length > 1}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => setSchedules((current) => [...current, newSchedule()])}
        >
          Add another dose time
        </Button>
      </div>

      <Button type="submit" size="lg" loading={create.submitting}>
        Add medicine
      </Button>
    </form>
  );
}
