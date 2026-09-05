import MedicineCatalogue from '../features/medications/MedicineCatalogue.jsx';

export default function MedicinesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Medicine catalogue</h1>
        <p className="mt-1 text-sm text-slate-600">
          Seeded from the FDA National Drug Code Directory and grouped by the conditions PillSync
          tracks.
        </p>
      </div>

      <MedicineCatalogue />
    </div>
  );
}
