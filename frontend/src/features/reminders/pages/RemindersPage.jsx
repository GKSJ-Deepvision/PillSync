import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { reminderApi } from '../../../api/reminders';
import { setScopedStorage, getScopedStorage } from '../../../utils/userStorage';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { EmptyState, CardSkeleton, Alert } from '../../../components/common';
import { Clock, CheckCircle, Calendar, Users, Phone, Bell, ShieldCheck } from 'lucide-react';
import { playDoseAlertChime, dispatchNativeDoseAlert } from '../../../utils/audioChime';
import { getCohortPatients, getCohortPatientNames } from '../../../utils/cohort';
import './RemindersPage.css';

export function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState('All Patients');

  const userRole = (user?.role || 'patient').toLowerCase();
  const isCaregiver = userRole === 'caregiver' || userRole === 'admin';
  const [cohortPatients, setCohortPatients] = useState(() => getCohortPatientNames(user));

  useEffect(() => {
    setCohortPatients(getCohortPatientNames(user));
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const loadReminders = async () => {
      try {
        if (userRole === 'caregiver') {
          const cohort = getCohortPatients(user);
          // If caregiver has no assigned patients, reminders list is strictly empty
          if (cohort.length === 0) {
            if (!cancelled) {
              setReminders([]);
            }
            return;
          }

          // Gather reminders across all assigned cohort patients
          const cohortReminders = [];
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

            let pStoredReminders = [];
            try {
              const rawRem = localStorage.getItem(`pillsync_reminders_${pKey}`);
              if (rawRem) pStoredReminders = JSON.parse(rawRem);
            } catch {}

            const todayStr = new Date().toISOString().split('T')[0];

            if (Array.isArray(pMeds) && pMeds.length > 0) {
              pMeds.forEach((m) => {
                const schedules =
                  Array.isArray(m.schedule) && m.schedule.length > 0 ? m.schedule : ['08:00 AM'];
                schedules.forEach((timeStr) => {
                  const genId = `rem-${p.id || p.name}-${m.id || m.name}-${timeStr.replace(/[^a-zA-Z0-9]/g, '')}`;
                  const existing = pStoredReminders.find(
                    (er) =>
                      String(er.id) === String(genId) ||
                      (er.medicationName &&
                        er.medicationName.trim().toLowerCase() === m.name.trim().toLowerCase() &&
                        er.time === timeStr)
                  );
                  cohortReminders.push({
                    id: genId,
                    patient: p.name,
                    patientEmail: p.email,
                    medicationId: m.id,
                    medicationName: `${m.name} ${m.dosage || ''}`.trim(),
                    dosage: m.dosage || '',
                    time: timeStr,
                    schedule: timeStr.includes('PM') ? 'Evening' : 'Morning',
                    date: todayStr,
                    status: existing?.status || 'upcoming',
                    instructions: m.instructions || 'Daily dose',
                  });
                });
              });
            }
          });

          if (!cancelled) {
            setReminders(cohortReminders);
          }
          return;
        }

        const data = await reminderApi.getReminders();
        if (!cancelled) {
          setReminders(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to fetch reminders');
        }
        console.error(err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReminders();

    return () => {
      cancelled = true;
    };
  }, [user, userRole]);

  const handleMarkTaken = async (id) => {
    try {
      setError('');
      setActioningId(id);

      // Immediately update component state and persist to persistent storage
      setReminders((current) => {
        const updated = current.map((reminder) =>
          String(reminder.id) === String(id) || reminder.id === id
            ? {
                ...reminder,
                status: 'taken',
                loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            : reminder
        );
        setScopedStorage('pillsync_reminders', updated);
        try {
          localStorage.setItem('pillsync_reminders', JSON.stringify(updated));
        } catch {}

        // Sync with dashboard doses
        const targetReminder = current.find((r) => String(r.id) === String(id) || r.id === id);
        if (targetReminder) {
          const storedDoses = getScopedStorage('pillsync_patient_doses', []) || [];
          const syncedDoses = storedDoses.map((d) =>
            (d.med &&
              targetReminder.medicationName &&
              d.med.includes(targetReminder.medicationName) &&
              d.time === targetReminder.time) ||
            (d.time === targetReminder.time && d.medId === targetReminder.medicationId)
              ? { ...d, status: 'taken', takenAt: new Date().toISOString() }
              : d
          );
          setScopedStorage('pillsync_patient_doses', syncedDoses);
          try {
            localStorage.setItem('pillsync_patient_doses', JSON.stringify(syncedDoses));
          } catch {}
        }
        return updated;
      });

      // Call API client
      playDoseAlertChime();
      if (typeof reminderApi.markAsTaken === 'function') {
        await reminderApi.markAsTaken(id);
      } else if (typeof reminderApi.markTaken === 'function') {
        await reminderApi.markTaken(id);
      }
    } catch (err) {
      console.error('Error updating dose status:', err);
    } finally {
      setActioningId(null);
    }
  };

  const handleSnooze = async (id) => {
    try {
      setError('');
      setActioningId(id);

      dispatchNativeDoseAlert(
        'Dose Snoozed (15m)',
        'Reminder snoozed for 15 minutes. PillSync will chime again soon.'
      );

      setReminders((current) => {
        const updated = current.map((reminder) =>
          String(reminder.id) === String(id) || reminder.id === id
            ? { ...reminder, status: 'snoozed' }
            : reminder
        );
        setScopedStorage('pillsync_reminders', updated);
        try {
          localStorage.setItem('pillsync_reminders', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (typeof reminderApi.snoozeReminder === 'function') {
        await reminderApi.snoozeReminder(id, 30);
      }
    } catch (err) {
      console.error('Error snoozing reminder:', err);
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkNotTaken = async (id) => {
    try {
      setError('');
      setActioningId(id);
      setReminders((current) => {
        const updated = current.map((reminder) =>
          String(reminder.id) === String(id) || reminder.id === id
            ? {
                ...reminder,
                status: 'missed',
                loggedAt: null,
              }
            : reminder
        );
        setScopedStorage('pillsync_reminders', updated);
        try {
          localStorage.setItem('pillsync_reminders', JSON.stringify(updated));
        } catch {}

        // Sync with dashboard doses
        const targetReminder = current.find((r) => String(r.id) === String(id) || r.id === id);
        if (targetReminder) {
          const storedDoses = getScopedStorage('pillsync_patient_doses', []) || [];
          const syncedDoses = storedDoses.map((d) =>
            (d.med &&
              targetReminder.medicationName &&
              d.med.includes(targetReminder.medicationName) &&
              d.time === targetReminder.time) ||
            (d.time === targetReminder.time && d.medId === targetReminder.medicationId)
              ? { ...d, status: 'missed', takenAt: null }
              : d
          );
          setScopedStorage('pillsync_patient_doses', syncedDoses);
          try {
            localStorage.setItem('pillsync_patient_doses', JSON.stringify(syncedDoses));
          } catch {}
        }
        return updated;
      });
    } finally {
      setActioningId(null);
    }
  };

  const sourceList = reminders;

  const patientFiltered = sourceList.filter(
    (r) => !isCaregiver || selectedPatient === 'All Patients' || r.patient === selectedPatient
  );

  const groupedReminders = {
    all: patientFiltered,
    upcoming: patientFiltered.filter((r) => r.status === 'upcoming'),
    taken: patientFiltered.filter((r) => r.status === 'taken'),
    missed: patientFiltered.filter((r) => r.status === 'missed'),
    snoozed: patientFiltered.filter((r) => r.status === 'snoozed'),
  };

  const displayedReminders = groupedReminders[activeTab] || patientFiltered;

  const totalReminders = patientFiltered.length;
  const takenCount = groupedReminders.taken.length;
  const missedCount = groupedReminders.missed.length;
  const completionRate = totalReminders > 0 ? Math.round((takenCount / totalReminders) * 100) : 100;

  return (
    <Layout>
      <div className="reminders-container">
        {/* Header */}
        <div className="reminders-header">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="primary" size="sm">
                {isCaregiver ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Caregiver Dose Monitoring
                  </>
                ) : (
                  'Daily Schedule'
                )}
              </Badge>
              {isCaregiver && (
                <Badge variant={missedCount > 0 ? 'danger' : 'success'} size="sm">
                  {missedCount > 0 ? `${missedCount} Missed Dose Alert` : '100% Adherence Baseline'}
                </Badge>
              )}
            </div>
            <h1 className="reminders-title">
              {isCaregiver ? 'Dose Logs & Patient Alerts' : 'Appointments & Dose Reminders'}
            </h1>
            <p className="reminders-subtitle">
              {isCaregiver
                ? 'Real-time compliance feed, missed-dose escalation, and triage alerts for your assigned patient cohort'
                : 'Real-time daily schedule and automated SMS/push notification timestamps'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-indigo-600" />
              Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        {/* 4 Stat KPI Cards */}
        <div className="reminders-stats-grid">
          <div className="reminders-stat-card">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isCaregiver ? 'Cohort Scheduled Doses' : 'Total Doses'}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalReminders}</p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Scheduled for today</p>
          </div>

          <div className="reminders-stat-card">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Taken</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{takenCount}</p>
            <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">Logged on time</p>
          </div>

          <div className="reminders-stat-card">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Missed / Skipped
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">{missedCount}</p>
            <p className="text-[10px] font-semibold text-rose-500 mt-0.5">Attention needed</p>
          </div>

          <div className="reminders-stat-card">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Compliance Rate
            </p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{completionRate}%</p>
            <p className="text-[10px] font-semibold text-indigo-600 mt-0.5">Overall daily score</p>
          </div>
        </div>

        {/* Caregiver Patient Selector Chips */}
        {isCaregiver && cohortPatients.length > 1 && (
          <div className="reminders-cohort-bar">
            <span className="reminders-cohort-label">
              <Users className="h-4 w-4 text-indigo-600" />
              Patient Filter:
            </span>
            <div className="reminders-cohort-chips">
              {cohortPatients.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPatient(p)}
                  className={`reminders-cohort-chip ${
                    selectedPatient === p
                      ? 'reminders-cohort-chip-active'
                      : 'reminders-cohort-chip-inactive'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Filters */}
        <div className="reminders-tabs">
          {[
            { id: 'all', label: `All Doses (${totalReminders})` },
            { id: 'upcoming', label: `Upcoming (${groupedReminders.upcoming.length})` },
            { id: 'taken', label: `Taken (${takenCount})` },
            { id: 'missed', label: `Missed (${missedCount})` },
            { id: 'snoozed', label: `Snoozed (${groupedReminders.snoozed.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`reminders-tab-btn ${
                activeTab === tab.id ? 'reminders-tab-btn-active' : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reminders List */}
        {loading ? (
          <CardSkeleton count={3} />
        ) : displayedReminders.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No reminders in this view"
            message="No dose events match the selected status filter."
          />
        ) : (
          <div className="reminders-list">
            {displayedReminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`reminder-card ${
                  reminder.status === 'taken'
                    ? 'reminder-taken'
                    : reminder.status === 'missed'
                      ? 'reminder-missed'
                      : 'reminder-pending'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`reminder-icon-box ${
                      reminder.status === 'taken'
                        ? 'icon-taken'
                        : reminder.status === 'missed'
                          ? 'icon-missed'
                          : 'icon-pending'
                    }`}
                  >
                    <Clock className="h-5 w-5" />
                  </div>

                  <div>
                    {isCaregiver && reminder.patient && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800">{reminder.patient}</span>
                        <span className="text-[10px] text-slate-400">
                          ({reminder.patientAge || 'Patient'}y)
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                        {reminder.time} · {reminder.schedule}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold capitalize ${
                          reminder.status === 'taken'
                            ? 'bg-emerald-50 text-emerald-700'
                            : reminder.status === 'missed'
                              ? 'bg-rose-50 text-rose-700'
                              : reminder.status === 'snoozed'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        ● {reminder.status}
                      </span>
                      {reminder.loggedAt && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({reminder.loggedAt})
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-slate-900 mt-1">
                      {reminder.medicationName || reminder.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {reminder.dosage} · {reminder.note || 'Take with water'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCaregiver ? (
                    reminder.status === 'missed' ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `SMS Nudge sent to ${reminder.patient}: Please log your scheduled ${reminder.medicationName} dose.`
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-2xs"
                        >
                          <Bell className="h-3.5 w-3.5" />
                          Send Nudge
                        </button>
                        <button
                          type="button"
                          onClick={() => alert(`Calling ${reminder.patient}...`)}
                          className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          title="Call Patient"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">
                        {reminder.status === 'taken' ? 'Logged on Schedule ✓' : 'Scheduled'}
                      </span>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {reminder.status === 'taken' ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            Taken ✓
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMarkNotTaken(reminder.id)}
                            disabled={actioningId === reminder.id}
                            className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                            title="Change to Not Taken"
                          >
                            Mark Not Taken
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMarkTaken(reminder.id)}
                            disabled={actioningId === reminder.id}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition cursor-pointer"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Mark Taken
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkNotTaken(reminder.id)}
                            disabled={actioningId === reminder.id}
                            className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                              reminder.status === 'missed'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                            title="Keep / Mark as Not Taken"
                          >
                            Not Taken
                          </button>
                          {reminder.status === 'upcoming' && (
                            <button
                              type="button"
                              onClick={() => handleSnooze(reminder.id)}
                              disabled={actioningId === reminder.id}
                              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            >
                              Snooze (+30m)
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
