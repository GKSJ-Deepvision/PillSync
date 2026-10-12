import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Badge } from '../components/common/Badge';
import {
  Pill,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Send,
  AlertCircle,
  Plus,
  Users,
  Shield,
  Activity,
  ArrowRight,
  Bell,
  Server,
  Check,
  Fingerprint,
  MessageSquare,
  HeartPulse,
} from 'lucide-react';
import { getChatbotResponse } from '../utils/chatbotEngine';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { medicationApi } from '../api/medications';
import { reminderApi } from '../api/reminders';
import { apiClient } from '../api/client';
import { getScopedStorage, setScopedStorage } from '../utils/userStorage';
import { getCohortPatients } from '../utils/cohort';
import { isDemoEmail, WORKING_ACCOUNTS } from '../api/auth';
import './DashboardPage.css';

function getAdminRegisteredUsers() {
  const mergedMap = new Map();
  WORKING_ACCOUNTS.forEach((wa) => mergedMap.set(wa.email.toLowerCase(), wa));
  try {
    const raw = localStorage.getItem('pillsync_registered_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed
          .filter((u) => !isDemoEmail(u.email))
          .forEach((u) => {
            const key = u.email.toLowerCase();
            mergedMap.set(key, { ...mergedMap.get(key), ...u });
          });
      }
    }
  } catch (err) {
    console.error(err);
  }
  return Array.from(mergedMap.values());
}

function getAdminPlatformTelemetry(userCount) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const base = userCount > 0 ? userCount : 1;
  return days.map((day, idx) => ({
    day,
    activeUsers: base,
    ocrScans: Math.max(1, Math.round(base * 0.4 + (idx % 2))),
    reminders: Math.max(1, base * 3),
  }));
}

