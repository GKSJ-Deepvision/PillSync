import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Card, CardBody, CardHeader, CardFooter } from '../../../components/common/Card';
import { Button, Input, Select, Alert } from '../../../components/common';
import { ArrowLeft } from 'lucide-react';

const DISEASE_OPTIONS = [
  { value: 'Blood Pressure', label: 'Blood Pressure' },
  { value: 'Diabetes', label: 'Diabetes' },
  { value: 'Thyroid', label: 'Thyroid' },
  { value: 'Antibiotics', label: 'Antibiotics' },
  { value: 'Vitamins', label: 'Vitamins' },
  { value: 'Heart Medications', label: 'Heart Medications' },
];

const FREQUENCY_OPTIONS = [
  { value: 'Once daily', label: 'Once daily' },
  { value: 'Twice daily', label: 'Twice daily' },
  { value: 'Three times daily', label: 'Three times daily' },
  { value: 'Every 4 hours', label: 'Every 4 hours' },
  { value: 'Every 6 hours', label: 'Every 6 hours' },
  { value: 'Every 8 hours', label: 'Every 8 hours' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'As needed', label: 'As needed' },
];

const SCHEDULE_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night'];

export function MedicationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    quantity: '',
    frequency: '',
    schedule: [],
    disease: '',
    instructions: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchMedication();
    }
  }, [id, isEdit]);

  const fetchMedication = async () => {
    try {
      setLoading(true);
      const data = await medicationApi.getMedicationById(id);
      setFormData(data);
    } catch (err) {
      setError('Failed to load medication');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.dosage) errors.dosage = 'Dosage is required';
    if (!formData.quantity) errors.quantity = 'Quantity is required';
    if (!formData.frequency) errors.frequency = 'Frequency is required';
    if (formData.schedule.length === 0) errors.schedule = 'Select at least one schedule';
    if (!formData.disease) errors.disease = 'Disease is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    setError('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await medicationApi.updateMedication(id, formData);
      } else {
        await medicationApi.createMedication(formData);
      }
      navigate('/medications');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medication');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleChange = (schedule) => {
    setFormData((prev) => {
      const newSchedule = prev.schedule.includes(schedule)
        ? prev.schedule.filter((s) => s !== schedule)
        : [...prev.schedule, schedule];
      return { ...prev, schedule: newSchedule };
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-primary-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <button
        onClick={() => navigate('/medications')}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Medications
      </button>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Medication' : 'Add New Medication'}
            </h1>
          </CardHeader>

          <CardBody>
            {error && (
              <Alert
                type="danger"
                message={error}
                onClose={() => setError('')}
                className="mb-6"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Medication Name"
                  placeholder="e.g., Aspirin"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  error={validationErrors.name}
                  required
                />

                <Input
                  label="Dosage"
                  placeholder="e.g., 100mg"
                  value={formData.dosage}
                  onChange={(e) =>
                    setFormData({ ...formData, dosage: e.target.value })
                  }
                  error={validationErrors.dosage}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  placeholder="e.g., 30"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  error={validationErrors.quantity}
                  required
                />

                <Select
                  label="Frequency"
                  options={FREQUENCY_OPTIONS}
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  error={validationErrors.frequency}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Schedule Times
                  <span className="text-danger-500 ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SCHEDULE_OPTIONS.map((schedule) => (
                    <label
                      key={schedule}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.schedule.includes(schedule)}
                        onChange={() => handleScheduleChange(schedule)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{schedule}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.schedule && (
                  <p className="text-sm text-danger-500 mt-1">
                    {validationErrors.schedule}
                  </p>
                )}
              </div>

              <Select
                label="Disease Category"
                options={DISEASE_OPTIONS}
                value={formData.disease}
                onChange={(e) =>
                  setFormData({ ...formData, disease: e.target.value })
                }
                error={validationErrors.disease}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  rows="4"
                  placeholder="e.g., Take with food"
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  error={validationErrors.startDate}
                  required
                />

                <Input
                  label="End Date (Optional)"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </form>
          </CardBody>

          <CardFooter>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/medications')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={saving}
              >
                {isEdit ? 'Update Medication' : 'Add Medication'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
