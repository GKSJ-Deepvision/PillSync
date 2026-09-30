import { useCallback, useState } from 'react';

import { profilesApi } from '../api/profiles.js';
import Alert from '../components/common/Alert.jsx';
import Card from '../components/common/Card.jsx';
import Select from '../components/common/Select.jsx';
import Spinner from '../components/common/Spinner.jsx';
import ScanReview, { ScanDone } from '../features/ocr/ScanReview.jsx';
import ScanUploader from '../features/ocr/ScanUploader.jsx';
import { useApi } from '../hooks/useApi.js';

export default function ScanPage() {
  const fetchProfiles = useCallback(() => profilesApi.listPatients(), []);
  const profiles = useApi(fetchProfiles);
  const [patient, setPatient] = useState('');
  const [job, setJob] = useState(null);
  const [done, setDone] = useState(null);

  if (profiles.loading) return <Spinner label="Loading" className="p-6" />;

  // Only profiles the user manages can be scanned into; the API enforces it too.
  const managed = (profiles.data?.results ?? []).filter((p) => p.can_manage !== false);
  const patientId = patient || managed[0]?.id || '';

  function reset() {
    setJob(null);
    setDone(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Scan a prescription</h1>
        <p className="mt-1 text-sm text-slate-600">
          Photograph a prescription or a medicine label and PillSync will fill in the medicines and
          dose times for you to check.
        </p>
      </div>

      {profiles.error && <Alert tone="error">{profiles.error.message}</Alert>}

      {managed.length === 0 ? (
        <Alert tone="info">
          Scanning adds medicines to a patient profile, and this account does not manage one.
        </Alert>
      ) : done ? (
        <ScanDone result={done} onAnother={reset} />
      ) : job ? (
        <ScanReview job={job} onJobChange={setJob} onConfirmed={setDone} onDiscard={reset} />
      ) : (
        <Card>
          {managed.length > 1 && (
            <Select
              label="Who is this for?"
              value={patientId}
              onChange={(e) => setPatient(e.target.value)}
              options={managed.map((p) => ({ value: p.id, label: p.full_name }))}
              className="mb-4 max-w-xs"
            />
          )}
          <ScanUploader patientId={patientId} onResult={setJob} />
        </Card>
      )}
    </div>
  );
}
