import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { medicationApi } from '../../../api/medications';
import { Layout } from '../../../components/layout';
import { Alert } from '../../../components/common';
import { ArrowLeft, Save, Sparkles, Check, Clock, Calendar, Pill } from 'lucide-react';
import './MedicationFormPage.css';

// ── Clinically Curated Medication Catalog ──
const CLINICAL_CATALOG = [
  {
    category: 'Diabetes & Glucose Management',
    meds: [
      {
        name: 'Metformin HCl',
        condition: 'Type 2 Diabetes',
        form: 'Oral Tablet',
        dosage: '500mg',
        frequency: 'Twice daily',
        schedule: ['08:00 AM', '08:00 PM'],
        instructions: 'Take with or immediately after meals',
        quantity: 60,
      },
      {
        name: 'Glipizide',
        condition: 'Type 2 Diabetes',
        form: 'Oral Tablet',
        dosage: '5mg',
        frequency: 'Once daily (Morning)',
        schedule: ['08:00 AM'],
        instructions: 'Take 30 minutes before breakfast',
        quantity: 30,
      },
      {
        name: 'Jardiance (Empagliflozin)',
        condition: 'Type 2 Diabetes',
        form: 'Oral Tablet',
        dosage: '10mg',
        frequency: 'Once daily (Morning)',
        schedule: ['08:00 AM'],
        instructions: 'Take in the morning with or without food',
        quantity: 30,
      },
      {
        name: 'Januvia (Sitagliptin)',
        condition: 'Type 2 Diabetes',
        form: 'Oral Tablet',
        dosage: '100mg',
        frequency: 'Once daily (Morning)',
        schedule: ['08:00 AM'],
        instructions: 'Take once daily with water',
        quantity: 30,
      },
      {
        name: 'Insulin Glargine (Lantus)',
        condition: 'Type 2 Diabetes',
        form: 'Subcutaneous Injection',
        dosage: '10 Units',
        frequency: 'Once daily (Bedtime)',
        schedule: ['10:00 PM'],
        instructions: 'Inject subcutaneously once daily at bedtime',
        quantity: 30,
      },
    ],
  },
  {
    category: 'Blood Pressure & Hypertension',
    meds: [
      {
        name: 'Lisinopril',
        condition: 'Hypertension (High Blood Pressure)',
        form: 'Oral Tablet',
        dosage: '10mg',
        frequency: 'Once daily (Morning)',
        schedule: ['08:00 AM'],
        instructions: 'Take with a full glass of water',
        quantity: 30,
      },
      {
        name: 'Amlodipine Besylate',
        condition: 'Hypertension (High Blood Pressure)',
        form: 'Oral Tablet',
        dosage: '5mg',
        frequency: 'Once daily (Morning)',
        schedule: ['08:00 AM'],
        instructions: 'Take once daily at the same time',
        quantity: 30,
      },
      {
        name: 'Losartan Potassium',
        condition: 'Hypertension (High Blood Pressure)',
        form: 'Oral Tablet',
        dosage: '50mg',
        frequency: 'Once daily (Morning)',
        schedule: ['08:00 AM'],
        instructions: 'Can be taken with or without food',
        quantity: 30,
      },
      {
        name: 'Hydrochlorothiazide (HCTZ)',
        condition: 'Hypertension (High Blood Pressure)',
        form: 'Oral Tablet',
        dosage: '25mg',
        frequency: 'Once daily (Morning)',
        schedule: ['08:00 AM'],
        instructions: 'Take in the morning to avoid nighttime urination',
        quantity: 30,
      },
      {
        name: 'Metoprolol Tartrate',
        condition: 'Hypertension (High Blood Pressure)',
        form: 'Oral Tablet',
        dosage: '25mg',
        frequency: 'Twice daily',
        schedule: ['08:00 AM', '08:00 PM'],
        instructions: 'Take with or immediately after meals',
        quantity: 60,
      },
    ],
  },
  {
    category: 'Cholesterol & Cardiovascular Care',
    meds: [
      {
        name: 'Atorvastatin (Lipitor)',
        condition: 'High Cholesterol',
        form: 'Oral Tablet',
        dosage: '20mg',
        frequency: 'Once daily (Bedtime)',
        schedule: ['09:00 PM'],
        instructions: 'Take at bedtime with water',
        quantity: 30,
      },
      {
        name: 'Rosuvastatin (Crestor)',
        condition: 'High Cholesterol',
        form: 'Oral Tablet',
        dosage: '10mg',
        frequency: 'Once daily (Bedtime)',
        schedule: ['09:00 PM'],
        instructions: 'Take in the evening with water',
        quantity: 30,
      },
      {
        name: 'Aspirin (Cardio)',
        condition: 'Cardiovascular Health',
        form: 'Oral Tablet',
        dosage: '81mg',
        frequency: 'Once daily (Morning)',
        schedule: ['08:00 AM'],
        instructions: 'Take with breakfast to protect stomach',
        quantity: 30,
      },
      {
        name: 'Clopidogrel (Plavix)',
        condition: 'Cardiovascular Health',
        form: 'Oral Tablet',
        dosage: '75mg',
        frequency: 'Once daily (Morning)',
        schedule: ['08:00 AM'],
        instructions: 'Take once daily at the same time',
        quantity: 30,
      },
    ],
  },
  {
    category: 'Thyroid & Hormonal Health',
    meds: [
      {
        name: 'Levothyroxine Sodium',
        condition: 'Hypothyroidism',
        form: 'Oral Tablet',
        dosage: '50mcg',
        frequency: 'Once daily (Morning)',
        schedule: ['06:30 AM'],
        instructions: 'Take on empty stomach 30-60 mins before breakfast',
        quantity: 30,
      },
    ],
  },
  {
    category: 'Gastrointestinal & Acid Reflux',
    meds: [
      {
        name: 'Omeprazole (Prilosec)',
        condition: 'Acid Reflux (GERD)',
        form: 'Capsule',
        dosage: '20mg',
        frequency: 'Once daily (Morning)',
        schedule: ['07:30 AM'],
        instructions: 'Take 30 to 60 minutes before first meal of the day',
        quantity: 30,
      },
      {
        name: 'Pantoprazole (Protonix)',
        condition: 'Acid Reflux (GERD)',
        form: 'Oral Tablet',
        dosage: '40mg',
        frequency: 'Once daily (Morning)',
        schedule: ['07:30 AM'],
        instructions: 'Swallow whole before first meal',
        quantity: 30,
      },
    ],
  },
  {
    category: 'Asthma & Respiratory Care',
    meds: [
      {
        name: 'Albuterol Inhaler',
        condition: 'Asthma & Respiratory',
        form: 'Inhaler Puff',
        dosage: '2 Puffs',
        frequency: 'As needed (PRN)',
        schedule: ['08:00 AM'],
        instructions: 'Inhale 1-2 puffs as needed for shortness of breath',
        quantity: 60,
      },
      {
        name: 'Montelukast (Singulair)',
        condition: 'Asthma & Respiratory',
        form: 'Oral Tablet',
        dosage: '10mg',
        frequency: 'Once daily (Bedtime)',
        schedule: ['09:30 PM'],
        instructions: 'Take once daily in the evening',
        quantity: 30,
      },
    ],
  },
  {
    category: 'Pain Relief & Inflammation',
    meds: [
      {
        name: 'Ibuprofen',
        condition: 'Pain & Inflammation',
        form: 'Oral Tablet',
        dosage: '400mg',
        frequency: 'Twice daily',
        schedule: ['08:00 AM', '08:00 PM'],
        instructions: 'Always take with food or milk',
        quantity: 30,
      },
      {
        name: 'Acetaminophen / Paracetamol',
        condition: 'Pain & Fever Relief',
        form: 'Oral Tablet',
        dosage: '650mg',
        frequency: 'Twice daily',
        schedule: ['08:00 AM', '08:00 PM'],
        instructions: 'Take with plenty of water',
        quantity: 30,
      },
      {
        name: 'Gabapentin',
        condition: 'Neuropathic Pain',
        form: 'Capsule',
        dosage: '300mg',
        frequency: '3 times daily',
        schedule: ['08:00 AM', '02:00 PM', '09:00 PM'],
        instructions: 'Take at consistent intervals with water',
        quantity: 90,
      },
    ],
  },
  {
    category: 'Vitamins & Daily Supplements',
    meds: [
      {
        name: 'Vitamin D3 (Cholecalciferol)',
        condition: 'Vitamin & Bone Health',
        form: 'Capsule',
        dosage: '2000 IU',
        frequency: 'Once daily (Morning)',
        schedule: ['08:30 AM'],
        instructions: 'Take with a meal containing dietary fat',
        quantity: 30,
      },
      {
        name: 'Omega-3 Fish Oil',
        condition: 'Cardiovascular Health',
        form: 'Capsule',
        dosage: '1000mg',
        frequency: 'Once daily (Morning)',
        schedule: ['08:30 AM'],
        instructions: 'Take with breakfast',
        quantity: 30,
      },
    ],
  },
];

