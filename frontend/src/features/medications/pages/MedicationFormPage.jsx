import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Alert } from '../../../components/common';
import { ArrowLeft, Save } from 'lucide-react';
import './MedicationFormPage.css';

const DISEASE_CATEGORIES = [
  { value: 'BLOOD_PRESSURE', label: 'Blood Pressure' },
  { value: 'DIABETES', label: 'Diabetes' },
  { value: 'THYROID', label: 'Thyroid' },
  { value: 'ANTIBIOTICS', label: 'Antibiotics' },
  { value: 'VITAMINS', label: 'Vitamins' },
  { value: 'HEART', label: 'Heart Medications' },
];

export function MedicationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    medicine_name: '',
    generic_name: '',
    dosage: '',
    dosage_form: '',
    quantity: '',
    disease_category: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;

    const loadMedication = async () => {
      try {
        setLoading(true);

        const data = await medicationApi.getMedicationById(id);

        setFormData({
          medicine_name: data.medicine_name || '',
          generic_name: data.generic_name || '',
          dosage: data.dosage || '',
          dosage_form: data.dosage_form || '',
          quantity: data.quantity ?? '',
          disease_category: data.disease_category || '',
          is_active: data.is_active ?? true,
        });
      } catch (err) {
        setError('Failed to load medication');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMedication();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.medicine_name.trim()) {
      setError('Medicine name is required');
      return false;
    }

    if (!formData.dosage.trim()) {
      setError('Dosage is required');
      return false;
    }

    if (!formData.dosage_form.trim()) {
      setError('Dosage form is required');
      return false;
    }

    if (!formData.quantity || Number(formData.quantity) < 0) {
      setError('Quantity cannot be negative');
      return false;
    }

    if (!formData.disease_category) {
      setError('Disease category is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    const payload = {
      medicine_name: formData.medicine_name.trim(),
      generic_name: formData.generic_name.trim(),
      dosage: formData.dosage,
      dosage_form: formData.dosage_form.trim(),
      quantity: Number(formData.quantity),
      disease_category: formData.disease_category,
      is_active: formData.is_active,
    };

    try {
      setSaving(true);

      if (isEdit) {
        await medicationApi.updateMedication(id, payload);
      } else {
        await medicationApi.createMedication(payload);
      }

      navigate('/medications');
    } catch (err) {
      const backendErrors = err.response?.data;

      if (backendErrors?.detail) {
        setError(backendErrors.detail);
      } else if (backendErrors) {
        const firstError = Object.values(backendErrors).flat()[0];
        setError(firstError || 'Failed to save medication');
      } else {
        setError(
          isEdit
            ? 'Failed to update medication'
            : 'Failed to create medication'
        );
      }

      console.error(err);
    } finally {
      setSaving(false);
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

  return (
    <Layout>
      <div className="med-form-container">
        <Link
          to="/medications"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Medications
        </Link>

        <div className="med-form-card">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h1 className="text-xl font-black text-slate-900">
              {isEdit ? 'Edit Medication' : 'Add New Medication'}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Enter the medicine details and supply information.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert
                type="danger"
                message={error}
                onClose={() => setError('')}
              />
            )}

            <div className="med-form-grid">
              <div className="med-form-full">
                <label className="med-form-label">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  name="medicine_name"
                  value={formData.medicine_name}
                  onChange={handleChange}
                  placeholder="e.g. Amlodipine"
                  required
                  className="med-form-input"
                />
              </div>

              <div>
                <label className="med-form-label">
                  Generic Name
                </label>
                <input
                  type="text"
                  name="generic_name"
                  value={formData.generic_name}
                  onChange={handleChange}
                  placeholder="e.g. Amlodipine"
                  className="med-form-input"
                />
              </div>

              <div>
                <label className="med-form-label">
                  Dosage *
                </label>
                <input
                  type="number"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 5.00"
                  required
                  className="med-form-input"
                />
              </div>

              <div>
                <label className="med-form-label">
                  Dosage Form *
                </label>
                <input
                  type="text"
                  name="dosage_form"
                  value={formData.dosage_form}
                  onChange={handleChange}
                  placeholder="e.g. Tablet"
                  required
                  className="med-form-input"
                />
              </div>

              <div>
                <label className="med-form-label">
                  Quantity in Supply *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="e.g. 30"
                  required
                  className="med-form-input"
                />
              </div>

              <div className="med-form-full">
                <label className="med-form-label">
                  Disease / Condition *
                </label>
                <select
                  name="disease_category"
                  value={formData.disease_category}
                  onChange={handleChange}
                  required
                  className="med-form-input cursor-pointer"
                >
                  <option value="">Select a category</option>

                  {DISEASE_CATEGORIES.map((category) => (
                    <option
                      key={category.value}
                      value={category.value}
                    >
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="med-form-full">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 rounded"
                  />
                  Active medication
                </label>
              </div>
            </div>

            <div className="med-form-actions">
              <button
                type="button"
                onClick={() => navigate('/medications')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving
                  ? 'Saving...'
                  : isEdit
                    ? 'Update Medication'
                    : 'Save Medication'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}