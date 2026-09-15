import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { patientService } from '../../services/patientService';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    patientService.fetchSchedule()
      .then(setSchedule)
      .catch((err) => setError(err.response?.data?.detail || err.message || 'Unable to load schedule.'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status, minutes) => {
    try {
      const updated = await patientService.updateScheduleStatus(id, status, minutes);
      setSchedule((current) => current.map((entry) => entry.id === id ? updated : entry));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to update dose status.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="schedule-page">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Medication Schedule</h1>
        <p className="text-xs text-slate-455 mt-0.5 font-medium">Calendar tracking compliance timelines.</p>
      </div>

      {loading ? <Loading text="Loading today&apos;s schedule..." /> : error ? <ErrorMessage message={error} /> : (
        <Card title="Today&apos;s doses" subtitle="Mark each dose as taken, missed, or snoozed">
          <div className="divide-y divide-slate-100 mt-3">
            {schedule.map((entry) => (
              <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 first:pt-0">
                <div className="flex gap-3 items-center">
                  {entry.status === 'Taken' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : entry.status === 'Missed' ? <XCircle className="h-5 w-5 text-red-600" /> : <Clock className="h-5 w-5 text-slate-400" />}
                  <div><h2 className="text-sm font-bold text-slate-800">{entry.name} · {entry.dosage}</h2><p className="text-xs text-slate-500 mt-1">{entry.time} · {entry.status}{entry.snoozed_until ? ` until ${new Date(entry.snoozed_until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</p></div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="!py-1.5 !px-2.5 text-xs" onClick={() => updateStatus(entry.id, 'Taken')} disabled={entry.status === 'Taken'}>Taken</Button>
                  <Button variant="secondary" className="!py-1.5 !px-2.5 text-xs text-red-600" onClick={() => updateStatus(entry.id, 'Missed')} disabled={entry.status === 'Missed'}>Missed</Button>
                  <Button variant="secondary" className="!py-1.5 !px-2.5 text-xs text-amber-700" onClick={() => updateStatus(entry.id, 'Snoozed', 30)} disabled={entry.status === 'Snoozed'}>Snooze 30m</Button>
                </div>
              </div>
            ))}
            {!schedule.length && <p className="text-sm text-slate-500 py-4">No doses are scheduled yet.</p>}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Schedule;