// Curated selection options
const DOSAGE_STRENGTH_OPTIONS = [
  '5mg',
  '10mg',
  '20mg',
  '25mg',
  '50mg',
  '100mg',
  '250mg',
  '400mg',
  '500mg',
  '650mg',
  '1000mg',
  '1 Tablet',
  '2 Tablets',
  '1 Capsule',
  '5ml (Syrup)',
  '10ml (Syrup)',
  '1 Puff',
  '2 Puffs',
  '10 Units',
  '2000 IU',
];

const FREQUENCY_OPTIONS = [
  'Once daily (Morning)',
  'Once daily (Bedtime)',
  'Twice daily',
  '3 times daily',
  'Every 8 hours',
  'Every 12 hours',
  'Weekly once',
  'As needed (PRN)',
];

const PRESET_SCHEDULE_TIMES = [
  '06:30 AM',
  '08:00 AM',
  '12:30 PM',
  '05:30 PM',
  '08:00 PM',
  '10:00 PM',
];

const INSTRUCTION_PRESETS = [
  'Take with or immediately after meals',
  'Take 30 minutes before breakfast',
  'Take on empty stomach with water',
  'Take at bedtime with water',
  'Take with full glass of water',
  'Always take with food or milk',
];

const QUANTITY_OPTIONS = [
  { label: '15 Doses (15 Days)', value: 15 },
  { label: '30 Doses (1 Month)', value: 30 },
  { label: '60 Doses (2 Months)', value: 60 },
  { label: '90 Doses (3 Months)', value: 90 },
];

