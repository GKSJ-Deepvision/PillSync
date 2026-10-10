import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import { getApiErrorMessage } from '../../services/api';
import { caregiverService } from '../../services/caregiverService';

const MyPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await caregiverService.listPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load your patients.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadPatients, 0);
    return () => clearTimeout(timer);
  }, [loadPatients]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="my-patients-page">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">My Patients</h1>
        <p className="text-sm text-slate-500 mt-1">Patients currently assigned to you by an administrator.</p>
      </div>
      {error && (
        <div className="space-y-3">
          <ErrorMessage message={error} />
          <button type="button" onClick={loadPatients} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Try again
          </button>
        </div>
      )}
      {loading ? <Loading text="Loading patients..." /> : !error && patients.length === 0 ? (
        <EmptyState
          title="No patients assigned"
          description="Your patient list is empty. Contact an administrator if an assignment is missing."
        />
      ) : !loading && !error ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {patients.map((relationship) => (
            <Card key={relationship.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-brand-50 p-3 text-brand-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">{relationship.patient_username}</h2>
                    <p className="text-xs text-slate-500">Assignment #{relationship.id}</p>
                  </div>
                </div>
                <Link
                  to={`/patients/${relationship.patient_id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  View details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default MyPatients;
