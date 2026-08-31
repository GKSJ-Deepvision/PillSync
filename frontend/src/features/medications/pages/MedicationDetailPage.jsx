import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Card, CardBody, CardHeader, CardFooter } from '../../../components/common/Card';
import { Button, Alert, Badge } from '../../../components/common';
import { ArrowLeft, Trash2, Edit2 } from 'lucide-react';

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
    if (!window.confirm('Are you sure you want to delete this medication?')) {
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
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-primary-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!medication) {
    return (
      <Layout>
        <Alert type="danger" title="Not Found" message="Medication not found" />
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

      {error && (
        <Alert type="danger" message={error} onClose={() => setError('')} className="mb-6" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{medication.name}</h1>
                  <p className="text-gray-600 mt-2">{medication.disease}</p>
                </div>

                <Badge variant={medication.status === 'active' ? 'success' : 'gray'}>
                  {medication.status}
                </Badge>
              </div>
            </CardHeader>

            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Dosage Information</h3>

                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Dosage:</span> {medication.dosage}
                  </p>

                  <p className="text-gray-600">
                    <span className="font-medium">Quantity:</span> {medication.quantity} units
                  </p>

                  <p className="text-gray-600">
                    <span className="font-medium">Frequency:</span> {medication.frequency}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Schedule</h3>

                <div className="flex flex-wrap gap-2">
                  {medication.schedule.map((time) => (
                    <Badge key={time} variant="primary">
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Instructions</h3>

                <p className="text-gray-600">{medication.instructions}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h3>

                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Start Date:</span> {medication.startDate}
                  </p>

                  <p className="text-gray-600">
                    <span className="font-medium">End Date:</span> {medication.endDate || 'Ongoing'}
                  </p>
                </div>
              </div>
            </CardBody>

            <CardFooter>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/medications/${id}/edit`)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>

                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleting}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Quick Info</h3>
            </CardHeader>

            <CardBody className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Disease Category:</span>
                </p>

                <p className="text-sm font-medium text-blue-600 mt-1">{medication.disease}</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-900">
                  <span className="font-medium">Active Medication:</span>
                </p>

                <p className="text-sm font-medium text-green-600 mt-1">
                  {medication.status === 'active' ? 'Yes' : 'No'}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
