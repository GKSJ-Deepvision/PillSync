import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Card, CardBody } from '../../../components/common/Card';
import { Button, Input, Badge, EmptyState, CardSkeleton } from '../../../components/common';
import { Search, Plus, Pill } from 'lucide-react';

const DISEASE_CATEGORIES = [
  'All',
  'Blood Pressure',
  'Diabetes',
  'Thyroid',
  'Antibiotics',
  'Vitamins',
  'Heart Medications',
];

export function MedicationsPage() {
  const navigate = useNavigate();

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisease, setSelectedDisease] = useState('All');

  useEffect(() => {
    let cancelled = false;

    const loadMedications = async () => {
      try {
        const data = await medicationApi.getMedications();

        if (!cancelled) {
          setMedications(data);
        }
      } catch (error) {
        console.error('Failed to fetch medications:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMedications();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMeds = medications.filter((med) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      med.name.toLowerCase().includes(query) ||
      med.disease.toLowerCase().includes(query);

    const matchesDisease = selectedDisease === 'All' || med.disease === selectedDisease;

    return matchesSearch && matchesDisease;
  });

  const getDiseaseColor = (disease) => {
    const colors = {
      'Blood Pressure': 'bg-red-100 text-red-800',
      Diabetes: 'bg-orange-100 text-orange-800',
      Thyroid: 'bg-blue-100 text-blue-800',
      Antibiotics: 'bg-purple-100 text-purple-800',
      Vitamins: 'bg-green-100 text-green-800',
      'Heart Medications': 'bg-pink-100 text-pink-800',
    };

    return colors[disease] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medications</h1>
          <p className="text-gray-600 mt-1">Manage your medications</p>
        </div>

        <Button onClick={() => navigate('/medications/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Medication
        </Button>
      </div>

      <div className="mb-6 space-y-4">
        <Input
          icon={Search}
          placeholder="Search medications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {DISEASE_CATEGORIES.map((disease) => (
            <button
              key={disease}
              onClick={() => setSelectedDisease(disease)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${
                  selectedDisease === disease
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }
              `}
            >
              {disease}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : filteredMeds.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No medications found"
          message={
            searchQuery
              ? 'Try adjusting your search criteria'
              : 'Add your first medication to get started'
          }
          action={
            !searchQuery && (
              <Button onClick={() => navigate('/medications/new')}>Add Medication</Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredMeds.map((medication) => (
            <Card
              key={medication.id}
              hoverable
              className="cursor-pointer"
              onClick={() => navigate(`/medications/${medication.id}`)}
            >
              <CardBody>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{medication.name}</h3>

                    <p className="text-gray-600 text-sm mt-1">{medication.dosage}</p>
                  </div>

                  <Badge variant="primary" className={getDiseaseColor(medication.disease)}>
                    {medication.disease}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-600">Frequency</p>

                    <p className="text-sm font-medium text-gray-900 mt-1">{medication.frequency}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600">Quantity</p>

                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {medication.quantity} units
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600">Schedule</p>

                    <div className="flex flex-wrap gap-2 mt-1">
                      {medication.schedule.map((time) => (
                        <span
                          key={time}
                          className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600">Status</p>

                    <Badge
                      variant={medication.status === 'active' ? 'success' : 'gray'}
                      size="sm"
                      className="mt-1"
                    >
                      {medication.status}
                    </Badge>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
