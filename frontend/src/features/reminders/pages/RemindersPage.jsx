import { useEffect, useState } from 'react';
import { reminderApi } from '../../../api/reminders';
import { Layout } from '../../../components/layout';
//import { Badge } from '../../../components/common/Badge';
import { EmptyState, CardSkeleton, Alert } from '../../../components/common';
import { Clock, CheckCircle, Calendar } from 'lucide-react';
import './RemindersPage.css';

export function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

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

  const groupedReminders = {
    all: reminders,
    upcoming: reminders.filter((r) => r.status === 'upcoming'),
    taken: reminders.filter((r) => r.status === 'taken'),
    missed: reminders.filter((r) => r.status === 'missed'),
    snoozed: reminders.filter((r) => r.status === 'snoozed'),
  };

  const displayedReminders = groupedReminders[activeTab] || reminders;

  const totalReminders = reminders.length;
  const takenCount = groupedReminders.taken.length;
  const missedCount = groupedReminders.missed.length;
  const completionRate = totalReminders > 0 ? Math.round((takenCount / totalReminders) * 100) : 0;

  return (
    <Layout>
      <div className="reminders-container">
        {/* Header */}
        <div className="reminders-header">
          <div>
            <h1 className="reminders-title">Appointments & Dose Reminders</h1>
            <p className="reminders-subtitle">
              Real-time daily schedule and automated SMS/push notification timestamps
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
              Total Doses
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
              Completion Rate
            </p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{completionRate}%</p>
            <p className="text-[10px] font-semibold text-indigo-600 mt-0.5">Overall daily score</p>
          </div>
        </div>

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
              <div key={reminder.id} className="reminder-card">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
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
                    </div>

                    <h3 className="text-sm font-black text-slate-900 mt-1">
                      {reminder.medicationName || reminder.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{reminder.dosage} · With water</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {reminder.status !== 'taken' && (
                    <button
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
                        onClick={() => handleSnooze(reminder.id)}
                        disabled={actioningId === reminder.id}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Snooze 30m
                      </button>
                      <button
                        onClick={() => handleMarkMissed(reminder.id)}
                        disabled={actioningId === reminder.id}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                      >
                        Missed
                      </button>
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
