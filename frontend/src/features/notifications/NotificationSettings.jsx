import { useCallback, useState } from 'react';

import notificationsApi from '../../api/notifications.js';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Input from '../../components/common/Input.jsx';
import { useMutation } from '../../hooks/useApi.js';

const CHANNELS = [
  ['push_enabled', 'Push notifications', 'Sent to this browser and any registered device.'],
  ['email_enabled', 'Email', 'A fallback when push is unavailable.'],
  ['sms_enabled', 'SMS', 'Needs a phone number on your account. Charges may apply.'],
];

const CATEGORIES = [
  ['dose_reminders', 'Medicine reminders', 'When a dose is due.'],
  ['missed_dose_alerts', 'Missed doses', 'When a dose goes unrecorded.'],
  ['caregiver_alerts', 'Caregiver alerts', 'About the patients you care for.'],
  ['refill_alerts', 'Refills and stock', 'Low stock and expiring prescriptions.'],
];

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-2 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="block text-sm text-slate-500">{description}</span>
      </span>
    </label>
  );
}

/**
 * Delivery settings. Mount with `key={preferences.id}` so the form seeds from
 * the fetched values without an effect writing them into state.
 */
export default function NotificationSettings({ preferences }) {
  const [values, setValues] = useState(preferences);
  const [saved, setSaved] = useState(false);

  const save = useMutation(
    useCallback((payload) => notificationsApi.updatePreferences(payload), [])
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSaved(false);

    const result = await save.submit({
      ...values,
      quiet_hours_start: values.quiet_hours_start || null,
      quiet_hours_end: values.quiet_hours_end || null,
    });
    if (result.ok) setSaved(true);
  }

  const set = (patch) => setValues((current) => ({ ...current, ...patch }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saved && <Alert tone="success">Your notification settings were saved.</Alert>}
      {save.error && <Alert tone="error">{save.error.message}</Alert>}

      <Card title="How to reach you">
        <div className="space-y-1">
          {CHANNELS.map(([key, label, description]) => (
            <Toggle
              key={key}
              checked={values[key]}
              onChange={(checked) => set({ [key]: checked })}
              label={label}
              description={description}
            />
          ))}
        </div>
      </Card>

      <Card title="What to tell you about">
        <div className="space-y-1">
          {CATEGORIES.map(([key, label, description]) => (
            <Toggle
              key={key}
              checked={values[key]}
              onChange={(checked) => set({ [key]: checked })}
              label={label}
              description={description}
            />
          ))}
        </div>
      </Card>

      <Card title="Quiet hours" subtitle="Holds back low-stock and refill notices overnight">
        <Alert tone="info" className="mb-4">
          Medicine reminders and missed-dose alerts are never held back. A dose you scheduled for
          06:00 or 22:30 still reminds you — those are the ones people forget.
        </Alert>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="From"
            type="time"
            value={values.quiet_hours_start ?? ''}
            onChange={(event) => set({ quiet_hours_start: event.target.value })}
            error={save.error?.details?.quiet_hours_start?.[0]}
          />
          <Input
            label="Until"
            type="time"
            value={values.quiet_hours_end ?? ''}
            onChange={(event) => set({ quiet_hours_end: event.target.value })}
            error={save.error?.details?.quiet_hours_end?.[0]}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => set({ quiet_hours_start: '', quiet_hours_end: '' })}
        >
          Clear quiet hours
        </Button>
      </Card>

      <Button type="submit" size="lg" loading={save.submitting}>
        Save settings
      </Button>
    </form>
  );
}
