import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { EmptyState, CardSkeleton } from '../../../components/common';
import { Search, Plus, Pill, ChevronRight, AlertTriangle } from 'lucide-react';
import './MedicationsPage.css';

const DISEASE_CATEGORIES = [
  { value: 'ALL', label: 'All' },
  { value: 'BLOOD_PRESSURE', label: 'Blood Pressure' },
  { value: 'DIABETES', label: 'Diabetes' },
  { value: 'THYROID', label: 'Thyroid' },
  { value: 'ANTIBIOTICS', label: 'Antibiotics' },
  { value: 'VITAMINS', label: 'Vitamins' },
  { value: 'HEART', label: 'Heart Medications' },
];

const getCategoryLabel = (value) =>
  DISEASE_CATEGORIES.find((category) => category.value === value)?.label || value;

export function MedicationsPage() {
  const navigate = useNavigate();

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisease, setSelectedDisease] = useState('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadMedications = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await medicationApi.getMedications();

        if (!cancelled) {
          setMedications(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load medicines.');
        }
        console.error('Failed to fetch medications:', err);
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

  const filteredMedications = medications.filter((medicine) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      medicine.medicine_name?.toLowerCase().includes(query) ||
      medicine.generic_name?.toLowerCase().includes(query) ||
      getCategoryLabel(medicine.disease_category).toLowerCase().includes(query);

    const matchesDisease =
      selectedDisease === 'ALL' || medicine.disease_category === selectedDisease;

    return matchesSearch && matchesDisease;
  });

  return (
    <Layout>
      <div className="meds-page-container">
        <div className="meds-header">
          <div>
            <div className="mb-1">
              <Badge variant="primary" size="sm">
                Medicine Management
              </Badge>
            </div>

            <h1 className="meds-title">My Medicines</h1>

            <p className="meds-subtitle">
              Manage your medicines, dosage information, stock quantity, and disease categories.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/medications/new')}
            className="meds-add-btn"
          >
            <Plus className="h-4 w-4" />
            Add Medicine
          </button>
        </div>

        <div className="meds-filter-bar">
          <div className="meds-search-box">
            <div className="meds-search-wrapper">
              <Search className="meds-search-icon" />

              <input
                type="text"
                placeholder="Search by medicine or disease..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="meds-search-input"
              />
            </div>
          </div>

          <div className="meds-categories-scroll">
            {DISEASE_CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setSelectedDisease(category.value)}
                className={`meds-category-chip ${
                  selectedDisease === category.value ? 'meds-category-chip-active' : ''
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {loading ? (
          <CardSkeleton count={3} />
        ) : filteredMedications.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No medicines found"
            message={
              searchQuery
                ? 'Try a different search term or disease category.'
                : 'Add your first medicine to get started.'
            }
            action={
              !searchQuery && (
                <button
                  type="button"
                  onClick={() => navigate('/medications/new')}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  Add Medicine
                </button>
              )
            }
          />
        ) : (
          <div className="meds-grid">
            {filteredMedications.map((medicine) => {
              const quantity = Number(medicine.quantity ?? 0);
              const stockPercent = Math.min(100, Math.round((quantity / 30) * 100));
              const isLowStock = quantity <= 7;

              return (
                <div
                  key={medicine.id}
                  onClick={() => navigate(`/medications/${medicine.id}`)}
                  className="med-card cursor-pointer"
                >
                  <div>
                    <div className="med-card-header">
                      <div className="flex items-start gap-3">
                        <div className="med-icon-box">
                          <Pill className="h-5 w-5" />
                        </div>

                        <div>
                          <h3 className="med-name">{medicine.medicine_name}</h3>

                          <p className="med-dosage">
                            {medicine.generic_name || 'Generic name not provided'}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                        {getCategoryLabel(medicine.disease_category)}
                      </span>
                    </div>

                    <div className="med-schedule-tags">
                      <span className="med-tag">Dosage: {medicine.dosage}</span>

                      <span className="med-tag">Form: {medicine.dosage_form}</span>
                    </div>

                    <div className="med-stock-bar-wrapper">
                      <div className="med-stock-label-row">
                        <span>Supply Remaining</span>

                        <span className={isLowStock ? 'text-rose-600 font-bold' : ''}>
                          {quantity} units
                        </span>
                      </div>

                      <div className="med-stock-track">
                        <div
                          className={`med-stock-fill ${
                            isLowStock ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${stockPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="med-card-footer">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        medicine.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      ● {medicine.is_active ? 'Active' : 'Inactive'}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                      View Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
