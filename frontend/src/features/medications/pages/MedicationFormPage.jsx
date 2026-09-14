import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Alert } from '../../../components/common';
import { ArrowLeft, Save } from 'lucide-react';
import './MedicationFormPage.css';

export function MedicationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    disease: '',
    dosage: '',
    quantity: '',
    frequency: '',
    schedule: [],
    instructions: '',
    startDate: '',
    endDate: '',
    status: 'active',
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
          name: data.name || '',
          disease: data.disease || '',
          dosage: data.dosage || '',
          quantity: data.quantity || '',
          frequency: data.frequency || '',
          schedule: data.schedule || [],
          instructions: data.instructions || '',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          status: data.status || 'active',
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
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScheduleChange = (e) => {
    const values = e.target.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setFormData((prev) => ({
      ...prev,
      schedule: values,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Medication name is required');
      return false;
    }

    if (!formData.dosage.trim()) {
      setError('Dosage is required');
      return false;
    }

    if (!formData.frequency.trim()) {
      setError('Frequency is required');
      return false;
    }

    if (!formData.startDate) {
      setError('Start date is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setSaving(true);

      if (isEdit) {
        await medicationApi.updateMedication(id, formData);
      } else {
        await medicationApi.createMedication(formData);
      }

      navigate('/medications');
    } catch (err) {
      setError(isEdit ? 'Failed to update medication' : 'Failed to create medication');
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prescriptions
        </Link>

        <div className="med-form-card">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h1 className="text-xl font-black text-slate-900">
              {isEdit ? 'Edit Prescription Record' : 'Add New Prescription'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter clinical dosage, frequency, and supply instructions for automated tracking
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

            <div className="med-form-grid">
              <div className="med-form-full">
                <label className="med-form-label">Medication Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Metformin HCl"
                  required
                  className="med-form-input"
                />
              </div>

              <div>
                <label className="med-form-label">Disease / Condition</label>
                <input
                  type="text"
                  name="disease"
                  value={formData.disease}
                  onChange={handleChange}
                  placeholder="e.g. Diabetes, Blood Pressure"
                  className="med-form-input"
                />
              </div>

              <div>
                <label className="med-form-label">Dosage *</label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  placeholder="e.g. 500mg, 1 tablet"
                  required
                  className="med-form-input"
                />
              </div>

              <div>
                <label className="med-form-label">Quantity in Supply</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="e.g. 30"
                  className="med-form-input"
                />
              </div>

              <div>
                <label className="med-form-label">Frequency *</label>
                <input
                  type="text"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  placeholder="e.g. Twice Daily, Once Daily"
                  required
                  className="med-form-input"
                />
              </div>

              <div className="med-form-full">
                <label className="med-form-label">
                  Daily Dose Schedule (comma-separated 24h or 12h times)
                </label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule.join(', ')}
                  onChange={handleScheduleChange}
                  placeholder="e.g. 08:00 AM, 08:30 PM"
                  className="med-form-input"
                />
              </div>

              <div className="med-form-full">
                <label className="med-form-label">Instructions & Special Notes</label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows="3"
                  placeholder="e.g. Take immediately after meals with plenty of water."
                  className="med-form-input"
                />
              </div>

              <div>
                <label className="med-form-label">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="med-form-input"
                />
              </div>

              <div>
                <label className="med-form-label">End Date (Optional)</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="med-form-input"
                />
              </div>

              <div>
                <label className="med-form-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="med-form-input cursor-pointer"
                >
                  <option value="active">Active Regimen</option>
                  <option value="inactive">Paused / Inactive</option>
                </select>
              </div>
            </div>

            <div className="med-form-actions">
              <button
                type="button"
                onClick={() => navigate('/medications')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : isEdit ? 'Update Prescription' : 'Save Prescription'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
