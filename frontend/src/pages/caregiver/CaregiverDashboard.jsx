import { useEffect, useState } from 'react';
import { ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import { getApiErrorMessage } from '../../services/api';
import { caregiverService } from '../../services/caregiverService';

const CaregiverDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    caregiverService.listPatients()
      .then((data) => {
        if (active) setPatients(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'Unable to load your patients.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="caregiver-dashboard-page">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Caregiver dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor patients assigned by an administrator.</p>
      </div>
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {loading ? <Loading text="Loading your patients..." /> : patients.length === 0 ? (
        <EmptyState
          title="No patients assigned"
          description="An administrator must assign patients before they appear here."
        />
      ) : (
        <Card title="My patients" subtitle={`${patients.length} active assignment${patients.length === 1 ? '' : 's'}`}>
          <div className="mt-4 space-y-3">
            {patients.slice(0, 3).map((relationship) => (
              <Link
                key={relationship.id}
                to={`/patients/${relationship.patient_id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 p-4 hover:border-brand-200 hover:bg-brand-50/40"
              >
                <span className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <Users className="h-5 w-5 text-brand-600" />
                  {relationship.patient_username}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
          <div className="mt-5 text-right border-t border-slate-100 pt-4">
            <Link to="/patients" className="text-xs font-bold text-brand-600 hover:text-brand-700">
              View all patients
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CaregiverDashboard;
