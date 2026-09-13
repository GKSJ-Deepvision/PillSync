import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { reminderApi } from '../../../api/reminders';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { EmptyState, CardSkeleton, Alert } from '../../../components/common';
import { Clock, CheckCircle, Calendar, Users, Phone, Bell, ShieldCheck } from 'lucide-react';
import './RemindersPage.css';

const COHORT_DOSE_LOGS = [
  {
    id: 'cl1',
    patient: 'Ibrahim Kadri',
    patientAge: 54,
    patientAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    medicationName: 'Metformin',
    dosage: '500mg',
    time: '08:00 AM',
    schedule: 'Morning Dose',
    status: 'taken',
    loggedAt: '08:05 AM',
    note: 'Taken with breakfast',
  },
  {
    id: 'cl2',
    patient: 'Ibrahim Kadri',
    patientAge: 54,
    patientAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    medicationName: 'Lisinopril',
    dosage: '10mg',
    time: '08:00 AM',
    schedule: 'Morning Dose',
    status: 'taken',
    loggedAt: '08:05 AM',
    note: 'With full glass of water',
  },
  {
    id: 'cl3',
    patient: 'Sarah Connor',
    patientAge: 48,
    patientAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    medicationName: 'Lisinopril',
    dosage: '20mg',
    time: '08:00 AM',
    schedule: 'Morning Dose',
    status: 'missed',
    loggedAt: 'Overdue by 3h',
    note: 'Patient reported dizziness yesterday',
  },
  {
    id: 'cl4',
    patient: 'Michael Chang',
    patientAge: 62,
    patientAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    medicationName: 'Levothyroxine',
    dosage: '50mcg',
    time: '07:00 AM',
    schedule: 'Morning Dose',
    status: 'taken',
    loggedAt: '07:15 AM',
    note: 'On empty stomach before breakfast',
  },
  {
    id: 'cl5',
    patient: 'Ibrahim Kadri',
    patientAge: 54,
    patientAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    medicationName: 'Vitamin D3',
    dosage: '2000 IU',
    time: '01:00 PM',
    schedule: 'Afternoon Dose',
    status: 'upcoming',
    loggedAt: 'Pending',
    note: 'Take with lunch',
  },
  {
    id: 'cl6',
    patient: 'Sarah Connor',
    patientAge: 48,
    patientAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    medicationName: 'Atorvastatin',
    dosage: '20mg',
    time: '08:30 PM',
    schedule: 'Evening Dose',
    status: 'upcoming',
    loggedAt: 'Pending',
    note: 'Take before sleep',
  },
];

const COHORT_PATIENTS = ['All Patients', 'Ibrahim Kadri', 'Sarah Connor', 'Michael Chang'];

export function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState('All Patients');

  const userRole = user?.role || 'patient';
  const isCaregiver = userRole === 'caregiver' || userRole === 'admin';

  useEffect(() => {
    let cancelled = false;

    const loadReminders = async () => {
      try {
        const data = await reminderApi.getReminders();

        if (!cancelled) {
          setReminders(data);
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
  }, []);

  const handleMarkTaken = async (id) => {
    try {
      setActioningId(id);
      await reminderApi.markTaken(id);

      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === id ? { ...reminder, status: 'taken' } : reminder
        )
      );
    } catch (err) {
      setError('Failed to mark as taken');
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkMissed = async (id) => {
    try {
      setActioningId(id);
      await reminderApi.markMissed(id);

      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === id ? { ...reminder, status: 'missed' } : reminder
        )
      );
    } catch (err) {
      setError('Failed to mark as missed');
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleSnooze = async (id) => {
    try {
      setActioningId(id);
      await reminderApi.snoozeReminder(id, 30);

      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === id ? { ...reminder, status: 'snoozed' } : reminder
        )
      );
    } catch (err) {
      setError('Failed to snooze reminder');
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  // Filter for caregiver vs patient
  const sourceList = isCaregiver ? COHORT_DOSE_LOGS : reminders;

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
  const completionRate = totalReminders > 0 ? Math.round((takenCount / totalReminders) * 100) : 0;

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
                  {missedCount > 0 ? `${missedCount} Missed Dose Alert` : '100% Adherence On Track'}
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
        {isCaregiver && (
          <div className="reminders-cohort-bar">
            <span className="reminders-cohort-label">
              <Users className="h-4 w-4 text-indigo-600" />
              Patient Filter:
            </span>
            <div className="reminders-cohort-chips">
              {COHORT_PATIENTS.map((p) => (
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
        {loading && !isCaregiver ? (
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
              <div key={reminder.id} className="reminder-card">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    {/* Patient info for caregiver */}
                    {isCaregiver && reminder.patient && (
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={reminder.patientAvatar}
                          alt={reminder.patient}
                          className="h-5 w-5 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-xs font-bold text-slate-900">{reminder.patient}</span>
                        <span className="text-[10px] text-slate-400">({reminder.patientAge}y)</span>
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
                    <>
                      {reminder.status !== 'taken' && (
                        <button
                          type="button"
                          onClick={() => handleMarkTaken(reminder.id)}
                          disabled={actioningId === reminder.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-2xs"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Mark Taken
                        </button>
                      )}

                      {reminder.status === 'upcoming' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSnooze(reminder.id)}
                            disabled={actioningId === reminder.id}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            Snooze 30m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkMissed(reminder.id)}
                            disabled={actioningId === reminder.id}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                          >
                            Missed
                          </button>
                        </>
                      )}
                    </>
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