const QUICK_PICK_MEDS = [
  'Metformin HCl',
  'Lisinopril',
  'Atorvastatin Calcium',
  'Amoxicillin',
  'Omeprazole',
  'Levothyroxine Sodium',
  'Amlodipine Besylate',
  'Vitamin D3',
  'Losartan Potassium',
  'Ibuprofen',
  'Gabapentin',
];

export function MedicationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);

  const prefill = location.state?.prefill;

  const [selectedCatalogMed, setSelectedCatalogMed] = useState('');
  const [formData, setFormData] = useState({
    name: prefill?.name || '',
    disease: prefill?.condition || '',
    dosage: prefill?.dosage || '10mg',
    quantity: 30,
    frequency: prefill?.frequency || 'Once daily (Morning)',
    schedule: ['08:00 AM'],
    instructions: 'Take with water',
    startDate: new Date().toISOString().split('T')[0],
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
        if (data) {
          setFormData({
            name: data.name || '',
            disease: data.disease || '',
            dosage: data.dosage || '',
            quantity: data.quantity || 30,
            frequency: data.frequency || 'Once daily (Morning)',
            schedule: Array.isArray(data.schedule) ? data.schedule : ['08:00 AM'],
            instructions: data.instructions || '',
            startDate: data.startDate || new Date().toISOString().split('T')[0],
            endDate: data.endDate || '',
            status: data.status || 'active',
          });
          setSelectedCatalogMed(data.name || '');
        }
      } catch (err) {
        setError('Failed to load medication');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMedication();
  }, [id, isEdit]);

  // When user selects a medication from the catalog or quick presets, auto-populate all clinical defaults!
  const applyMedicationPreset = (medName) => {
    setSelectedCatalogMed(medName);
    if (!medName) return;

    for (const group of CLINICAL_CATALOG) {
      const match = group.meds.find(
        (m) =>
          m.name.toLowerCase() === medName.toLowerCase() ||
          m.name.toLowerCase().startsWith(medName.toLowerCase())
      );
      if (match) {
        setFormData((prev) => ({
          ...prev,
          name: match.name,
          disease: match.condition,
          dosage: match.dosage,
          quantity: match.quantity,
          frequency: match.frequency,
          schedule: match.schedule,
          instructions: match.instructions,
        }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, name: medName }));
  };

  const handleSelectFromCatalog = (e) => {
    applyMedicationPreset(e.target.value);
  };

  const handleToggleScheduleTime = (timeStr) => {
    setFormData((prev) => {
      const exists = prev.schedule.includes(timeStr);
      const newSchedule = exists
        ? prev.schedule.filter((t) => t !== timeStr)
        : [...prev.schedule, timeStr];
      return { ...prev, schedule: newSchedule.length > 0 ? newSchedule : [timeStr] };
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please select or specify a medication name');
      return false;
    }
    if (!formData.dosage.trim()) {
      setError('Please select a dosage strength');
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
      setError(isEdit ? 'Failed to update prescription' : 'Failed to save prescription');
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
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 mb-2">
              <Sparkles className="h-3 w-3" />
              1-Click Smart Selection
            </div>
            <h1 className="text-xl font-black text-slate-900">
              {isEdit ? 'Edit Prescription Record' : 'Select & Add Prescription'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose from standard clinical medications to auto-fill dosage, timing, and meal rules.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

            {/* 1. Quick-Select Prescriptions Bar */}
            <div className="selection-card-box">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Sparkles className="h-4 w-4 text-indigo-600" />⚡ 1-Click Popular Prescriptions
                  (Tap to Auto-Fill All Details)
                </span>
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-100 px-2 py-0.5 rounded-full">
                  No Manual Typing
                </span>
              </div>

              <div className="chip-select-group mb-3">
                {QUICK_PICK_MEDS.map((medName) => (
                  <button
                    type="button"
                    key={medName}
                    onClick={() => applyMedicationPreset(medName)}
                    className={`chip-btn ${
                      formData.name.toLowerCase().includes(medName.toLowerCase().split(' ')[0])
                        ? 'chip-btn-active'
                        : ''
                    }`}
                  >
                    <Pill className="h-3 w-3" />
                    {medName}
                  </button>
                ))}
              </div>

              <label className="med-form-label flex items-center justify-between mt-3">
                <span className="flex items-center gap-1.5">
                  <Pill className="h-4 w-4 text-indigo-600" />
                  Or Select from Full Clinical Catalog *
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Over 25+ standard clinical regimens
                </span>
              </label>

              <select
                value={selectedCatalogMed}
                onChange={handleSelectFromCatalog}
                className="med-form-input cursor-pointer text-sm font-semibold text-slate-900 bg-white"
              >
                <option value="">-- Choose a Medication from Clinical Catalog --</option>
                {CLINICAL_CATALOG.map((group) => (
                  <optgroup key={group.category} label={group.category}>
                    {group.meds.map((med) => (
                      <option key={med.name} value={med.name}>
                        {med.name} ({med.dosage} · {med.condition})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="med-form-grid">
              {/* Selected Medication Name */}
              <div>
                <label className="med-form-label flex items-center justify-between">
                  <span>Selected Medication Name *</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Auto-filled</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="med-form-input font-bold text-slate-900 bg-slate-50"
                  required
                />
              </div>

              {/* Health Condition */}
              <div>
                <label className="med-form-label">Target Condition / Disease *</label>
                <select
                  value={formData.disease}
                  onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
                  className="med-form-input cursor-pointer"
                >
                  <option value="Type 2 Diabetes">Type 2 Diabetes</option>
                  <option value="Hypertension (High Blood Pressure)">
                    Hypertension (High Blood Pressure)
                  </option>
                  <option value="High Cholesterol">High Cholesterol</option>
                  <option value="Cardiovascular Health">Cardiovascular Health</option>
                  <option value="Hypothyroidism">Hypothyroidism</option>
                  <option value="Acid Reflux (GERD)">Acid Reflux (GERD)</option>
                  <option value="Asthma & Respiratory">Asthma & Respiratory</option>
                  <option value="Pain & Inflammation">Pain & Inflammation</option>
                  <option value="Vitamin & Bone Health">Vitamin & Bone Health</option>
                  <option value="General Preventative Care">General Preventative Care</option>
                </select>
              </div>

              {/* Dosage Strength */}
              <div>
                <label className="med-form-label">Dosage Strength (Tap to Select) *</label>
                <div className="chip-select-group mb-2">
                  {['5mg', '10mg', '20mg', '25mg', '50mg', '100mg', '500mg', '1 Tab', '1 Cap'].map(
                    (st) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setFormData({ ...formData, dosage: st })}
                        className={`chip-btn ${formData.dosage === st ? 'chip-btn-active' : ''}`}
                      >
                        {formData.dosage === st && <Check className="h-3 w-3" />}
                        {st}
                      </button>
                    )
                  )}
                </div>
                <select
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  className="med-form-input cursor-pointer font-bold text-slate-800"
                >
                  {DOSAGE_STRENGTH_OPTIONS.map((strength) => (
                    <option key={strength} value={strength}>
                      {strength}
                    </option>
                  ))}
                </select>
              </div>

              {/* Intake Frequency */}
              <div>
                <label className="med-form-label">Intake Frequency (Tap to Select) *</label>
                <div className="chip-select-group mb-2">
                  {[
                    'Once daily (Morning)',
                    'Twice daily',
                    'Once daily (Bedtime)',
                    'Three times daily',
                    'As needed (PRN)',
                  ].map((fr) => (
                    <button
                      type="button"
                      key={fr}
                      onClick={() => setFormData({ ...formData, frequency: fr })}
                      className={`chip-btn ${formData.frequency === fr ? 'chip-btn-active' : ''}`}
                    >
                      {formData.frequency === fr && <Check className="h-3 w-3" />}
                      {fr}
                    </button>
                  ))}
                </div>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="med-form-input cursor-pointer font-semibold text-slate-800"
                >
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <option key={freq} value={freq}>
                      {freq}
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Schedule Time Chips (Click to Select) */}
              <div className="med-form-full">
                <label className="med-form-label flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-600" />
                    Daily Dose Schedule Times (Tap to Select/Deselect) *
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Selected: {formData.schedule.join(', ') || 'None'}
                  </span>
                </label>

                <div className="chip-select-group">
                  {PRESET_SCHEDULE_TIMES.map((timeStr) => {
                    const isSelected = formData.schedule.includes(timeStr);
                    return (
                      <button
                        type="button"
                        key={timeStr}
                        onClick={() => handleToggleScheduleTime(timeStr)}
                        className={`chip-btn ${isSelected ? 'chip-btn-active' : ''}`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meal Instruction Selection Chips */}
              <div className="med-form-full">
                <label className="med-form-label">
                  Meal &amp; Food Instructions (Tap to Select)
                </label>
                <div className="chip-select-group mb-2">
                  {INSTRUCTION_PRESETS.map((inst) => (
                    <button
                      type="button"
                      key={inst}
                      onClick={() => setFormData({ ...formData, instructions: inst })}
                      className={`chip-btn ${formData.instructions === inst ? 'chip-btn-active' : ''}`}
                    >
                      {formData.instructions === inst && <Check className="h-3 w-3" />}
                      {inst}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Custom instruction note..."
                  className="med-form-input text-xs"
                />
              </div>

              {/* Quantity in Supply */}
              <div className="med-form-full">
                <label className="med-form-label">Supply Quantity (Select Package Size)</label>
                <div className="chip-select-group mb-2">
                  {QUANTITY_OPTIONS.map((q) => (
                    <button
                      type="button"
                      key={q.value}
                      onClick={() => setFormData({ ...formData, quantity: q.value })}
                      className={`chip-btn ${Number(formData.quantity) === q.value ? 'chip-btn-active' : ''}`}
                    >
                      {Number(formData.quantity) === q.value && <Check className="h-3 w-3" />}
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="med-form-label flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                    Regimen Start Date (Tap Preset) *
                  </span>
                </label>
                <div className="chip-select-group mb-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        startDate: new Date().toISOString().split('T')[0],
                      })
                    }
                    className={`chip-btn ${
                      formData.startDate === new Date().toISOString().split('T')[0]
                        ? 'chip-btn-active'
                        : ''
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      setFormData({
                        ...formData,
                        startDate: d.toISOString().split('T')[0],
                      });
                    }}
                    className="chip-btn"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      setFormData({
                        ...formData,
                        startDate: d.toISOString().split('T')[0],
                      });
                    }}
                    className="chip-btn"
                  >
                    Next Week
                  </button>
                </div>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="med-form-input"
                  required
                />
              </div>

              {/* Regimen Status */}
              <div>
                <label className="med-form-label">Status (Tap to Select)</label>
                <div className="chip-select-group mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'active' })}
                    className={`chip-btn ${formData.status === 'active' ? 'chip-btn-active' : ''}`}
                  >
                    {formData.status === 'active' && <Check className="h-3 w-3" />}
                    Active Regimen
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'inactive' })}
                    className={`chip-btn ${formData.status === 'inactive' ? 'chip-btn-active' : ''}`}
                  >
                    {formData.status === 'inactive' && <Check className="h-3 w-3" />}
                    Paused / Inactive
                  </button>
                </div>
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-md"
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
