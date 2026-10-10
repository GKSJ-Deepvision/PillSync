import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Pill, RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import { getApiErrorMessage } from '../../services/api';
import { caregiverService } from '../../services/caregiverService';

const PatientDetails = () => {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDashboard(await caregiverService.getPatientDashboard(id));
    } catch (requestError) {
      setDashboard(null);
      setError(getApiErrorMessage(
        requestError,
        'This patient is unavailable or is no longer assigned to you.',
      ));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(loadDashboard, 0);
    return () => clearTimeout(timer);
  }, [loadDashboard]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="patient-details-page">
      <Link to="/patients" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to My Patients
      </Link>
      {loading && <Loading text="Loading patient dashboard..." />}
      {!loading && error && (
        <div className="space-y-3">
          <ErrorMessage message={error} />
          <button type="button" onClick={loadDashboard} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      )}
      {!loading && !error && dashboard && (
        <>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Patient monitoring</h1>
            <p className="text-sm text-slate-500 mt-1">Read-only information from the authorized caregiver dashboard.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card title="Adherence" className="border-l-4 border-l-brand-500">
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{dashboard.summary?.adherence_percentage ?? 0}%</p>
            </Card>
            <Card title="Active medicines" className="border-l-4 border-l-primary-500">
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{dashboard.summary?.active_medicines ?? 0}</p>
            </Card>
            <Card title="Low stock" className="border-l-4 border-l-caregiver-500">
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{dashboard.summary?.low_stock_medicines ?? 0}</p>
            </Card>
          </div>
          <Card title="Medication and refill information" subtitle="Active medicines reported by the patient dashboard service">
            {dashboard.active_medicines?.length ? (
              <div className="mt-4 space-y-3">
                {dashboard.active_medicines.map((medicine) => (
                  <div key={medicine.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 p-4">
                    <div className="flex gap-3">
                      <Pill className="mt-0.5 h-5 w-5 text-brand-600" />
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">{medicine.name}</h2>
                        <p className="text-xs text-slate-500">{medicine.dosage} · {medicine.quantity} remaining</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p className={medicine.is_low_stock ? 'font-bold text-amber-700' : 'font-semibold text-emerald-700'}>
                        {medicine.is_low_stock ? 'Low stock' : 'Stock available'}
                      </p>
                      {medicine.refill_prediction?.days_remaining != null && (
                        <p className="mt-1">{medicine.refill_prediction.days_remaining} days remaining</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No active medicines" description="This patient has no active medicines in the dashboard response." />
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default PatientDetails;
