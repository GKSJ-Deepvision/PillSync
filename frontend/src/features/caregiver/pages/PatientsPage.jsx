import { useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Card } from '../../../components/common/Card';
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
            <div className="flex items-center gap-2">
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cohort Adherence
                </p>
                <p className="text-2xl font-black text-indigo-700 mt-1">{avgAdherence}%</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-2">
              +4.8% improvement this month
            </p>
          </Card>

          <Card className="p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Doses Taken Today
                </p>
                <p className="text-2xl font-black text-emerald-600 mt-1">18 / 22</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-2">4 upcoming evening doses</p>
          </Card>

          <Card className="p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Critical Risk Flag
                </p>
                <p className="text-2xl font-black text-rose-600 mt-1">{highRiskCount} Patients</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-rose-600 font-semibold mt-2">
              Requires immediate dose follow-up
            </p>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:max-w-md">
            <Input
              icon={Search}
              placeholder="Search by patient name, diagnosis, or medication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="patients-filter-bar w-full sm:w-auto">
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
                <span className="ml-1 opacity-80 text-[10px]">({tab.count})</span>
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
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <span className="font-bold text-slate-900">Diagnosis:</span>
                    <span>{patient.condition}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Pill className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{patient.activePrescriptions} Active Prescriptions</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
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
                        isHighRisk ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: patient.adherence + '%' }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Last log: {patient.lastTaken}</p>
                </div>

                {/* Action Buttons */}
                <div className="patient-actions-row">
                  <button
                    onClick={() => handleNudge(patient)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 text-xs font-bold transition cursor-pointer border border-indigo-200/60"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{nudgedPatientId === patient.id ? 'Nudge Sent! ✓' : 'Send Nudge'}</span>
                  </button>

                  <a
                    href={'tel:' + patient.phone}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                    title={'Call ' + patient.name}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>

                  <button
                    onClick={() => alert('Opening secure consultation chat with ' + patient.name)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
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
