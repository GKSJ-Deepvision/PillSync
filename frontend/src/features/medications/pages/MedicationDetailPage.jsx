import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Alert } from '../../../components/common/Alert';
import { ArrowLeft, Trash2, Edit2, Pill } from 'lucide-react';
import './MedicationDetailPage.css';

const DISEASE_LABELS = {
  BLOOD_PRESSURE: 'Blood Pressure',
  DIABETES: 'Diabetes',
  THYROID: 'Thyroid',
  ANTIBIOTICS: 'Antibiotics',
  VITAMINS: 'Vitamins',
  HEART: 'Heart Medications',
};

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
        setLoading(true);
        setError('');

        const data = await medicationApi.getMedicationById(id);

        if (active) {
          setMedication(data);
        }
      } catch (err) {
        if (active) {
          setError('Failed to load medication details.');
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
    if (!window.confirm('Are you sure you want to delete this medicine?')) {
      return;
    }

    try {
      setDeleting(true);
      await medicationApi.deleteMedication(id);
      navigate('/medications');
    } catch (err) {
      setError('Failed to delete medication.');
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
        <div className="med-detail-container">
          <Alert
            type="danger"
            title="Not Found"
            message={error || 'Medicine record could not be found.'}
          />
        </div>
      </Layout>
    );
  }

  const diseaseLabel =
    DISEASE_LABELS[medication.disease_category] ||
    medication.disease_category;

  return (
    <Layout>
      <div className="med-detail-container">
        <Link
          to="/medications"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Medications
        </Link>

        {error && (
          <Alert
            type="danger"
            message={error}
            onClose={() => setError('')}
          />
        )}

        <div className="med-detail-header-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Pill className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  {medication.medicine_name}
                </h1>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    medication.is_active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  ● {medication.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {medication.generic_name || 'Generic name not provided'} ·{' '}
                {diseaseLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/medications/${id}/edit`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Medicine
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 shadow-2xs transition hover:bg-rose-100 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="med-detail-info-grid">
          <div className="flex flex-col gap-5">
            <div className="med-detail-card">
              <h2 className="med-detail-section-title">
                Medicine Information
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Medicine Name
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {medication.medicine_name}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Generic Name
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {medication.generic_name || 'Not provided'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Dosage
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {medication.dosage}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Dosage Form
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {medication.dosage_form}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Disease Category
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {diseaseLabel}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Supply Remaining
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {medication.quantity} units
                  </p>
                </div>
              </div>
            </div>

            <div className="med-detail-card">
              <h2 className="med-detail-section-title">
                Medicine Status
              </h2>

              <div className="text-sm text-slate-700">
                This medicine is currently{' '}
                <strong>
                  {medication.is_active ? 'active' : 'inactive'}
                </strong>
                .
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="med-detail-card">
              <h3 className="med-detail-section-title">
                Medicine Summary
              </h3>

              <div className="flex flex-col gap-3.5 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Disease</span>
                  <span className="font-bold text-slate-900">
                    {diseaseLabel}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Dosage</span>
                  <span className="font-bold text-slate-900">
                    {medication.dosage}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Form</span>
                  <span className="font-bold text-slate-900">
                    {medication.dosage_form}
                  </span>
                </div>

                <div className="flex justify-between pb-1">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-bold text-slate-900">
                    {medication.quantity} units
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}