import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { medicationApi } from '../../../api/medications';
import { getCohortPatients } from '../../../utils/cohort';
import { getScopedStorageForUser } from '../../../utils/userStorage';
import { Layout } from '../../../components/layout';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  TrendingDown,
  PackageCheck,
  Plus,
  Pill,
  Users,
} from 'lucide-react';
import './RefillPage.css';

export function RefillPage() {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();
  const isCaregiver = userRole === 'caregiver';

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderedRefills, setOrderedRefills] = useState({});

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        if (isCaregiver) {
          const currentCohort = getCohortPatients(user);
          if (currentCohort.length === 0) {
            setMedications([]);
            setLoading(false);
            return;
          }
          const cohortMeds = [];
          currentCohort.forEach((pt) => {
            const ptMeds = getScopedStorageForUser(
              pt.email || pt.id,
              'pillsync_patient_medications',
              []
            );
            if (ptMeds && ptMeds.length > 0) {
              cohortMeds.push(...ptMeds.map((m) => ({ ...m, patientName: pt.name })));
            }
          });
          setMedications(cohortMeds);
          setLoading(false);
          return;
        }

        const data = await medicationApi.getMedications();
        setMedications(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeds();
  }, [user, isCaregiver]);

  const handleOrderRefill = (item) => {
    setOrderedRefills((prev) => ({ ...prev, [item.id]: true }));
  };

  const refillItems = medications.map((med, idx) => {
    const qty = med.quantity || 30;
    const total = 60;
    const progress = Math.min(100, Math.round(((total - qty) / total) * 100));
    const refillIn = Math.max(1, Math.round(qty / 2));
    const risk = qty <= 10 ? 'High' : qty <= 20 ? 'Medium' : 'Low';
    const status = orderedRefills[med.id || idx]
      ? 'Ordered'
      : risk === 'High'
        ? 'Urgent'
        : risk === 'Medium'
          ? 'Watch'
          : 'Healthy';

    return {
      id: med.id || idx,
      name: `${med.name} ${med.dosage || ''}`,
      remaining: qty,
      refillIn,
      risk,
      status,
      progress,
    };
  });

  const urgentCount = refillItems.filter((item) => item.risk === 'High').length;
  const avgDays =
    refillItems.length > 0
      ? Math.round(refillItems.reduce((sum, item) => sum + item.refillIn, 0) / refillItems.length)
      : 0;

  return (
    <Layout>
      <div className="refill-page">
        <div className="refill-header">
          <div>
            <div className="refill-eyebrow">
              <CalendarClock className="h-4 w-4" />
              Refill Intelligence
            </div>
            <h1>Medication Refill Prediction</h1>
            <p>AI-assisted prediction of refill timing, supply risks, and prescribing follow-up.</p>
          </div>
        </div>

        <div className="refill-kpis">
          <div className="refill-kpi-card">
            <span>Total tracked prescriptions</span>
            <strong>{refillItems.length}</strong>
            <small>Active in your supply</small>
          </div>
          <div className="refill-kpi-card warning">
            <span>Urgent follow-up</span>
            <strong>{urgentCount}</strong>
            <small>High-risk refill window</small>
          </div>
          <div className="refill-kpi-card success">
            <span>Average refill window</span>
            <strong>{avgDays} days</strong>
            <small>Before supply depletion</small>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 font-medium">
            Analyzing supply telemetry and predicting refill timelines...
          </div>
        ) : refillItems.length > 0 ? (
          <div className="refill-list">
            {refillItems.map((item) => (
              <div key={item.id} className="refill-card">
                <div className="refill-card-top">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.remaining} doses remaining in supply</p>
                  </div>
                  <span className={`risk-badge risk-${item.risk.toLowerCase()}`}>{item.risk}</span>
                </div>

                <div className="refill-progress-wrap">
                  <div className="refill-progress-row">
                    <span>Supply utilization</span>
                    <strong>{item.progress}%</strong>
                  </div>
                  <div className="refill-track">
                    <div className="refill-fill" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>

                <div className="refill-footer">
                  <div className="status-pill">
                    {item.status === 'Ordered' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : item.status === 'Urgent' ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {item.status}
                  </div>
                  <div className="refill-days">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Refill in {item.refillIn} days
                  </div>
                </div>

                <div className="refill-actions">
                  <button
                    type="button"
                    onClick={() => handleOrderRefill(item)}
                    className="primary-btn cursor-pointer"
                  >
                    <PackageCheck className="h-3.5 w-3.5" />
                    {orderedRefills[item.id] ? 'Refill Requested' : 'Order refill'}
                  </button>
                  <Link
                    to="/medications"
                    className="secondary-btn cursor-pointer inline-flex items-center justify-center text-decoration-none"
                  >
                    View prescription
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : isCaregiver ? (
          <div className="py-12 text-center rounded-2xl border border-slate-200 bg-white p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              No cohort prescriptions tracked for refill
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Assign patients to your care cohort in the Patients Portal to track their medication
              supplies and refill forecasts.
            </p>
            <Link
              to="/patients"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Users className="h-4 w-4" />
              Assign Patients
            </Link>
          </div>
        ) : (
          <div className="py-12 text-center rounded-2xl border border-slate-200 bg-white p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <Pill className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              No prescriptions tracked for refill
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your current medications to activate intelligent refill forecasting and supply
              alerts.
            </p>
            <Link
              to="/medications/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              Add Prescription
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
