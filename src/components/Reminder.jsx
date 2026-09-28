import React, { useState } from 'react';
import { TODAY_MEDICATIONS } from '../data/mockData';

const Reminder = () => {
  const [enabled, setEnabled] = useState(true);
  const scheduledMedications = TODAY_MEDICATIONS.filter(
  (medication) => medication.status === 'upcoming'
);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Medication Reminders
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Manage your medication reminder settings
            </p>
          </div>

          {/* Toggle */}
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Reminder content */}
      <div className="p-6">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-emerald-50">
            <span className="text-xl">🔔</span>
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-800">
              Daily Medication Reminder
            </h3>

            <p className="text-sm text-slate-500 mt-1">
  {enabled
    ? scheduledMedications.length > 0
      ? `You will receive reminders for ${scheduledMedications.length} medication${
          scheduledMedications.length > 1 ? 's' : ''
        } scheduled today.`
      : 'No medications are scheduled for today.'
    : 'Medication reminders are currently turned off.'}
</p>
          </div>

          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${
              enabled
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Reminder;