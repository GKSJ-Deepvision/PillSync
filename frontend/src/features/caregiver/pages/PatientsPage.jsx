import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/useAuth';
import { isPatientAssignedToCaregiver } from '../../../utils/cohort';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { apiClient } from '../../../api/client';
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
  Users,
  Trash2,
  UserCheck,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { isDemoEmail } from '../../../api/auth';
import './PatientsPage.css';

const DEFAULT_CLINICIANS = ['souju', 'praveen', 'Ram'];

function loadMergedPatients() {
  let assigned = [];
  try {
    const rawAssigned = localStorage.getItem('pillsync_assigned_patients');
    if (rawAssigned) {
      const parsed = JSON.parse(rawAssigned);
      if (Array.isArray(parsed)) assigned = parsed.filter((p) => !isDemoEmail(p.email));
    }
  } catch (err) {
    console.error(err);
  }

  let registered = [];
  try {
    const rawUsers = localStorage.getItem('pillsync_registered_users');
    if (rawUsers) {
      const parsedUsers = JSON.parse(rawUsers);
      if (Array.isArray(parsedUsers)) registered = parsedUsers.filter((u) => !isDemoEmail(u.email));
    }
  } catch (err) {
    console.error(err);
  }

  const patientUsers = registered.filter(
    (u) =>
      !isDemoEmail(u.email) &&
      (u.role || 'patient').toLowerCase() === 'patient' &&
      u.assignedCaregiver &&
      u.assignedCaregiver !== 'Unassigned'
  );

  let merged = [...assigned];
  let changed = false;

  for (const reg of patientUsers) {
    const alreadyExists = merged.some(
      (p) =>
        (p.id && reg.id && String(p.id) === String(reg.id)) ||
        (p.email && reg.email && p.email.toLowerCase() === reg.email.toLowerCase()) ||
        (p.name && reg.name && p.name.toLowerCase() === reg.name.toLowerCase())
    );

    if (!alreadyExists) {
      merged.push({
        id: reg.id || `pt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: reg.name,
        email: reg.email,
        condition: reg.condition || 'General Monitoring',
        age: reg.age || 48,
        gender: reg.gender || 'Patient',
        adherence: reg.adherence || 92,
        prescriptionsCount: reg.prescriptionsCount || 1,
        phone: reg.phone || '+1 555-0190',
        lastTaken: 'Today',
        assignedCaregiver: reg.assignedCaregiver,
        avatar: reg.avatar,
      });
      changed = true;
    }
  }

  if (changed || (assigned.length === 0 && merged.length > 0)) {
    try {
      localStorage.setItem('pillsync_assigned_patients', JSON.stringify(merged));
    } catch (e) {
      console.error(e);
    }
  }

  return merged;
}

export function PatientsPage() {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();
  const isCaregiver = userRole === 'caregiver';
  const isAdmin = userRole === 'admin';

  const [patients, setPatients] = useState(loadMergedPatients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedCaregiver, setSelectedCaregiver] = useState('all');
  const [nudgedPatientId, setNudgedPatientId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRegUser, setSelectedRegUser] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    condition: 'Type 2 Diabetes',
    age: '54',
    gender: 'Female',
    adherence: 95,
    prescriptionsCount: 2,
    phone: '+1 555-0192',
    assignedCaregiver: user?.name || user?.email?.split('@')[0] || 'Caregiver Clinician',
  });

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const raw = localStorage.getItem('pillsync_registered_users');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Fetch all real registered users & patients from central backend database
  const fetchBackendPatients = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/auth/users/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const serverUsers = res.data.filter((u) => !isDemoEmail(u.email));
        setRegisteredUsers(serverUsers);
        try {
          localStorage.setItem('pillsync_registered_users', JSON.stringify(serverUsers));
        } catch {
          // ignore localStorage error
        }

        const serverPatients = serverUsers.filter(
          (u) =>
            (u.role || '').toLowerCase() === 'patient' &&
            u.assignedCaregiver &&
            u.assignedCaregiver !== 'Unassigned'
        );

        setPatients((prev) => {
          const merged = prev.filter((p) => !isDemoEmail(p.email));
          let changed = false;

          for (const sp of serverPatients) {
            const existsIdx = merged.findIndex(
              (p) =>
                (p.id && sp.id && String(p.id) === String(sp.id)) ||
                (p.email && sp.email && p.email.toLowerCase() === sp.email.toLowerCase()) ||
                (p.name && sp.name && p.name.toLowerCase() === sp.name.toLowerCase())
            );

            if (existsIdx >= 0) {
              if (
                merged[existsIdx].assignedCaregiver !== sp.assignedCaregiver &&
                sp.assignedCaregiver
              ) {
                merged[existsIdx] = {
                  ...merged[existsIdx],
                  assignedCaregiver: sp.assignedCaregiver,
                };
                changed = true;
              }
            } else {
              merged.push({
                id: sp.id,
                name: sp.name,
                email: sp.email,
                condition: 'General Monitoring',
                age: 48,
                gender: 'Patient',
                adherence: 95,
                prescriptionsCount: 1,
                phone: '+1 555-0190',
                lastTaken: 'Today',
                assignedCaregiver: sp.assignedCaregiver,
              });
              changed = true;
            }
          }

          if (changed) {
            try {
              localStorage.setItem('pillsync_assigned_patients', JSON.stringify(merged));
            } catch {
              // ignore localStorage error
            }
          }
          return merged;
        });
      }
    } catch (err) {
      console.warn('Backend patient fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendPatients();
  }, []);

  // Compute all available caregivers taking care of patients
  const caregiverOptions = Array.from(
    new Set([
      ...DEFAULT_CLINICIANS,
      ...registeredUsers
        .filter((u) => (u.role || '').toLowerCase() === 'caregiver')
        .map((u) => u.name),
    ])
  ).filter(Boolean);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const handleNudge = (patient) => {
    setNudgedPatientId(patient.id);
    showToast(`Dose nudge dispatched to ${patient.name} via SMS and Push Notification!`);
    setTimeout(() => {
      setNudgedPatientId(null);
    }, 3000);
  };

  const handleSelectRegisteredUser = (userId) => {
    setSelectedRegUser(userId);
    const myCaregiverName = user?.name || user?.email?.split('@')[0] || 'Caregiver Clinician';
    if (!userId) {
      setNewPatient((prev) => ({
        ...prev,
        name: '',
        email: '',
        assignedCaregiver: isCaregiver ? myCaregiverName : prev.assignedCaregiver,
      }));
      return;
    }

    const found = registeredUsers.find((u) => String(u.id) === String(userId));
    if (found) {
      setNewPatient((prev) => ({
        ...prev,
        name: found.name || '',
        email: found.email || '',
        condition: found.condition || prev.condition || 'General Monitoring',
        phone: found.phone || prev.phone || '+1 555-0199',
        assignedCaregiver: isCaregiver
          ? myCaregiverName
          : found.assignedCaregiver && found.assignedCaregiver !== 'Unassigned'
            ? found.assignedCaregiver
            : myCaregiverName,
      }));
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatient.name.trim()) return;

    const patientName = newPatient.name.trim();
    const patientEmail =
      newPatient.email.trim() || `${patientName.toLowerCase().replace(/\s+/g, '.')}@patient.local`;

    const myCaregiverName = user?.name || user?.email?.split('@')[0] || 'Caregiver Clinician';
    const targetCaregiver = isCaregiver
      ? myCaregiverName
      : newPatient.assignedCaregiver || myCaregiverName;

    let created = {
      id: selectedRegUser || `pt-${Date.now()}`,
      name: patientName,
      email: patientEmail,
      condition: newPatient.condition || 'General Monitoring',
      age: parseInt(newPatient.age, 10) || 45,
      gender: newPatient.gender || 'Female',
      adherence: parseInt(newPatient.adherence, 10) || 90,
      prescriptionsCount: parseInt(newPatient.prescriptionsCount, 10) || 1,
      phone: newPatient.phone || '+1 555-0190',
      lastTaken: 'Today',
      assignedCaregiver: targetCaregiver,
    };

    // Save to central backend if user exists
    if (selectedRegUser && !isNaN(Number(selectedRegUser))) {
      try {
        await apiClient.patch(`/auth/users/${selectedRegUser}/`, {
          assignedCaregiver: targetCaregiver,
        });
      } catch (err) {
        console.warn('Backend user assign error:', err);
      }
    } else {
      try {
        const res = await apiClient.post('/auth/users/', {
          email: patientEmail,
          name: patientName,
          role: 'patient',
          assignedCaregiver: targetCaregiver,
        });
        if (res.data?.id) {
          created.id = res.data.id;
        }
      } catch (err) {
        console.warn('Backend user create error:', err);
      }
    }

    // Sync pillsync_registered_users in local storage & state
    try {
      const rawReg = localStorage.getItem('pillsync_registered_users');
      if (rawReg) {
        const parsed = JSON.parse(rawReg);
        if (Array.isArray(parsed)) {
          const updatedReg = parsed.map((u) => {
            if (
              (selectedRegUser && String(u.id) === String(selectedRegUser)) ||
              (u.email && patientEmail && u.email.toLowerCase() === patientEmail.toLowerCase()) ||
              (u.name && patientName && u.name.toLowerCase() === patientName.toLowerCase())
            ) {
              return { ...u, assignedCaregiver: targetCaregiver };
            }
            return u;
          });
          localStorage.setItem('pillsync_registered_users', JSON.stringify(updatedReg));
          setRegisteredUsers(updatedReg);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Update patients state & local storage
    const updated = [
      created,
      ...patients.filter(
        (p) =>
          p.name.toLowerCase() !== patientName.toLowerCase() && String(p.id) !== String(created.id)
      ),
    ];
    setPatients(updated);
    localStorage.setItem('pillsync_assigned_patients', JSON.stringify(updated));

    setIsAssignModalOpen(false);
    setSelectedRegUser('');
    setNewPatient({
      name: '',
      email: '',
      condition: 'Hypertension',
      age: '58',
      gender: 'Male',
      adherence: 92,
      prescriptionsCount: 2,
      phone: '+1 555-0194',
      assignedCaregiver: isCaregiver ? myCaregiverName : 'Caregiver Clinician',
    });

    showToast(`Assigned ${created.name} under ${created.assignedCaregiver}'s care!`);
  };

  const handleUnassignPatient = async (patientId, patientName) => {
    if (!window.confirm(`Unassign ${patientName || 'this patient'} from the caregiver roster?`)) {
      return;
    }

    const updated = patients.filter((p) => String(p.id) !== String(patientId));
    setPatients(updated);
    localStorage.setItem('pillsync_assigned_patients', JSON.stringify(updated));

    if (!isNaN(Number(patientId))) {
      try {
        await apiClient.patch(`/auth/users/${patientId}/`, {
          assignedCaregiver: 'Unassigned',
        });
      } catch (e) {
        console.warn(e);
      }
    }

    // Update registered users
    try {
      const rawReg = localStorage.getItem('pillsync_registered_users');
      if (rawReg) {
        const parsed = JSON.parse(rawReg);
        if (Array.isArray(parsed)) {
          const updatedReg = parsed.map((u) => {
            if (String(u.id) === String(patientId)) {
              return { ...u, assignedCaregiver: 'Unassigned' };
            }
            return u;
          });
          localStorage.setItem('pillsync_registered_users', JSON.stringify(updatedReg));
          setRegisteredUsers(updatedReg);
        }
      }
    } catch (e) {
      console.error(e);
    }

    showToast(`${patientName || 'Patient'} unassigned from roster.`);
  };

  const handleChangeCaregiver = async (patientId, newCaregiver) => {
    const updated = patients.map((p) =>
      String(p.id) === String(patientId) ? { ...p, assignedCaregiver: newCaregiver } : p
    );
    setPatients(updated);
    localStorage.setItem('pillsync_assigned_patients', JSON.stringify(updated));

    // Update central database
    if (!isNaN(Number(patientId))) {
      try {
        await apiClient.patch(`/auth/users/${patientId}/`, {
          assignedCaregiver: newCaregiver,
        });
      } catch (e) {
        console.warn(e);
      }
    }

    // Sync to pillsync_registered_users
    try {
      const rawReg = localStorage.getItem('pillsync_registered_users');
      if (rawReg) {
        const parsed = JSON.parse(rawReg);
        if (Array.isArray(parsed)) {
          const updatedReg = parsed.map((u) => {
            if (String(u.id) === String(patientId)) {
              return { ...u, assignedCaregiver: newCaregiver };
            }
            return u;
          });
          localStorage.setItem('pillsync_registered_users', JSON.stringify(updatedReg));
          setRegisteredUsers(updatedReg);
        }
      }
    } catch (e) {
      console.error(e);
    }

    showToast(`Caregiver taking care updated to: ${newCaregiver}`);
  };

  const baseCohort = isCaregiver
    ? patients.filter((p) => isPatientAssignedToCaregiver(p, user))
    : patients;

  const filteredPatients = baseCohort.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.condition?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.assignedCaregiver?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCaregiver =
      !isAdmin ||
      selectedCaregiver === 'all' ||
      p.assignedCaregiver?.toLowerCase() === selectedCaregiver.toLowerCase();

    if (!matchesCaregiver) return false;

    if (selectedRisk === 'all') return matchesSearch;
    if (selectedRisk === 'high_risk') return matchesSearch && p.adherence < 70;
    if (selectedRisk === 'moderate') return matchesSearch && p.adherence >= 70 && p.adherence < 85;
    if (selectedRisk === 'adherent') return matchesSearch && p.adherence >= 85;
    return matchesSearch;
  });

  const highRiskCount = baseCohort.filter((p) => p.adherence < 70).length;
  const avgAdherence =
    baseCohort.length > 0
      ? Math.round(baseCohort.reduce((acc, p) => acc + (p.adherence || 100), 0) / baseCohort.length)
      : 100;

  const availableRegisteredPatients = registeredUsers.filter(
    (u) => (u.role || 'patient').toLowerCase() === 'patient'
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
                {baseCohort.length} {isCaregiver ? 'Assigned' : 'Monitored Live'}
              </Badge>
              {highRiskCount > 0 && (
                <Badge variant="danger" size="sm">
                  {highRiskCount} High Risk Alert
                </Badge>
              )}
              {isLoading && (
                <Badge variant="gray" size="sm" className="animate-pulse">
                  Syncing Database...
                </Badge>
              )}
            </div>
            <p className="patients-subtitle">
              Caregiver &amp; Clinical team oversight: Real-time adherence tracking, dedicated
              caregiver assignments, and patient telemetry
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchBackendPatients}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition cursor-pointer"
              title="Refresh from server"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Button
              onClick={() => setIsAssignModalOpen(true)}
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
              {patients.length > 0 ? 'Optimal telemetry active' : 'Baseline optimal'}
            </p>
          </div>

          <div className="patients-kpi-card">
            <div className="patients-kpi-header">
              <div>
                <p className="patients-kpi-label">Active Caregivers</p>
                <p className="patients-kpi-value text-emerald-600">
                  {caregiverOptions.length} Clinicians
                </p>
              </div>
              <div className="patients-kpi-icon-box icon-emerald">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="patients-kpi-subtext text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
              Assigned caregivers in charge of patient care
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
              {highRiskCount > 0
                ? 'Requires immediate dose follow-up'
                : 'Zero critical risk alerts'}
            </p>
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="patients-toolbar">
          <div className="patients-search-wrapper">
            <Search className="patients-search-icon" />
            <input
              type="text"
              placeholder="Search by patient name, diagnosis, or caregiver taking care..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="patients-search-input"
            />
          </div>

          {/* Caregiver Filter Selection */}
          {isAdmin ? (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-bold text-slate-600 shrink-0">
                Filter by Caregiver:
              </span>
              <select
                value={selectedCaregiver}
                onChange={(e) => setSelectedCaregiver(e.target.value)}
                className="text-xs font-bold text-indigo-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
              >
                <option value="all">All Caregivers ({patients.length})</option>
                {caregiverOptions.map((c) => (
                  <option key={c} value={c}>
                    {c} (
                    {
                      patients.filter((p) => p.assignedCaregiver?.toLowerCase() === c.toLowerCase())
                        .length
                    }
                    )
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-bold text-slate-600 shrink-0">Assigned Caregiver:</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5 shadow-2xs">
                {user?.name || user?.email} ({baseCohort.length}{' '}
                {baseCohort.length === 1 ? 'Patient' : 'Patients'})
              </span>
            </div>
          )}

          <div className="patients-filter-bar">
            {[
              {
                id: 'all',
                label: isCaregiver ? 'Assigned Patients' : 'All Patients',
                count: baseCohort.length,
              },
              { id: 'high_risk', label: 'High Risk (<70%)', count: highRiskCount },
              {
                id: 'moderate',
                label: 'Moderate (70-85%)',
                count: baseCohort.filter((p) => p.adherence >= 70 && p.adherence < 85).length,
              },
              {
                id: 'adherent',
                label: 'Compliant (>85%)',
                count: baseCohort.filter((p) => p.adherence >= 85).length,
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
          {filteredPatients.length === 0 ? (
            <div
              className="col-span-full py-16 px-6 text-center bg-white rounded-2xl border border-slate-100 shadow-sm"
              style={{ gridColumn: '1 / -1' }}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No matching patients found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No patients match the current filter or caregiver selection. Assign new patients or
                adjust your filter.
              </p>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Assign Patient
              </button>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const isHighRisk = patient.adherence < 70;
              const isModerate = patient.adherence >= 70 && patient.adherence < 85;

              return (
                <div key={patient.id} className="patient-card">
                  {/* Header: Avatar, Name & Risk Badge */}
                  <div className="patient-card-header">
                    <div className="flex items-center gap-3">
                      <div className="patient-avatar-box">
                        {patient.avatar ? (
                          <img
                            src={patient.avatar}
                            alt={patient.name}
                            className="patient-avatar-img"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {patient.name?.slice(0, 2).toUpperCase() || 'PT'}
                          </div>
                        )}
                        <span className="patient-online-dot" />
                      </div>
                      <div>
                        <h3 className="patient-info-name">{patient.name}</h3>
                        <p className="patient-info-meta">
                          Age: {patient.age || 'N/A'} · {patient.gender || 'Patient'}
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

                  {/* PROMINENT CAREGIVER IN CHARGE CARD SECTION */}
                  <div className="caregiver-in-charge-box">
                    <div className="caregiver-in-charge-header">
                      <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                        <UserCheck className="h-3.5 w-3.5" />
                        Caregiver In Charge
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        Active Monitoring
                      </span>
                    </div>
                    <div className="caregiver-in-charge-body">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                          {patient.assignedCaregiver?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 m-0 leading-tight">
                            {patient.assignedCaregiver || 'Caregiver Clinician'}
                          </p>
                          <p className="text-[10px] text-slate-500 m-0">
                            Primary Assigned Clinician
                          </p>
                        </div>
                      </div>
                      <select
                        value={patient.assignedCaregiver || 'Caregiver Clinician'}
                        onChange={(e) => handleChangeCaregiver(patient.id, e.target.value)}
                        className="text-[11px] font-bold text-indigo-700 bg-white border border-indigo-200 rounded-lg px-2 py-1 outline-none hover:border-indigo-400 transition cursor-pointer"
                        title="Reassign caregiver taking care of this patient"
                      >
                        {caregiverOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Diagnosis & Prescriptions Info */}
                  <div className="patient-details-list">
                    <div className="patient-detail-row">
                      <span className="patient-detail-label">Diagnosis:</span>
                      <span>{patient.condition || 'General Monitoring'}</span>
                    </div>

                    <div className="patient-detail-row text-slate-500">
                      <Pill className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span>
                        {patient.prescriptionsCount || patient.activePrescriptions || 1} Active
                        Prescriptions
                      </span>
                    </div>
                    <div className="patient-detail-row text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Next Dose: {patient.nextDose || 'Scheduled daily'}</span>
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
                        {patient.adherence || 100}%
                      </span>
                    </div>
                    <div className="patient-adherence-track">
                      <div
                        className={`patient-adherence-fill ${
                          isHighRisk ? 'fill-rose' : isModerate ? 'fill-amber' : 'fill-emerald'
                        }`}
                        style={{ width: (patient.adherence || 100) + '%' }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Last logged intake: {patient.lastTaken || 'Today'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="patient-actions-row">
                    <button onClick={() => handleNudge(patient)} className="patient-nudge-btn">
                      <Send className="h-3.5 w-3.5" />
                      <span>{nudgedPatientId === patient.id ? 'Nudge Sent! ✓' : 'Send Nudge'}</span>
                    </button>

                    {patient.phone && (
                      <a
                        href={'tel:' + patient.phone}
                        className="patient-action-icon-btn"
                        title={'Call ' + patient.name}
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() =>
                        alert(
                          `Opening secure consultation line with ${patient.name} (Assigned Caregiver: ${
                            patient.assignedCaregiver || 'Caregiver Clinician'
                          })`
                        )
                      }
                      className="patient-action-icon-btn"
                      title="Send Direct Clinical Message"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleUnassignPatient(patient.id, patient.name)}
                      className="patient-action-icon-btn text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      title="Unassign patient from roster"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Assign Patient Modal */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Assign Patient to Care Roster
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePatient} className="mt-4 space-y-3.5">
                {/* Quick selector from registered users */}
                {availableRegisteredPatients.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quick Select from Registered Accounts
                    </label>
                    <select
                      value={selectedRegUser}
                      onChange={(e) => handleSelectRegisteredUser(e.target.value)}
                      className="w-full rounded-xl border border-indigo-200 bg-indigo-50/40 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                    >
                      <option value="">-- Or enter new patient details below --</option>
                      {availableRegisteredPatients.map((u) => {
                        const status =
                          u.assignedCaregiver && u.assignedCaregiver !== 'Unassigned'
                            ? `Assigned: ${u.assignedCaregiver}`
                            : 'Unassigned';
                        return (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email}) — [{status}]
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. sarah.jenkins@patient.local"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Condition / Diagnosis
                  </label>
                  <input
                    type="text"
                    value={newPatient.condition}
                    onChange={(e) => setNewPatient({ ...newPatient, condition: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned Caregiver *
                    </label>
                    {isCaregiver ? (
                      <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-bold text-indigo-700">
                        <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span className="truncate">
                          {user?.name || user?.email?.split('@')[0] || 'Caregiver Clinician'} (You)
                        </span>
                      </div>
                    ) : (
                      <select
                        value={newPatient.assignedCaregiver}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            assignedCaregiver: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-indigo-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      >
                        {caregiverOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                  >
                    Confirm &amp; Assign to Care Roster
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
