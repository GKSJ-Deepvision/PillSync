import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Card, CardBody, CardHeader, CardFooter } from '../../../components/common/Card';
import { Button, Alert, Input } from '../../../components/common';
import { ArrowLeft } from 'lucide-react';

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

    if (!validateForm()) return;

    try {
      setSaving(true);
      setError('');

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
        type="button"
        onClick={() => navigate('/medications')}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Medications
      </button>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Medication' : 'Add Medication'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update medication details' : 'Add a new medication to your list'}
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardBody className="space-y-5">
            {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

            <Input
              label="Medication Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter medication name"
            />

            <Input
              label="Disease"
              name="disease"
              value={formData.disease}
              onChange={handleChange}
              placeholder="Enter disease"
            />

            <Input
              label="Dosage"
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              placeholder="Example: 500mg"
            />

            <Input
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Enter quantity"
            />

            <Input
              label="Frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              placeholder="Example: Twice daily"
            />

            <Input
              label="Schedule"
              name="schedule"
              value={formData.schedule.join(', ')}
              onChange={handleScheduleChange}
              placeholder="Example: 08:00, 20:00"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows="4"
                placeholder="Enter medication instructions"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
              />

              <Input
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </CardBody>

          <CardFooter>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/medications')}>
                Cancel
              </Button>

              <Button type="submit" loading={saving}>
                {isEdit ? 'Update Medication' : 'Add Medication'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </Layout>
  );
}
