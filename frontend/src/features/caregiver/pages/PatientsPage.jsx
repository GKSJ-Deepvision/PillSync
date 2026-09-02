import { useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import {
  Search,
  Plus,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageSquare,
  Pill,
  Send,
  Calendar,
} from 'lucide-react';
import './PatientsPage.css';

const INITIAL_PATIENTS = [
  {
    id: 'p1',
    name: 'Ibrahim Kadri',
    age: 54,
    gender: 'Male',
    condition: 'Type 2 Diabetes & Hypertension',
    adherence: 94,
    status: 'adherent',
    activePrescriptions: 4,
    nextDose: 'Metformin 500mg · 08:00 AM',
    phone: '+1 (555) 234-5678',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    lastTaken: 'Today, 08:15 AM',
  },
  {
    id: 'p2',
    name: 'Sarah Connor',
    age: 48,
    gender: 'Female',
    condition: 'Cardiac Arrhythmia & High Cholesterol',
    adherence: 64,
    status: 'high_risk',
    activePrescriptions: 5,
    nextDose: 'Atorvastatin 20mg · 09:00 PM',
    phone: '+1 (555) 876-5432',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    lastTaken: 'Yesterday, 09:30 PM (Missed morning dose)',
  },
  {
    id: 'p3',
    name: 'Michael Chang',
    age: 62,
    gender: 'Male',
    condition: 'Hypothyroidism & Joint Inflammation',
    adherence: 82,
    status: 'moderate',
    activePrescriptions: 3,
    nextDose: 'Levothyroxine 75mcg · 07:00 AM',
    phone: '+1 (555) 345-6789',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    lastTaken: 'Today, 07:10 AM',
  },
  {
    id: 'p4',
    name: 'Eleanor Vance',
    age: 71,
    gender: 'Female',
    condition: 'Osteoporosis & Vitamin D Deficiency',
    adherence: 98,
    status: 'adherent',
    activePrescriptions: 2,
    nextDose: 'Calcium + Vit D3 · 12:30 PM',
    phone: '+1 (555) 987-6543',
    avatar:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    lastTaken: 'Today, 12:45 PM',
  },
  {
    id: 'p5',
    name: 'Robert Taylor',
    age: 58,
    gender: 'Male',
    condition: 'Severe Hypertension',
    adherence: 52,
    status: 'high_risk',
    activePrescriptions: 3,
    nextDose: 'Lisinopril 10mg · 08:00 AM',
    phone: '+1 (555) 456-7890',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    lastTaken: '2 days ago (2 consecutive doses missed)',
  },
];

export function PatientsPage() {
  const { user } = useAuth();
  const [patients] = useState(() => {
    let list = [...INITIAL_PATIENTS];
    if (user?.role === 'patient' && user?.name) {
      list[0] = {
        ...list[0],
        name: user.name,
      };
    }
    return list;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [nudgedPatientId, setNudgedPatientId] = useState(null);

  const handleNudge = (patient) => {
    setNudgedPatientId(patient.id);
    alert('Caregiver Dose Nudge dispatched to ' + patient.name + ' via SMS and Push Notification!');
    setTimeout(() => setNudgedPatientId(null), 3000);
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedRisk === 'all') return matchesSearch;
    if (selectedRisk === 'high_risk') return matchesSearch && p.adherence < 70;
    if (selectedRisk === 'moderate') return matchesSearch && p.adherence >= 70 && p.adherence < 85;
    if (selectedRisk === 'adherent') return matchesSearch && p.adherence >= 85;
    return matchesSearch;
  });

  const highRiskCount = patients.filter((p) => p.adherence < 70).length;
  const avgAdherence = Math.round(
    patients.reduce((acc, p) => acc + p.adherence, 0) / patients.length
  );

  return (
    <Layout>
      <div className="patients-container">
        {/* Header */}
        <div className="patients-header">
          <div>
            <div className="patients-title-row">
              <h1 className="patients-title">Assigned Patients Portal</h1>
              <Badge variant="primary" size="sm">
                {patients.length} Monitored
              </Badge>
              {highRiskCount > 0 && (
                <Badge variant="danger" size="sm">
                  {highRiskCount} High Risk Alert
                </Badge>
              )}
            </div>
            <p className="patients-subtitle">
              Caregiver & Clinical team oversight: Real-time adherence tracking, prescription
              management, and dose nudges
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => alert('New patient assignment modal: Enter Patient ID or email')}
              className="flex items-center gap-2 text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              Assign New Patient
            </Button>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="patients-kpi-grid">
          <div className="patients-kpi-card">
            <div className="patients-kpi-header">
              <div>
                <p className="patients-kpi-label">Cohort Adherence</p>
                <p className="patients-kpi-value text-indigo-700">{avgAdherence}%</p>
              </div>
              <div className="patients-kpi-icon-box icon-indigo">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="patients-kpi-subtext text-emerald-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              +4.8% improvement this month
            </p>
          </div>

          <div className="patients-kpi-card">
            <div className="patients-kpi-header">
              <div>
                <p className="patients-kpi-label">Doses Taken Today</p>
                <p className="patients-kpi-value text-emerald-600">18 / 22</p>
              </div>
              <div className="patients-kpi-icon-box icon-emerald">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="patients-kpi-subtext text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />4 upcoming
              evening doses
            </p>
          </div>

          <div className="patients-kpi-card">
            <div className="patients-kpi-header">
              <div>
                <p className="patients-kpi-label">Critical Risk Flag</p>
                <p className="patients-kpi-value text-rose-600">{highRiskCount} Patients</p>
              </div>
              <div className="patients-kpi-icon-box icon-rose">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="patients-kpi-subtext text-rose-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
              Requires immediate dose follow-up
            </p>
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="patients-toolbar">
          <div className="patients-search-wrapper">
            <Search className="patients-search-icon" />
            <input
              type="text"
              placeholder="Search by patient name, diagnosis, or medication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="patients-search-input"
            />
          </div>

          <div className="patients-filter-bar">
            {[
              { id: 'all', label: 'All Patients', count: patients.length },
              { id: 'high_risk', label: 'High Risk (<70%)', count: highRiskCount },
              {
                id: 'moderate',
                label: 'Moderate (70-85%)',
                count: patients.filter((p) => p.adherence >= 70 && p.adherence < 85).length,
              },
              {
                id: 'adherent',
                label: 'Compliant (>85%)',
                count: patients.filter((p) => p.adherence >= 85).length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedRisk(tab.id)}
                className={`patients-filter-chip ${
                  selectedRisk === tab.id
                    ? 'patients-filter-chip-active'
                    : 'patients-filter-chip-inactive'
                }`}
              >
                <span>{tab.label}</span>
                <span className="opacity-80 text-[10px]">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Patients Grid */}
        <div className="patients-grid">
          {filteredPatients.map((patient) => {
            const isHighRisk = patient.adherence < 70;
            const isModerate = patient.adherence >= 70 && patient.adherence < 85;

            return (
              <div key={patient.id} className="patient-card">
                {/* Header: Avatar, Name & Risk Badge */}
                <div className="patient-card-header">
                  <div className="flex items-center gap-3">
                    <div className="patient-avatar-box">
                      <img src={patient.avatar} alt={patient.name} className="patient-avatar-img" />
                      <span className="patient-online-dot" />
                    </div>
                    <div>
                      <h3 className="patient-info-name">{patient.name}</h3>
                      <p className="patient-info-meta">
                        Age: {patient.age} · {patient.gender}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={isHighRisk ? 'danger' : isModerate ? 'warning' : 'success'}
                    size="xs"
                  >
                    {isHighRisk ? 'High Risk' : isModerate ? 'Moderate' : 'Compliant'}
                  </Badge>
                </div>

                {/* Condition & Prescriptions Info */}
                <div className="patient-details-list">
                  <div className="patient-detail-row">
                    <span className="patient-detail-label">Diagnosis:</span>
                    <span>{patient.condition}</span>
                  </div>
                  <div className="patient-detail-row text-slate-500">
                    <Pill className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>{patient.activePrescriptions} Active Prescriptions</span>
                  </div>
                  <div className="patient-detail-row text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Next: {patient.nextDose}</span>
                  </div>
                </div>

                {/* Adherence Progress Bar */}
                <div className="patient-adherence-box">
                  <div className="patient-adherence-row">
                    <span className="font-semibold text-slate-600">30-Day Adherence</span>
                    <span
                      className={`font-black ${
                        isHighRisk
                          ? 'text-rose-600'
                          : isModerate
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                      }`}
                    >
                      {patient.adherence}%
                    </span>
                  </div>
                  <div className="patient-adherence-track">
                    <div
                      className={`patient-adherence-fill ${
                        isHighRisk ? 'fill-rose' : isModerate ? 'fill-amber' : 'fill-emerald'
                      }`}
                      style={{ width: patient.adherence + '%' }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Last log: {patient.lastTaken}</p>
                </div>

                {/* Action Buttons */}
                <div className="patient-actions-row">
                  <button onClick={() => handleNudge(patient)} className="patient-nudge-btn">
                    <Send className="h-3.5 w-3.5" />
                    <span>{nudgedPatientId === patient.id ? 'Nudge Sent! ✓' : 'Send Nudge'}</span>
                  </button>

                  <a
                    href={'tel:' + patient.phone}
                    className="patient-action-icon-btn"
                    title={'Call ' + patient.name}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>

                  <button
                    onClick={() => alert('Opening secure consultation chat with ' + patient.name)}
                    className="patient-action-icon-btn"
                    title="Send Direct Message"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