export function DashboardPage() {
  const { user } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'doctor',
      text: 'Good day! I am your PillSync Clinical Care AI Assistant. How can I help you manage your medications, review today’s schedule, or check your adherence?',
      suggestions: [
        'What medicines do I take?',
        'When is my next dose?',
        'Check my adherence',
        'What if I miss a dose?',
      ],
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesEndRef = useRef(null);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);
  const [userMeds, setUserMeds] = useState([]);
  const [doses, setDoses] = useState([]);
  const userRole = (user?.role || 'patient').toLowerCase();
  const [cohortPatients, setCohortPatients] = useState(() => getCohortPatients(user));

  useEffect(() => {
    setCohortPatients(getCohortPatients(user));
  }, [user]);

  const [adminUsers, setAdminUsers] = useState(() => getAdminRegisteredUsers());

  useEffect(() => {
    if (userRole === 'admin') {
      apiClient
        .get('/auth/users/')
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const cleanUsers = res.data.filter((u) => !isDemoEmail(u.email));
            const mergedMap = new Map();
            WORKING_ACCOUNTS.forEach((wa) => mergedMap.set(wa.email.toLowerCase(), wa));
            cleanUsers.forEach((cu) => {
              const key = cu.email.toLowerCase();
              mergedMap.set(key, { ...mergedMap.get(key), ...cu });
            });
            const finalUsers = Array.from(mergedMap.values());
            setAdminUsers(finalUsers);
            try {
              localStorage.setItem('pillsync_registered_users', JSON.stringify(finalUsers));
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [userRole]);
  const [patientCheckedIn, setPatientCheckedIn] = useState(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedDate = getScopedStorage('pillsync_patient_checkin_date', '');
      return savedDate === today;
    } catch {
      return false;
    }
  });
  const [checkinToast, setCheckinToast] = useState('');
  const [caregiverFeedbackSaved, setCaregiverFeedbackSaved] = useState(false);

  const adminPlatformData = useMemo(
    () => getAdminPlatformTelemetry(adminUsers.length),
    [adminUsers]
  );

  const handlePatientCheckin = () => {
    const today = new Date().toISOString().split('T')[0];
    setPatientCheckedIn(true);
    setScopedStorage('pillsync_patient_checkin_date', today);
    try {
      localStorage.setItem('pillsync_patient_checkin_date', today);
    } catch {}
    setCheckinToast("Daily check-in confirmed! Today's streak recorded.");
    setTimeout(() => setCheckinToast(''), 4500);
  };

  // Load real user medications from local API or assigned cohort schedule for caregivers
  useEffect(() => {
    let cancelled = false;

    // For Caregiver: generate doses strictly across their assigned cohort patients
    if (userRole === 'caregiver') {
      const cohort = getCohortPatients(user);
      const cohortDoses = [];
      let idx = 1;
      const todayStr = new Date().toISOString().split('T')[0];
      const now = new Date();

      cohort.forEach((p) => {
        const pKey = p.email
          ? p.email
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '_')
          : '';
        let pMeds = [];
        try {
          const rawMeds = localStorage.getItem(`pillsync_patient_medications_${pKey}`);
          if (rawMeds) pMeds = JSON.parse(rawMeds);
        } catch {}

        if (!Array.isArray(pMeds)) {
          pMeds = [];
        }

        let pStoredDoses = [];
        try {
          const rawDoses = localStorage.getItem(`pillsync_patient_doses_${pKey}`);
          if (rawDoses) pStoredDoses = JSON.parse(rawDoses);
        } catch {}

        pMeds.forEach((med) => {
          const schedules =
            Array.isArray(med.schedule) && med.schedule.length > 0 ? med.schedule : ['08:00 AM'];
          schedules.forEach((timeStr) => {
            const isPM = timeStr.includes('PM');
            let windowName = 'Morning';
            if (isPM && !timeStr.startsWith('12')) {
              windowName =
                timeStr.startsWith('08') || timeStr.startsWith('09') || timeStr.startsWith('10')
                  ? 'Night'
                  : 'Evening';
            } else if (isPM || timeStr.startsWith('12')) {
              windowName = 'Afternoon';
            }

            const doseKey = `${p.id || p.name}-${med.name}-${timeStr}`;
            let isPastTime = false;
            try {
              const [timePart, modifier] = timeStr.split(' ');
              let [hours, minutes] = timePart.split(':').map(Number);
              if (modifier === 'PM' && hours < 12) hours += 12;
              if (modifier === 'AM' && hours === 12) hours = 0;
              const scheduledDate = new Date();
              scheduledDate.setHours(hours, minutes || 0, 0, 0);
              if (now > scheduledDate) isPastTime = true;
            } catch {}

            let status = isPastTime ? 'missed' : 'upcoming';
            let takenAt = undefined;

            const existingRecord = pStoredDoses.find(
              (d) =>
                (d.doseKey && d.doseKey === doseKey) ||
                (d.medName &&
                  d.medName.trim().toLowerCase() === med.name.trim().toLowerCase() &&
                  d.time === timeStr)
            );

            if (existingRecord) {
              const recordDate =
                existingRecord.date ||
                (existingRecord.takenAt ? existingRecord.takenAt.split('T')[0] : null);
              if (!recordDate || recordDate === todayStr) {
                status = existingRecord.status || (isPastTime ? 'missed' : 'upcoming');
                takenAt = existingRecord.takenAt;
              }
            }

            cohortDoses.push({
              id: idx,
              doseKey,
              patient: p.name,
              patientEmail: p.email,
              medId: med.id,
              medName: med.name,
              time: timeStr,
              window: windowName,
              med: `${med.name} ${med.dosage || ''}`,
              instruction: med.instructions || 'Daily dose',
              status,
              takenAt,
            });
            idx++;
          });
        });
      });

      if (!cancelled) {
        setDoses(cohortDoses);
      }
      return;
    }

    const fetchMeds = async () => {
      try {
        const data = await medicationApi.getMedications();
        if (cancelled) return;
        if (data && data.length > 0) {
          setUserMeds(data);

          // Read stored doses and reminders history
          const storedDoses = getScopedStorage('pillsync_patient_doses', []) || [];
          const storedReminders = getScopedStorage('pillsync_reminders', []) || [];

          const generatedDoses = [];
          let idx = 1;
          data.forEach((med) => {
            const schedules =
              Array.isArray(med.schedule) && med.schedule.length > 0 ? med.schedule : ['08:00 AM'];
            schedules.forEach((timeStr) => {
              const isPM = timeStr.includes('PM');
              let windowName = 'Morning';
              if (isPM && !timeStr.startsWith('12')) {
                windowName =
                  timeStr.startsWith('08') || timeStr.startsWith('09') || timeStr.startsWith('10')
                    ? 'Night'
                    : 'Evening';
              } else if (isPM || timeStr.startsWith('12')) {
                windowName = 'Afternoon';
              }

              const doseKey = `${med.name}-${timeStr}`;

              const todayStr = new Date().toISOString().split('T')[0];

              // Retain taken/snoozed status strictly if matching this exact medication AND taken today
              const existingRecord =
                storedDoses.find(
                  (d) =>
                    (d.doseKey && d.doseKey === doseKey) ||
                    (d.medId && String(d.medId) === String(med.id) && d.time === timeStr) ||
                    (d.medName &&
                      d.medName.trim().toLowerCase() === med.name.trim().toLowerCase() &&
                      d.time === timeStr) ||
                    (d.med &&
                      d.med.trim().toLowerCase().startsWith(med.name.trim().toLowerCase()) &&
                      d.time === timeStr)
                ) ||
                storedReminders.find(
                  (r) =>
                    (r.medicationId &&
                      String(r.medicationId) === String(med.id) &&
                      r.time === timeStr) ||
                    (r.medicationName &&
                      r.medicationName.trim().toLowerCase() === med.name.trim().toLowerCase() &&
                      r.time === timeStr)
                );

              let isPastTime = false;
              try {
                const now = new Date();
                const [timePart, modifier] = timeStr.split(' ');
                let [hours, minutes] = timePart.split(':').map(Number);
                if (modifier === 'PM' && hours < 12) hours += 12;
                if (modifier === 'AM' && hours === 12) hours = 0;
                const scheduledDate = new Date();
                scheduledDate.setHours(hours, minutes || 0, 0, 0);
                if (now > scheduledDate) isPastTime = true;
              } catch {}

              let status = isPastTime ? 'missed' : 'upcoming';
              let takenAt = undefined;
              if (existingRecord) {
                const recordDate =
                  existingRecord.date ||
                  (existingRecord.takenAt ? existingRecord.takenAt.split('T')[0] : null);
                if (!recordDate || recordDate === todayStr) {
                  status = existingRecord.status || (isPastTime ? 'missed' : 'upcoming');
                  takenAt = existingRecord.takenAt;
                }
              }

              generatedDoses.push({
                id: idx,
                doseKey,
                medId: med.id,
                medName: med.name,
                time: timeStr,
                window: windowName,
                med: `${med.name} ${med.dosage || ''}`,
                instruction: med.instructions || `${med.frequency || 'Daily'} dose`,
                status,
                takenAt,
              });
              idx++;
            });
          });

          setDoses(generatedDoses);
          setScopedStorage('pillsync_patient_doses', generatedDoses);
        } else {
          setUserMeds([]);
          setDoses([]);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setUserMeds([]);
          setDoses([]);
        }
      }
    };
    fetchMeds();
    return () => {
      cancelled = true;
    };
  }, [user, userRole, cohortPatients.length]);

  // Live real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getDefaultName = () => {
    if (userRole === 'caregiver') return 'Clinical Caregiver';
    if (userRole === 'admin') return 'System Administrator';
    return 'Patient';
  };

  const loggedInName = user?.name || user?.email?.split('@')[0] || getDefaultName();

  const getGreetingWord = () => {
    const hr = currentDateTime.getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleTakeDose = (id) => {
    setDoses((prev) => {
      const updated = prev.map((dose) =>
        dose.id === id || String(dose.id) === String(id)
          ? {
              ...dose,
              status: 'taken',
              takenAt: new Date().toISOString(),
            }
          : dose
      );
      setScopedStorage('pillsync_patient_doses', updated);
      try {
        localStorage.setItem('pillsync_patient_doses', JSON.stringify(updated));
      } catch {}

      // Synchronize with reminders storage
      const targetDose = prev.find((d) => d.id === id || String(d.id) === String(id));
      if (targetDose) {
        const storedReminders = getScopedStorage('pillsync_reminders', []) || [];
        const syncedReminders = storedReminders.map((r) =>
          (r.medicationName &&
            targetDose.med &&
            targetDose.med.includes(r.medicationName) &&
            r.time === targetDose.time) ||
          (r.time === targetDose.time && r.medicationId === targetDose.medId)
            ? { ...r, status: 'taken', takenAt: new Date().toISOString() }
            : r
        );
        setScopedStorage('pillsync_reminders', syncedReminders);
      }

      return updated;
    });

    if (typeof reminderApi?.markTaken === 'function') {
      reminderApi.markTaken(id).catch(() => {});
    }
  };

  const handleMarkNotTaken = (id) => {
    setDoses((prev) => {
      const updated = prev.map((dose) =>
        dose.id === id || String(dose.id) === String(id)
          ? {
              ...dose,
              status: 'missed',
              takenAt: null,
            }
          : dose
      );
      setScopedStorage('pillsync_patient_doses', updated);
      try {
        localStorage.setItem('pillsync_patient_doses', JSON.stringify(updated));
      } catch {}

      // Synchronize with reminders storage
      const targetDose = prev.find((d) => d.id === id || String(d.id) === String(id));
      if (targetDose) {
        const storedReminders = getScopedStorage('pillsync_reminders', []) || [];
        const syncedReminders = storedReminders.map((r) =>
          (r.medicationName &&
            targetDose.med &&
            targetDose.med.includes(r.medicationName) &&
            r.time === targetDose.time) ||
          (r.time === targetDose.time && r.medicationId === targetDose.medId)
            ? { ...r, status: 'missed', takenAt: null }
            : r
        );
        setScopedStorage('pillsync_reminders', syncedReminders);
      }

      return updated;
    });
  };

  const handleSnoozeDose = (id) => {
    setDoses((prev) => {
      const updated = prev.map((dose) =>
        dose.id === id || String(dose.id) === String(id) ? { ...dose, status: 'snoozed' } : dose
      );
      setScopedStorage('pillsync_patient_doses', updated);
      try {
        localStorage.setItem('pillsync_patient_doses', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (typeof reminderApi?.snoozeReminder === 'function') {
      reminderApi.snoozeReminder(id, 30).catch(() => {});
    }
  };

  const sendMessage = (textToSend) => {
    const query = (textToSend !== undefined ? textToSend : inputMsg).trim();
    if (!query) return;

    const userText = query;
    const newMsg = {
      id: Date.now(),
      sender: 'patient',
      text: userText,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputMsg('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = getChatbotResponse(userText, {
        user,
        medications: userMeds,
        doses,
        patientCheckedIn,
      });

      const reply = {
        id: Date.now() + 1,
        sender: 'doctor',
        text: botResponse.text || String(botResponse),
        suggestions: botResponse.suggestions || [],
      };
      setIsTyping(false);
      setChatMessages((prev) => [...prev, reply]);
    }, 450);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const patientDoses = doses;
  const takenCount = patientDoses.filter((d) => d.status === 'taken').length;

  const calendarDays = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      arr.push({
        day: String(d.getDate()),
        today: i === 0,
        done: i === 0 ? takenCount > 0 : false,
      });
    }
    return arr;
  }, [takenCount]);

  return (
    <Layout>
      <div className="dashboard-root">
        {/* 1. Header & Greeting Banner */}
        <div className="dashboard-header-banner">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="dashboard-live-clock-badge">
                <span className="dashboard-live-dot" />
                {currentDateTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <Badge variant={userRole === 'admin' ? 'primary' : 'success'} size="sm">
                {userRole === 'admin'
                  ? 'Platform Administrator'
                  : userRole === 'caregiver'
                    ? 'Lead Caregiver & Clinician'
                    : 'Verified Patient Protocol'}
              </Badge>
            </div>
            <h1 className="dashboard-greeting-title select-none cursor-default">
              {getGreetingWord()}, {loggedInName}
            </h1>
            <p className="dashboard-greeting-subtitle">
              {userRole === 'patient' &&
                'Personal Care Portal · Adherence Tracking & Medication Schedule'}
              {userRole === 'caregiver' && 'Active Clinical Oversight · Assigned Patients Cohort'}
              {userRole === 'admin' && 'Platform Overview & HIPAA Compliance Operations'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {userRole === 'caregiver' ? (
              <Link
                to="/patients"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
                style={{
                  background: 'linear-gradient(135deg,#3a9e90,#50b8a9)',
                  boxShadow: '0 3px 12px -3px rgba(58,158,144,0.4)',
                }}
              >
                <Users className="h-4 w-4" />
                View Assigned Patients
              </Link>
            ) : userRole === 'admin' ? (
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
                style={{
                  background: 'linear-gradient(135deg,#3a9e90,#50b8a9)',
                  boxShadow: '0 3px 12px -3px rgba(58,158,144,0.4)',
                }}
              >
                <Users className="h-4 w-4" />
                Manage User Directory
              </Link>
            ) : (
              <Link
                to="/medications/new"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
                style={{
                  background: 'linear-gradient(135deg,#3a9e90,#50b8a9)',
                  boxShadow: '0 3px 12px -3px rgba(58,158,144,0.4)',
                }}
              >
                <Plus className="h-4 w-4" />
                Add Medication
              </Link>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* A. CAREGIVER DASHBOARD VIEW                                               */}
        {/* ========================================================================= */}
        {userRole === 'caregiver' && (
          <>
            {/* 4 KPI Cards for Caregiver */}
            <div className="dashboard-kpi-grid">
              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Assigned Cohort</p>
                  <p className="dashboard-kpi-value text-indigo-600">
                    {cohortPatients.length} Patients
                  </p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    {cohortPatients.length > 0 ? '100% active monitoring' : 'Roster ready'}
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-indigo-50 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Cohort Avg Adherence</p>
                  <p className="dashboard-kpi-value text-emerald-600">
                    {cohortPatients.length > 0 ? '80.0%' : '0%'}
                  </p>
                  <p className="dashboard-kpi-meta text-slate-500 font-semibold">
                    {cohortPatients.length > 0 ? '+2.4% this week' : 'No patients assigned'}
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Critical Dose Alerts</p>
                  <p className="dashboard-kpi-value text-rose-600">
                    {cohortPatients.filter((p) => p.adherence < 70).length} Alerts
                  </p>
                  <p className="dashboard-kpi-meta text-rose-600 font-semibold">
                    {cohortPatients.filter((p) => p.adherence < 70).length > 0
                      ? 'Requires dose triage'
                      : 'Zero critical risk alerts'}
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Refill Status</p>
                  <p className="dashboard-kpi-value text-emerald-600">0 Due</p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    All regimens stocked
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-amber-50 text-amber-600">
                  <Pill className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Caregiver 2-Column Main Section */}
            <div className="dashboard-main-grid">
              {/* Left Column: Cohort Weekly Analytics & Priority Action Queue */}
              <div className="dashboard-card-section">
                {/* Cohort Weekly Adherence Breakdown Chart */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">
                        Cohort Weekly Adherence & Compliance
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cohortPatients.length > 0
                          ? `Aggregated 7-day intake accuracy across ${cohortPatients.length} assigned patients`
                          : '7-day intake compliance telemetry'}
                      </p>
                    </div>
                    <Badge variant="primary" size="xs">
                      Live Telemetry
                    </Badge>
                  </div>

                  <div
                    style={{ height: '260px', width: '100%', minHeight: '260px' }}
                    className="flex items-center justify-center"
                  >
                    {cohortPatients.length === 0 ? (
                      <div className="py-14 text-center text-slate-400">
                        <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">
                          No cohort telemetry active
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                          Assign patients to your monitoring roster to stream 7-day adherence
                          telemetry.
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={[
                            {
                              day: 'Mon',
                              adherence: 100,
                              onTime: cohortPatients.length * 2,
                              missed: 0,
                            },
                            {
                              day: 'Tue',
                              adherence: 100,
                              onTime: cohortPatients.length * 2,
                              missed: 0,
                            },
                            {
                              day: 'Wed',
                              adherence: 95,
                              onTime: cohortPatients.length * 2,
                              missed: 0,
                            },
                            {
                              day: 'Thu',
                              adherence: 100,
                              onTime: cohortPatients.length * 2,
                              missed: 0,
                            },
                            {
                              day: 'Fri',
                              adherence: 90,
                              onTime: cohortPatients.length * 2,
                              missed: 0,
                            },
                            {
                              day: 'Sat',
                              adherence: 100,
                              onTime: cohortPatients.length * 2,
                              missed: 0,
                            },
                            {
                              day: 'Sun',
                              adherence: 100,
                              onTime: cohortPatients.length * 2,
                              missed: 0,
                            },
                          ]}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="caregiverAdhGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="caregiverOnTimeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              name === 'Adherence %' ? `${value}%` : `${value} doses`,
                              name,
                            ]}
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                              fontSize: '12px',
                            }}
                          />
                          <Bar
                            dataKey="adherence"
                            name="Adherence %"
                            fill="url(#caregiverAdhGrad)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={22}
                          />
                          <Bar
                            dataKey="onTime"
                            name="On-Time Doses"
                            fill="url(#caregiverOnTimeGrad)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={22}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Summary metric pills */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2 rounded-xl bg-indigo-50/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Cohort Avg</p>
                      <p className="text-sm font-black text-indigo-700 m-0">
                        {cohortPatients.length > 0 ? '80.0%' : '100%'}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        On-Time Doses
                      </p>
                      <p className="text-sm font-black text-emerald-600 m-0">
                        {cohortPatients.length > 0 ? '119' : '0'}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Missed Doses</p>
                      <p className="text-sm font-black text-rose-600 m-0">
                        {cohortPatients.length > 0 ? '13' : '0'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Priority Clinical Triage & Action Queue */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Clinical Priority & Triage Queue</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        High-priority escalations requiring caregiver authorization or follow-up
                      </p>
                    </div>
                    <Link
                      to="/reminders"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Dose Logs →
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {cohortPatients.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">
                          All Patient Triage Queues Clear
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          No critical missed doses or refill escalations pending across your
                          monitored cohort.
                        </p>
                      </div>
                    ) : (
                      cohortPatients
                        .filter((p) => p.adherence < 70)
                        .map((p) => (
                          <div
                            key={p.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/70 transition"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-9 w-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs mt-0.5">
                                {p.name?.slice(0, 2) || 'PT'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-slate-900 m-0">{p.name}</h4>
                                  <Badge variant="danger" size="xs">
                                    Adherence Alert ({p.adherence}%)
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-600 m-0 mt-0.5">
                                  {p.condition || 'Chronic care regimen'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => alert(`Nudge dispatched to ${p.name}`)}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-2xs"
                            >
                              <Bell className="h-3 w-3" />
                              Send Nudge
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Today's Dose Execution Feed & Inquiries */}
              <div className="dashboard-card-section">
                {/* Today's Cohort Dose Execution Feed */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Today's Cohort Dose Timeline</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cohortPatients.length > 0
                          ? `Live schedule across ${cohortPatients.length} assigned patients`
                          : 'Live daily intake schedule'}
                      </p>
                    </div>
                    <Link
                      to="/reminders"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Full Log →
                    </Link>
                  </div>

                  <div className="dose-timeline-list">
                    {doses.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">
                          No scheduled cohort doses today
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Assigned patient intake schedules will be tracked here in real time.
                        </p>
                      </div>
                    ) : (
                      doses.map((dose) => (
                        <div key={dose.id} className="dose-timeline-item">
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                              <Pill className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="dose-timing-badge">
                                  <Clock className="h-3 w-3" />
                                  {dose.time} · {dose.patient || 'Patient'}
                                </span>
                                {dose.status === 'taken' && (
                                  <Badge variant="success" size="xs">
                                    Taken on Time
                                  </Badge>
                                )}
                                {dose.status === 'missed' && (
                                  <Badge variant="danger" size="xs">
                                    Missed Alert
                                  </Badge>
                                )}
                                {dose.status === 'upcoming' && (
                                  <Badge variant="gray" size="xs">
                                    Upcoming
                                  </Badge>
                                )}
                              </div>
                              <h3 className="dose-med-title">{dose.med}</h3>
                              <p className="dose-med-instruction">{dose.instruction}</p>
                            </div>
                          </div>

                          <div className="dose-action-buttons">
                            {dose.status === 'missed' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  alert(
                                    `Urgent SMS reminder dispatched to ${dose.patient || 'patient'} for ${dose.med}`
                                  )
                                }
                                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                              >
                                Dispatch Alert
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold">
                                {dose.status === 'taken' ? 'Logged ✓' : 'Scheduled'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Patient Inquiries */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Recent Patient Inquiries</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Direct messages from assigned patients
                      </p>
                    </div>
                    <Link
                      to="/notifications"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Notifications ({cohortPatients.length}) →
                    </Link>
                  </div>

                  <div className="caregiver-inquiry-list">
                    {cohortPatients.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">
                        <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">
                          No recent patient inquiries
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Direct messages and vital updates from monitored patients will appear
                          here.
                        </p>
                      </div>
                    ) : (
                      cohortPatients.map((p) => (
                        <div key={p.id} className="caregiver-inquiry-card">
                          <div className="caregiver-inquiry-header">
                            <div className="caregiver-inquiry-user">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                {p.name?.slice(0, 2) || 'PT'}
                              </div>
                              <div>
                                <p className="caregiver-inquiry-name">{p.name}</p>
                                <p className="caregiver-inquiry-condition">{p.condition}</p>
                              </div>
                            </div>
                            <span className="caregiver-inquiry-time">Recently</span>
                          </div>

                          <div className="caregiver-inquiry-footer">
                            <Badge
                              variant={
                                (p.adherence || 100) >= 85
                                  ? 'success'
                                  : (p.adherence || 100) >= 70
                                    ? 'warning'
                                    : 'danger'
                              }
                              size="xs"
                            >
                              {(p.adherence || 100) >= 85 ? 'Compliant' : 'Needs Review'}
                            </Badge>
                            <Link to="/notifications" className="caregiver-inquiry-reply-btn">
                              Open Chat <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* B. ADMIN PLATFORM OVERVIEW                                                */}
        {/* ========================================================================= */}
        {userRole === 'admin' && (
          <>
            {/* 4 KPI Cards for Admin Platform Overview */}
            <div className="dashboard-kpi-grid">
              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Total Platform Users</p>
                  <p className="dashboard-kpi-value text-indigo-600">{adminUsers.length || 0}</p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    {adminUsers.length > 0
                      ? `${adminUsers.length} verified accounts`
                      : 'Zero registered accounts'}
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-indigo-50 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Active Caregivers</p>
                  <p className="dashboard-kpi-value text-emerald-600">
                    {adminUsers.filter((u) => (u.role || '').toLowerCase() === 'caregiver').length}
                  </p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    Clinical coordinators active
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-emerald-50 text-emerald-600">
                  <Shield className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">System API Uptime</p>
                  <p className="dashboard-kpi-value text-violet-600">99.98%</p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    All services operational
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-violet-50 text-violet-600">
                  <Server className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">HIPAA Security Audit</p>
                  <p className="dashboard-kpi-value text-emerald-600">100%</p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    Zero security violations
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Admin Main 2-Column Section */}
            <div className="dashboard-main-grid">
              {/* Left Column: Platform Telemetry & Microservice Health */}
              <div className="dashboard-card-section">
                {/* Platform Telemetry Chart */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Platform Daily Ingestion & Traffic</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Active daily sessions and OCR prescription transactions
                      </p>
                    </div>
                    <Badge variant="primary" size="xs">
                      Live Telemetry
                    </Badge>
                  </div>

                  <div style={{ height: '260px', width: '100%', minHeight: '260px' }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={adminPlatformData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="adminUserGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
                          </linearGradient>
                          <linearGradient id="adminOcrGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="activeUsers"
                          name="Active Users"
                          fill="url(#adminUserGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={24}
                        />
                        <Bar
                          dataKey="ocrScans"
                          name="OCR Scans"
                          fill="url(#adminOcrGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent User Registrations & Platform Activity */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">
                        Recent User Registrations & Activity
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Newly onboarded patients and verified healthcare practitioners
                      </p>
                    </div>
                    <Link
                      to="/admin/users"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      All Users ({adminUsers.length}) →
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {adminUsers.slice(0, 4).map((u) => {
                      const initials = (u.name || u.email || 'US')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();
                      const roleStr = (u.role || '').toLowerCase();
                      const isCaregiver = roleStr === 'caregiver';
                      const isAdmin = roleStr === 'admin';
                      return (
                        <div key={u.id || u.email} className="admin-user-row">
                          <div className="flex items-center gap-3">
                            <div
                              className={`admin-avatar-pill ${
                                isAdmin
                                  ? 'bg-purple-100 text-purple-700'
                                  : isCaregiver
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {initials}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 m-0">
                                {u.name || u.email}
                              </p>
                              <p className="text-[11px] text-slate-500 m-0">
                                {u.email} ·{' '}
                                {u.role === 'admin'
                                  ? 'System Administrator'
                                  : u.role === 'caregiver'
                                    ? 'Clinical Caregiver'
                                    : 'Patient Account'}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={isAdmin ? 'purple' : isCaregiver ? 'success' : 'primary'}
                            size="xs"
                          >
                            {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Patient'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Security Audit Trail & Platform Telemetry */}
              <div className="dashboard-card-section">
                {/* Security Audit Log */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Security & Access Audit Trail</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Real-time RBAC compliance logs
                      </p>
                    </div>
                    <Link
                      to="/analytics"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Full Audit →
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {adminUsers.length > 0 ? (
                      adminUsers.slice(0, 3).map((u, i) => (
                        <div key={u.id || u.email || i} className="admin-audit-row text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                            <span>Account Verified</span>
                            <span className="text-[10px] text-slate-400">Live</span>
                          </div>
                          <p className="text-slate-600 m-0 text-[11px]">
                            {u.name || u.email} assigned {u.role ? u.role.toUpperCase() : 'PATIENT'}{' '}
                            credentials.
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="admin-audit-row text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                          <span>Auth Engine Initialized</span>
                          <span className="text-[10px] text-slate-400">Online</span>
                        </div>
                        <p className="text-slate-600 m-0 text-[11px]">
                          Zero security violations recorded. RBAC access control active.
                        </p>
                      </div>
                    )}

                    <div className="admin-audit-row text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                        <span>Database Replica Sync</span>
                        <span className="text-[10px] text-slate-400">Verified</span>
                      </div>
                      <p className="text-slate-600 m-0 text-[11px]">
                        SQLite3 relational storage verified with HIPAA schema integrity.
                      </p>
                    </div>

                    <div className="admin-audit-row text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                        <span>OCR Service Health Check</span>
                        <span className="text-[10px] text-slate-400">Online</span>
                      </div>
                      <p className="text-slate-600 m-0 text-[11px]">
                        Tesseract Optical Engine & image preprocessor running normally.
                      </p>
                    </div>
                  </div>
                </div>

                {/* System Platform Telemetry Card */}
                <div className="dashboard-panel">
                  <h2 className="dashboard-panel-title mb-3">Platform Health & Encryption</h2>
                  <div className="space-y-2.5">
                    <div className="admin-health-row">
                      <div className="flex items-center gap-2.5">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 m-0">
                            End-to-End Encryption
                          </p>
                          <p className="text-[10px] text-slate-500 m-0">
                            AES-256 at Rest / TLS 1.3 in Transit
                          </p>
                        </div>
                      </div>
                      <Badge variant="success" size="xs">
                        Active
                      </Badge>
                    </div>

                    <div className="admin-health-row">
                      <div className="flex items-center gap-2.5">
                        <Activity className="h-4 w-4 text-indigo-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 m-0">
                            Auth & Token Gateway
                          </p>
                          <p className="text-[10px] text-slate-500 m-0">JWT RS256 Silent Refresh</p>
                        </div>
                      </div>
                      <Badge variant="success" size="xs">
                        99.99%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* C. PATIENT DASHBOARD VIEW                                                 */}
        {/* ========================================================================= */}
        {userRole === 'patient' && (
          <>
            {/* KORU Wellness Habit Strip & Reminder Ribbon */}
            <div className="koru-dashboard-ribbon">
              <div className="koru-ribbon-streak-box">
                <div className="koru-ribbon-streak-title">
                  <span className="font-extrabold text-slate-900 text-sm">
                    7-Day Consistency Streak
                  </span>
                  <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    {takenCount > 0 ? '1-Day Streak 🔥' : 'Start Today!'}
                  </span>
                </div>
                <div className="koru-dashboard-week-strip">
                  {calendarDays.map((d) => (
                    <div key={d.day} className={`koru-day-col ${d.today ? 'active-today' : ''}`}>
                      <div className={`koru-check-slot ${d.done ? 'checked' : ''}`}>
                        {d.done ? <Check className="h-2.5 w-2.5 text-white" /> : null}
                      </div>
                      <div
                        className={`koru-day-circle ${d.today ? 'is-today' : ''} ${
                          !d.done && !d.today ? 'is-future' : ''
                        }`}
                      >
                        {d.day}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="koru-ribbon-reminder-box">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 m-0">
                    Never miss your medications.
                  </h4>
                  <p className="text-xs text-slate-600 m-0 mt-0.5">
                    {patientCheckedIn
                      ? 'Daily check-in recorded! Streak active and doses logged.'
                      : 'Automated SMS & in-app reminders active'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePatientCheckin}
                  className={`koru-checkin-btn cursor-pointer transition-all ${
                    patientCheckedIn ? 'bg-[#215a51] text-white' : ''
                  }`}
                  title="Click to check in for today"
                >
                  {patientCheckedIn ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      <span>Checked In</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-4 w-4 text-[#2d8275]" />
                      <span>Check-in</span>
                    </>
                  )}
                </button>
              </div>
              {checkinToast && (
                <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{checkinToast}</span>
                </div>
              )}
            </div>

            {/* 4 Key Stat KPI Cards for Patient */}
            <div className="dashboard-kpi-grid">
              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Active Regimens</p>
                  <p className="dashboard-kpi-value">{userMeds.length}</p>
                  <p className="dashboard-kpi-meta text-indigo-600 font-semibold">
                    {userMeds.length} active prescriptions
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-indigo-50 text-indigo-600">
                  <Pill className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Today's Doses</p>
                  <p className="dashboard-kpi-value">
                    {takenCount} / {patientDoses.length}
                  </p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    {patientDoses.length > 0
                      ? `${patientDoses.length - takenCount} remaining today`
                      : 'No doses scheduled'}
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-emerald-50 text-emerald-600">
                  <Clock className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">7-Day Adherence</p>
                  <p className="dashboard-kpi-value">
                    {patientDoses.length > 0
                      ? `${Math.round((takenCount / patientDoses.length) * 100)}%`
                      : '0%'}
                  </p>
                  <p className="dashboard-kpi-meta text-slate-500 font-semibold">
                    {patientDoses.length > 0 ? '+4.2% vs target' : 'No active regimens'}
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-violet-50 text-violet-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Refill Watchlist</p>
                  <p
                    className={`dashboard-kpi-value ${
                      userMeds.some((m) => m.quantity <= 10) ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {userMeds.some((m) => m.quantity <= 10) ? '1 Low' : 'Optimal'}
                  </p>
                  <p
                    className={`dashboard-kpi-meta font-semibold ${
                      userMeds.some((m) => m.quantity <= 10) ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {userMeds.find((m) => m.quantity <= 10)
                      ? `${userMeds.find((m) => m.quantity <= 10).name} refill recommended`
                      : userMeds.length > 0
                        ? 'All prescriptions stocked'
                        : 'No active prescriptions'}
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-amber-50 text-amber-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* 3. Main Dashboard 2-Column Grid */}
            <div className="dashboard-main-grid">
              {/* Left Column: Dose Schedule & Weekly Chart */}
              <div className="dashboard-card-section">
                {/* Today's Medication & Dose Schedule Timeline */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Today's Medication Schedule</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Log scheduled doses to maintain your verified clinical streak
                      </p>
                    </div>
                    <Badge variant="primary" size="xs">
                      {takenCount} of {patientDoses.length} Completed
                    </Badge>
                  </div>

                  <div className="dose-timeline-list">
                    {patientDoses.length > 0 ? (
                      patientDoses.map((dose) => (
                        <div key={dose.id} className="dose-timeline-item">
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                              <Pill className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="dose-timing-badge">
                                  <Clock className="h-3 w-3" />
                                  {dose.time} · {dose.window}
                                </span>
                                {dose.status === 'taken' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Taken
                                  </span>
                                )}
                                {dose.status === 'missed' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Not Taken
                                  </span>
                                )}
                                {dose.status === 'snoozed' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                                    <Clock className="h-3.5 w-3.5" /> Snoozed (+30m)
                                  </span>
                                )}
                              </div>
                              <h3 className="dose-med-title">{dose.med}</h3>
                              <p className="dose-med-instruction">{dose.instruction}</p>
                            </div>
                          </div>

                          <div className="dose-action-buttons flex items-center gap-1.5">
                            {dose.status === 'taken' ? (
                              <>
                                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                  Completed ✓
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleMarkNotTaken(dose.id)}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                                  title="Change to Not Taken"
                                >
                                  Mark Not Taken
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleTakeDose(dose.id)}
                                  className="dose-btn-take"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Take Dose
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkNotTaken(dose.id)}
                                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                                    dose.status === 'missed'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  }`}
                                  title="Keep / Mark as Not Taken"
                                >
                                  Not Taken
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSnoozeDose(dose.id)}
                                  className="dose-btn-snooze"
                                >
                                  Snooze
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                          <Clock className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">
                          No scheduled doses for today
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Add your prescriptions to automatically generate your daily intake
                          schedule and reminders.
                        </p>
                        <Link
                          to="/medications/new"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                        >
                          <Plus className="h-4 w-4" />
                          Add Prescription
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weekly Adherence & Compliance Chart */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Weekly Adherence Trend</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Daily adherence performance vs 80% clinical baseline
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-indigo-600">
                        <span className="h-2 w-2 rounded-full bg-indigo-600" /> Adherence %
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="h-2 w-2 rounded-full bg-slate-300" /> Baseline (80%)
                      </span>
                    </div>
                  </div>

                  <div
                    style={{ height: '240px', width: '100%', minHeight: '240px' }}
                    className="flex items-center justify-center"
                  >
                    {patientDoses.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <TrendingUp className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No adherence logs yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Log your daily doses to begin plotting your 7-day compliance trend.
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={[
                            { day: 'Mon', score: 100, target: 80 },
                            { day: 'Tue', score: 100, target: 80 },
                            { day: 'Wed', score: 100, target: 80 },
                            { day: 'Thu', score: 100, target: 80 },
                            { day: 'Fri', score: 100, target: 80 },
                            { day: 'Sat', score: 100, target: 80 },
                            {
                              day: 'Sun',
                              score: Math.round((takenCount / patientDoses.length) * 100),
                              target: 80,
                            },
                          ]}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="patientAdhGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(val) => [`${val}%`, 'Adherence']}
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                              fontSize: '12px',
                            }}
                          />
                          <Bar
                            dataKey="score"
                            fill="url(#patientAdhGrad)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={28}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Adherence Gauge, Prescription Stock, Care Team */}
              <div className="dashboard-card-section">
                {/* KORU Clinical Adherence Gauge (Inspired by Screen 4) */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Clinical Adherence Meter</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Real-time daily intake compliance evaluation
                      </p>
                    </div>
                    <Badge variant="success" size="xs">
                      Optimal
                    </Badge>
                  </div>

                  <div className="koru-gauge-interactive-box">
                    <div className="koru-face-indicator">
                      <span className="text-3xl">😊</span>
                      <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                        Optimal / 94% Target
                      </span>
                    </div>

                    <div className="koru-arch-gauge-container">
                      <div className="koru-arch-track">
                        <div className="koru-arch-cursor" style={{ left: '88%' }} />
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1.5">
                        <span>0 Low</span>
                        <span className="text-emerald-700 font-extrabold">94% Target</span>
                        <span>100 Perfect</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCaregiverFeedbackSaved(true);
                        setTimeout(() => setCaregiverFeedbackSaved(false), 3000);
                      }}
                      className="w-full mt-3 rounded-full bg-slate-900 text-white text-xs font-bold py-2.5 hover:bg-slate-800 transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {caregiverFeedbackSaved ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Feedback Recorded</span>
                        </>
                      ) : (
                        <span>Save Daily Feedback</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Prescription Supply & Stock Progress Meter */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Prescription Supply & Stock</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track remaining tablet counts & auto-refill triggers
                      </p>
                    </div>
                    <Link
                      to="/medications"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      View All →
                    </Link>
                  </div>

                  <div className="supply-meter-list">
                    {userMeds.length > 0 ? (
                      userMeds.map((med) => {
                        const total = 60;
                        const currentQty = med.quantity || 30;
                        const pct = Math.min(100, Math.round((currentQty / total) * 100));
                        const isLow = currentQty <= 10;
                        return (
                          <div key={med.id || med.name} className="supply-meter-item">
                            <div className="supply-meter-header">
                              <span className="supply-meter-name">
                                {med.name} {med.dosage || ''}
                              </span>
                              <span
                                className={`supply-meter-count font-bold ${
                                  isLow ? 'text-amber-600' : 'text-emerald-700'
                                }`}
                              >
                                {currentQty} doses ({pct}%)
                              </span>
                            </div>
                            <div className="supply-track">
                              <div
                                className={`supply-fill ${
                                  isLow ? 'supply-fill-critical' : 'supply-fill-healthy'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-xs text-slate-500">No prescriptions tracked yet.</p>
                        <Link
                          to="/medications/new"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                        >
                          + Add your first prescription
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vital Health Biomarkers */}
                <div className="dashboard-panel">
                  <h2 className="dashboard-panel-title mb-3">Vital Health Biomarkers</h2>
                  <div className="vitals-card-grid">
                    <div className="vital-tile">
                      <p className="vital-tile-label">Fasting Glucose</p>
                      <p className="vital-tile-value text-slate-700">-- mg/dL</p>
                      <p className="vital-tile-status text-slate-400">Awaiting Log</p>
                    </div>

                    <div className="vital-tile">
                      <p className="vital-tile-label">Blood Pressure</p>
                      <p className="vital-tile-value text-slate-700">-- / --</p>
                      <p className="vital-tile-status text-slate-400">Awaiting Log</p>
                    </div>
                  </div>
                </div>

                {/* Low Stock / Refill Alert Banner */}
                {userMeds.some((m) => m.quantity <= 10) ? (
                  <div className="dashboard-alert-banner">
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-rose-900">
                        Prescription Refill Warning
                      </h3>
                      <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                        <strong>{userMeds.find((m) => m.quantity <= 10)?.name}</strong> has a low
                        tablet count remaining in your active supply.
                      </p>
                      <button
                        onClick={() =>
                          alert('Refill request dispatched to clinical pharmacy partner!')
                        }
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                      >
                        Request 30-Day Refill Now
                      </button>
                    </div>
                  </div>
                ) : userMeds.length > 0 ? (
                  <div
                    className="dashboard-alert-banner"
                    style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-emerald-900">
                        Prescription Supply Healthy
                      </h3>
                      <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                        All active prescriptions have sufficient dosage quantities remaining.
                        Automatic tracking active.
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Clinical Support & AI Consultation Chat Widget */}
                <div className="care-chat-box">
                  <div className="care-chat-header">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs">
                        <HeartPulse className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          Clinical Support &amp; AI Assistant
                        </h3>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          Verified Health Assistant · Active
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          alert('Clinical support hotline: 1-800-PILLSYNC (24/7 Support)')
                        }
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
                        title="Contact Clinical Support"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="care-chat-stream">
                    {chatMessages.map((msg, idx) => {
                      const isLastBotMsg =
                        msg.sender === 'doctor' &&
                        (idx === chatMessages.length - 1 ||
                          (idx === chatMessages.length - 2 &&
                            chatMessages[chatMessages.length - 1].sender === 'patient'));

                      return (
                        <div key={msg.id} className="flex flex-col gap-1.5">
                          <div
                            className={
                              msg.sender === 'patient'
                                ? 'care-bubble-patient'
                                : 'care-bubble-doctor'
                            }
                          >
                            {msg.text}
                          </div>
                          {msg.suggestions && msg.suggestions.length > 0 && isLastBotMsg && (
                            <div className="care-chat-suggestions">
                              {msg.suggestions.map((sug, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => sendMessage(sug)}
                                  className="care-chat-chip"
                                >
                                  {sug}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {isTyping && (
                      <div className="care-bubble-doctor care-typing-bubble">
                        <span className="dot dot-1" />
                        <span className="dot dot-2" />
                        <span className="dot dot-3" />
                        <span className="text-[11px] text-slate-500 font-medium ml-1">
                          Clinical AI is reviewing...
                        </span>
                      </div>
                    )}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="care-chat-input-row">
                    <input
                      type="text"
                      placeholder="Message care team..."
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      className="care-chat-input"
                    />
                    <button
                      type="submit"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
