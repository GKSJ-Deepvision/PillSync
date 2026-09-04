import { useEffect, useState } from 'react';
import { CheckCircle, CircleSlash, Clock3, History } from 'lucide-react';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import Input from '../../components/Input';
import Loading from '../../components/Loading';
import { useAuth } from '../../context/AuthContext';
import { MOCK_PATIENTS } from '../../data/mockData';
import { patientService } from '../../services/patientService';

const statusStyles = {
  Taken: { icon: CheckCircle, classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  Missed: { icon: Clock3, classes: 'bg-red-50 text-red-700 border-red-100' },
  Skipped: { icon: CircleSlash, classes: 'bg-slate-50 text-slate-600 border-slate-200' }
};

const MedicationHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const patient = MOCK_PATIENTS.find(
    (patientRecord) => patientRecord.email.toLowerCase() === user?.email?.toLowerCase()
  ) || MOCK_PATIENTS[0];

  useEffect(() => {
    let active = true;

    const fetchHistory = async () => {
      setError('');
      try {
        const records = await patientService.fetchMedicationHistory(patient.id);
        if (active) setHistory(records);
      } catch {
        if (active) setError('Unable to load medication history. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      active = false;
    };
  }, [patient.id]);

  const filteredHistory = history.filter((record) => {
    const matchesSearch = record.medicationName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="medication-history-page">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Medication History</h1>
        <p className="text-xs text-slate-450 mt-0.5 font-medium">View your previous medication records and track your medication activity.</p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_12rem] gap-4 items-end">
          <Input
            label="Search medication"
            id="medication-history-search"
            placeholder="Search by medication name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="flex flex-col space-y-1.5 w-full">
            <label htmlFor="medication-history-status" className="text-xs font-semibold text-slate-600">Filter by status</label>
            <select
              id="medication-history-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            >
              <option>All</option>
              <option>Taken</option>
              <option>Missed</option>
              <option>Skipped</option>
            </select>
          </div>
        </div>
      </Card>

      {loading && <Loading text="Loading medication history..." />}
      {!loading && error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {!loading && !error && history.length === 0 && <EmptyState title="No medication history found." />}
      {!loading && !error && history.length > 0 && filteredHistory.length === 0 && <EmptyState title="No matching medication records found." />}
      {!loading && !error && filteredHistory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredHistory.map((record) => {
            const status = statusStyles[record.status] || statusStyles.Skipped;
            const StatusIcon = status.icon;
            return (
              <Card key={record.id} className="p-4" data-testid="medication-history-record">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-brand-50 text-brand-600 shrink-0"><History className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-slate-800 truncate">{record.medicationName}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{record.dosage}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${status.classes}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {record.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-slate-400 font-medium">Date</p><p className="text-slate-700 font-semibold mt-0.5">{record.date}</p></div>
                  <div><p className="text-slate-400 font-medium">Time</p><p className="text-slate-700 font-semibold mt-0.5">{record.time}</p></div>
                </div>
                <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500"><span className="font-semibold text-slate-600">Notes:</span> {record.notes}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MedicationHistory;