import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { EmptyState, CardSkeleton } from '../../../components/common';
import { Search, Plus, Pill, Clock, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import './MedicationsPage.css';

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

  return (
    <Layout>
      <div className="meds-page-container">
        {/* Header */}
        <div className="meds-header">
          <div>
            <h1 className="meds-title">Prescriptions & Medications</h1>
            <p className="meds-subtitle">
              Manage your verified clinical prescriptions, dose schedules, and supply levels
            </p>
          </div>

          <button
            onClick={() => navigate('/medications/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Medication
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="meds-filter-bar">
          <div className="meds-search-box">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search prescription name or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
              />
            </div>
          </div>

          <div className="meds-categories-scroll">
            {DISEASE_CATEGORIES.map((disease) => (
              <button
                key={disease}
                onClick={() => setSelectedDisease(disease)}
                className={`meds-category-chip ${
                  selectedDisease === disease ? 'meds-category-chip-active' : ''
                }`}
              >
                {disease}
              </button>
            ))}
          </div>
        </div>

        {/* Medication Grid */}
        {loading ? (
          <CardSkeleton count={3} />
        ) : filteredMeds.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No medications found"
            message={
              searchQuery
                ? 'Try adjusting your search criteria or filter category'
                : 'Add your first medication to get started'
            }
            action={
              !searchQuery && (
                <button
                  onClick={() => navigate('/medications/new')}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  Add Medication
                </button>
              )
            }
          />
        ) : (
          <div className="meds-grid">
            {filteredMeds.map((medication) => {
              const stockPercent = Math.min(100, Math.round(((medication.quantity || 10) / 30) * 100));
              const isLowStock = stockPercent <= 25;

              return (
                <div
                  key={medication.id}
                  onClick={() => navigate(`/medications/${medication.id}`)}
                  className="med-card cursor-pointer"
                >
                  <div>
                    <div className="med-card-header">
                      <div className="flex items-start gap-3">
                        <div className="med-icon-box">
                          <Pill className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="med-name">{medication.name}</h3>
                          <p className="med-dosage">{medication.dosage}</p>
                        </div>
                      </div>

                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                        {medication.disease}
                      </span>
                    </div>

                    <div className="med-schedule-tags">
                      <span className="med-tag">
                        <Clock className="h-3 w-3 text-indigo-500" />
                        {medication.frequency}
                      </span>
                      {medication.schedule?.map((time) => (
                        <span key={time} className="med-tag">
                          {time}
                        </span>
                      ))}
                    </div>

                    <div className="med-stock-bar-wrapper">
                      <div className="med-stock-label-row">
                        <span>Supply Remaining</span>
                        <span className={isLowStock ? 'text-rose-600 font-bold' : ''}>
                          {medication.quantity || 12} units
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
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ● {medication.status || 'active'}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                      View Details <ChevronRight className="h-3.5 w-3.5" />
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
