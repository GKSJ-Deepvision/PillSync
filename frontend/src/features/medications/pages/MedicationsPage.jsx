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

import { getCohortPatients, getCohortPatientNames } from '../../../utils/cohort';

export function MedicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisease, setSelectedDisease] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState('All Patients');

  const userRole = (user?.role || 'patient').toLowerCase();
  const isCaregiver = userRole === 'caregiver' || userRole === 'admin';
  const [cohortPatientFilters, setCohortPatientFilters] = useState(() =>
    getCohortPatientNames(user)
  );

  useEffect(() => {
    setCohortPatientFilters(getCohortPatientNames(user));
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const loadMedications = async () => {
      try {
        if (userRole === 'caregiver') {
          const cohort = getCohortPatients(user);
          const allCohortMeds = [];
          cohort.forEach((p) => {
            const pKey = p.email
              ? p.email
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, '_')
              : '';
            let pMeds = [];
            try {
              const raw = localStorage.getItem(`pillsync_patient_medications_${pKey}`);
              if (raw) pMeds = JSON.parse(raw);
            } catch {}

            if (!Array.isArray(pMeds)) {
              pMeds = [];
            }

            pMeds.forEach((m) => {
              allCohortMeds.push({
                ...m,
                patient: p.name,
                patientEmail: p.email,
              });
            });
          });

          if (!cancelled) {
            setMedications(allCohortMeds);
          }
          return;
        }

        const data = await medicationApi.getMedications();
        if (!cancelled) {
          setMedications(data || []);
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
  }, [user, userRole]);

  const displayedList = medications;

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
                  {cohortPatientFilters.length - 1} Assigned Patients
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
        {isCaregiver && cohortPatientFilters.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4">
            <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1 mr-1">
              <Users className="h-3.5 w-3.5 text-indigo-600" /> Filter Patient:
            </span>
            {cohortPatientFilters.map((pName) => (
              <button
                key={pName}
                type="button"
                onClick={() => setSelectedPatient(pName)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                  selectedPatient === pName
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pName}
              </button>
            ))}
          </div>
        )}

        {/* Toolbar: Search & Category Chips */}
        <div className="meds-toolbar">
          <div className="meds-search-box">
            <Search className="meds-search-icon" />
            <input
              type="text"
              placeholder="Search by drug name or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="meds-search-input"
            />
          </div>

          <div className="meds-categories">
            {DISEASE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`meds-chip ${selectedDisease === cat ? 'active' : ''}`}
                onClick={() => setSelectedDisease(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="meds-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredMeds.length === 0 ? (
          <EmptyState
            title="No medications found"
            description={
              searchQuery || selectedDisease !== 'All'
                ? 'Try adjusting your search query or filters to find what you need.'
                : isCaregiver
                  ? 'No cohort medications logged yet. Click "Prescribe Medication" to add a prescription.'
                  : 'Start by adding your first medication to track intake, adherence, and refills.'
            }
            actionLabel="Add Medication"
            onAction={() => navigate('/medications/new')}
          />
        ) : (
          <div className="meds-grid">
            {filteredMeds.map((medication) => {
              const maxStock = 60;
              const stockPercent = Math.min(
                100,
                Math.round(((medication.quantity || 12) / maxStock) * 100)
              );
              const isLowStock = (medication.quantity || 12) <= 10;

              return (
                <div
                  key={medication.id}
                  className="med-card"
                  onClick={() => navigate(`/medications/${medication.id}`)}
                >
                  <div className="med-card-body">
                    {/* Cohort Patient Badge for Caregivers */}
                    {isCaregiver && medication.patient && (
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          {medication.patientAvatar ? (
                            <img
                              src={medication.patientAvatar}
                              alt={medication.patient}
                              className="h-6 w-6 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                              {medication.patient.slice(0, 2)}
                            </div>
                          )}
                          <span className="text-xs font-bold text-slate-900">
                            {medication.patient}
                          </span>
                        </div>
                        <Badge
                          variant={
                            (medication.adherence || 100) >= 85
                              ? 'success'
                              : (medication.adherence || 100) >= 70
                                ? 'warning'
                                : 'danger'
                          }
                          size="xs"
                        >
                          {medication.adherence || 100}% Adherence
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
                        {medication.disease || 'General'}
                      </span>
                    </div>

                    <div className="med-schedule-tags">
                      <span className="med-tag">
                        <Clock className="h-3 w-3 text-indigo-500" />
                        {medication.frequency || 'Daily'}
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
                          {medication.quantity || 0} units
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
