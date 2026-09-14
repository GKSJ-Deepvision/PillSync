import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { EmptyState, CardSkeleton } from '../../../components/common';
import { Search, Plus, Pill, Clock, ChevronRight, Users, ShieldCheck } from 'lucide-react';
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

const COHORT_PATIENT_FILTERS = ['All Patients', 'Ibrahim Kadri', 'Sarah Connor', 'Michael Chang'];

const COHORT_MEDICATIONS = [
  {
    id: 'cm1',
    name: 'Metformin',
    dosage: '500mg',
    disease: 'Diabetes',
    frequency: 'Twice daily',
    schedule: ['08:00 AM', '08:00 PM'],
    quantity: 14,
    status: 'active',
    patient: 'Ibrahim Kadri',
    patientAge: 54,
    patientAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    adherence: 96,
    prescribedBy: 'Dr. Oliver Mitchell',
  },
  {
    id: 'cm2',
    name: 'Lisinopril',
    dosage: '10mg',
    disease: 'Blood Pressure',
    frequency: 'Once daily',
    schedule: ['08:00 AM'],
    quantity: 22,
    status: 'active',
    patient: 'Ibrahim Kadri',
    patientAge: 54,
    patientAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    adherence: 94,
    prescribedBy: 'Dr. Oliver Mitchell',
  },
  {
    id: 'cm3',
    name: 'Lisinopril',
    dosage: '20mg',
    disease: 'Blood Pressure',
    frequency: 'Once daily',
    schedule: ['08:00 AM'],
    quantity: 8,
    status: 'active',
    patient: 'Sarah Connor',
    patientAge: 48,
    patientAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    adherence: 64,
    prescribedBy: 'Dr. Oliver Mitchell',
  },
  {
    id: 'cm4',
    name: 'Atorvastatin',
    dosage: '20mg',
    disease: 'Heart Medications',
    frequency: 'Once daily',
    schedule: ['08:30 PM'],
    quantity: 18,
    status: 'active',
    patient: 'Sarah Connor',
    patientAge: 48,
    patientAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    adherence: 70,
    prescribedBy: 'Dr. Oliver Mitchell',
  },
  {
    id: 'cm5',
    name: 'Levothyroxine',
    dosage: '50mcg',
    disease: 'Thyroid',
    frequency: 'Once daily',
    schedule: ['07:00 AM'],
    quantity: 4,
    status: 'active',
    patient: 'Michael Chang',
    patientAge: 62,
    patientAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    adherence: 82,
    prescribedBy: 'Dr. Oliver Mitchell',
  },
  {
    id: 'cm6',
    name: 'Vitamin D3',
    dosage: '2000 IU',
    disease: 'Vitamins',
    frequency: 'Once daily',
    schedule: ['01:00 PM'],
    quantity: 30,
    status: 'active',
    patient: 'Ibrahim Kadri',
    patientAge: 54,
    patientAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    adherence: 98,
    prescribedBy: 'Dr. Oliver Mitchell',
  },
];

export function MedicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisease, setSelectedDisease] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState('All Patients');

  const userRole = user?.role || 'patient';
  const isCaregiver = userRole === 'caregiver' || userRole === 'admin';

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

  const displayedList = isCaregiver ? COHORT_MEDICATIONS : medications;

  const filteredMeds = displayedList.filter((med) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      med.name.toLowerCase().includes(query) ||
      med.disease?.toLowerCase().includes(query) ||
      (med.patient && med.patient.toLowerCase().includes(query));

    const matchesDisease = selectedDisease === 'All' || med.disease === selectedDisease;
    const matchesPatient =
      !isCaregiver || selectedPatient === 'All Patients' || med.patient === selectedPatient;

    return matchesSearch && matchesDisease && matchesPatient;
  });

  return (
    <Layout>
      <div className="meds-page-container">
        {/* Header */}
        <div className="meds-header">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="primary" size="sm">
                {isCaregiver ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Caregiver Clinical Oversight
                  </>
                ) : (
                  'Prescription Records'
                )}
              </Badge>
              {isCaregiver && (
                <Badge variant="success" size="sm">
                  {COHORT_PATIENT_FILTERS.length - 1} Assigned Patients
                </Badge>
              )}
            </div>
            <h1 className="meds-title">
              {isCaregiver ? 'Medications Oversight' : 'Prescriptions & Medications'}
            </h1>
            <p className="meds-subtitle">
              {isCaregiver
                ? 'Supervise, adjust, and track active drug regimens and refill schedules across your assigned cohort'
                : 'Manage your verified clinical prescriptions, dose schedules, and supply levels'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/medications/new')}
            className="meds-add-btn"
          >
            <Plus className="h-4 w-4" />
            {isCaregiver ? 'Prescribe Medication' : 'Add Medication'}
          </button>
        </div>

        {/* Caregiver Patient Selector Chips */}
        {isCaregiver && (
          <div className="meds-cohort-bar">
            <span className="meds-cohort-label">
              <Users className="h-4 w-4 text-indigo-600" />
              Patient Roster:
            </span>
            <div className="meds-cohort-chips">
              {COHORT_PATIENT_FILTERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPatient(p)}
                  className={`meds-cohort-chip ${
                    selectedPatient === p ? 'meds-cohort-chip-active' : 'meds-cohort-chip-inactive'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="meds-filter-bar">
          <div className="meds-search-box">
            <div className="meds-search-wrapper">
              <Search className="meds-search-icon" />
              <input
                type="text"
                placeholder={
                  isCaregiver
                    ? 'Search by medicine, condition, or patient name...'
                    : 'Search prescription name or condition...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="meds-search-input"
              />
            </div>
          </div>

          <div className="meds-categories-scroll">
            {DISEASE_CATEGORIES.map((disease) => (
              <button
                key={disease}
                type="button"
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
        {loading && !isCaregiver ? (
          <CardSkeleton count={3} />
        ) : filteredMeds.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No medications found"
            message={
              searchQuery
                ? 'Try adjusting your search criteria or filter category'
                : 'Add a medication to get started'
            }
            action={
              !searchQuery && (
                <button
                  type="button"
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
              const stockPercent = Math.min(
                100,
                Math.round(((medication.quantity || 10) / 30) * 100)
              );
              const isLowStock = stockPercent <= 25;

              return (
                <div
                  key={medication.id}
                  onClick={() => navigate(`/medications/${medication.id}`)}
                  className="med-card cursor-pointer"
                >
                  <div>
                    {/* Patient identity bar for caregiver */}
                    {isCaregiver && medication.patient && (
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <img
                            src={medication.patientAvatar}
                            alt={medication.patient}
                            className="h-6 w-6 rounded-full object-cover border border-slate-200"
                          />
                          <span className="text-xs font-bold text-slate-900">
                            {medication.patient}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({medication.patientAge}y)
                          </span>
                        </div>
                        <Badge
                          variant={
                            medication.adherence >= 85
                              ? 'success'
                              : medication.adherence >= 70
                                ? 'warning'
                                : 'danger'
                          }
                          size="xs"
                        >
                          {medication.adherence}% Adherence
                        </Badge>
                      </div>
                    )}

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
                      {isCaregiver ? 'Clinical Review' : 'View Details'}{' '}
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
