import { useCallback, useState } from 'react';

import ocrApi from '../../api/ocr.js';
import Alert from '../../components/common/Alert.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { useMutation } from '../../hooks/useApi.js';

export const SLOTS = [
  { value: 'MORNING', label: 'Morning' },
  { value: 'AFTERNOON', label: 'Afternoon' },
  { value: 'EVENING', label: 'Evening' },
  { value: 'NIGHT', label: 'Night' },
];

const BAND = {
  HIGH: { tone: 'success', text: 'Looks right' },
  MEDIUM: { tone: 'warning', text: 'Please check' },
  LOW: { tone: 'danger', text: 'Check carefully' },
};

const REPEAT = {
  DAILY: null,
  INTERVAL: (item) => `every ${item.interval_days} days`,
  SPECIFIC_DAYS: () => 'on certain days only',
};

/** Slots as {slot: quantity} for editing, and back. */
export const slotsToMap = (slots = []) =>
  Object.fromEntries(slots.map((s) => [s.slot, s.quantity]));
export const mapToSlots = (map) =>
  SLOTS.filter(({ value }) => map[value] !== undefined && map[value] !== '').map(({ value }) => ({
    slot: value,
    quantity: String(map[value]),
  }));

/**
 * One extracted medicine, editable, with the catalogue match made visible.
 *
 * The match is the part a patient must not miss: a confident one is applied and
 * says so; a doubtful one is offered as a button and NOT applied, because picking
 * the wrong catalogue entry quietly attaches the wrong strength and category.
 */
export default function ItemEditor({ item, onSaved, onDirtyChange }) {
  const [draft, setDraft] = useState(() => ({
    name: item.name,
    strength: item.strength || '',
    form: item.form || '',
    duration_days: item.duration_days ?? '',
    total_quantity: item.total_quantity ?? '',
    instructions: item.instructions || '',
    slots: slotsToMap(item.slots),
  }));
  const [dirty, setDirty] = useState(false);

  const save = useMutation(
    useCallback((payload) => ocrApi.updateItem(item.id, payload), [item.id])
  );

  function change(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
    if (!dirty) {
      setDirty(true);
      onDirtyChange?.(item.id, true);
    }
  }

  function toggleSlot(slot) {
    const next = { ...draft.slots };
    if (next[slot] === undefined) next[slot] = '1';
    else delete next[slot];
    change('slots', next);
  }

  async function submit(extra = {}) {
    const payload = {
      name: draft.name,
      strength: draft.strength,
      form: draft.form,
      instructions: draft.instructions,
      duration_days: draft.duration_days === '' ? null : Number(draft.duration_days),
      total_quantity: draft.total_quantity === '' ? null : draft.total_quantity,
      slots: mapToSlots(draft.slots),
      ...extra,
    };
    const result = await save.submit(payload);
    if (result.ok) {
      setDirty(false);
      onDirtyChange?.(item.id, false);
      onSaved(result.data);
    }
  }

  const band = BAND[item.confidence_band] ?? BAND.MEDIUM;
  const applied = item.reference && item.match_level === 'AUTO';
  const repeat = REPEAT[item.frequency]?.(item);

  return (
    <li className="space-y-4 rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={band.tone}>{band.text}</Badge>
        {applied && <Badge tone="brand">Matched: {item.reference_label}</Badge>}
        {item.as_needed && <Badge tone="neutral">Only when needed — no reminders</Badge>}
        {repeat && <Badge tone="neutral">Repeats {repeat}</Badge>}
      </div>

      {item.reasons?.length > 0 && (
        <Alert tone="warning">
          <ul className="list-inside list-disc">
            {item.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </Alert>
      )}

      {!applied && item.suggestions?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            We are not sure which product this is. Pick the right one, or leave it as typed:
          </p>
          <div className="flex flex-wrap gap-2">
            {item.suggestions.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="secondary"
                size="sm"
                onClick={() => submit({ reference: suggestion.id })}
              >
                {suggestion.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {item.raw_line && (
        <p className="rounded bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
          Read as: {item.raw_line}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="Medicine"
          value={draft.name}
          onChange={(e) => change('name', e.target.value)}
          className="sm:col-span-2"
        />
        <Input
          label="Strength"
          value={draft.strength}
          onChange={(e) => change('strength', e.target.value)}
        />
        <Input label="Form" value={draft.form} onChange={(e) => change('form', e.target.value)} />
        <Input
          label="Course (days)"
          type="number"
          min="1"
          value={draft.duration_days}
          onChange={(e) => change('duration_days', e.target.value)}
        />
        <Input
          label="Units you have"
          type="number"
          min="0"
          step="any"
          value={draft.total_quantity}
          onChange={(e) => change('total_quantity', e.target.value)}
          hint="Tablets in hand — needed for refill alerts"
        />
      </div>

      {!item.as_needed && (
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-slate-700">When to take it</legend>
          <div className="flex flex-wrap gap-4">
            {SLOTS.map(({ value, label }) => {
              const on = draft.slots[value] !== undefined;
              return (
                <div key={value} className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={on} onChange={() => toggleSlot(value)} />
                    {label}
                  </label>
                  {on && (
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      aria-label={`${label} dose quantity`}
                      value={draft.slots[value]}
                      onChange={(e) => change('slots', { ...draft.slots, [value]: e.target.value })}
                      className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      {save.error && <Alert tone="error">{save.error.message}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => submit()} loading={save.submitting} disabled={!dirty}>
          {dirty ? 'Save changes' : 'Saved'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => submit({ status: 'REJECTED' })}>
          This is not a medicine — remove
        </Button>
      </div>
    </li>
  );
}
