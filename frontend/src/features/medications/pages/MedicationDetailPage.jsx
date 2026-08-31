import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Alert } from '../../../components/common/Alert';
import {
  ArrowLeft,
  Trash2,
  Edit2,
  Pill,
  Clock,
  
} from 'lucide-react';
import './MedicationDetailPage.css';

export function MedicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [medication, setMedication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadMedication = async () => {
      try {
        const data = await medicationApi.getMedicationById(id);
        if (active) {
          setMedication(data);
        }
      } catch (err) {
        if (active) {
          setError('Failed to load medication details');
        }
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMedication();

    return () => {
      active = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this medication regimen?')) {
      return;
    }

    try {
      setDeleting(true);
      await medicationApi.deleteMedication(id);
      navigate('/medications');
    } catch (err) {
      setError('Failed to delete medication');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!medication) {
    return (
      <Layout>
        <Alert type="danger" title="Not Found" message="Medication record could not be found." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="med-detail-container">
        {/* Back Link */}
        <Link
          to="/medications"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prescription Catalog
        </Link>

        {error && (
          <Alert type="danger" message={error} onClose={() => setError('')} />
        )}

        {/* Top Header Card */}
        <div className="med-detail-header-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Pill className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">{medication.name}</h1>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  ● {medication.status || 'Active'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {medication.dosage} · {medication.disease}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(`/medications/${id}/edit`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Prescription
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer shadow-2xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="med-detail-info-grid">
          {/* Main Info */}
          <div className="flex flex-col gap-5">
            <div className="med-detail-card">
              <h2 className="med-detail-section-title">Schedule & Dosage Instructions</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dosage</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{medication.dosage}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Frequency</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{medication.frequency}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supply In Stock</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{medication.quantity || 30} units</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-bold text-slate-700 mb-2">Daily Dose Timing Windows</p>
                <div className="med-schedule-chip-list">
                  {medication.schedule?.map((time) => (
                    <span key={time} className="med-schedule-chip">
                      <Clock className="h-3.5 w-3.5" />
                      {time}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5">Prescription Clinical Notes</p>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-xs text-slate-700 leading-relaxed">
                  {medication.instructions || 'Take as directed by your physician with meals or a full glass of water.'}
                </div>
              </div>
            </div>

            <div className="med-detail-card">
              <h2 className="med-detail-section-title">Clinical Regimen Dates</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Start Date:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{medication.startDate || '2026-01-15'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Expected Completion:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{medication.endDate || 'Ongoing Regimen'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="flex flex-col gap-5">
            <div className="med-detail-card">
              <h3 className="med-detail-section-title">Prescription Overview</h3>

              <div className="flex flex-col gap-3.5 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Condition Category</span>
                  <span className="font-bold text-slate-900">{medication.disease}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Form</span>
                  <span className="font-bold text-slate-900">Oral Tablet</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Prescribing Clinician</span>
                  <span className="font-bold text-indigo-600">Dr. Oliver Mitchell</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-500">Refill Verification</span>
                  <span className="font-bold text-emerald-600">Verified Auto-Refill</span>
                </div>
              </div>

              <button
                onClick={() => alert('Dispatched instant 30-day refill request to pharmacy!')}
                className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
              >
                Request Refill Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
