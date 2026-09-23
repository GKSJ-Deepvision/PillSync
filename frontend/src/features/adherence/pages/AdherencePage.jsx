import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileDown,
  Flame,
  Pill,
  RefreshCw,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import { adherenceApi } from '../../../api/adherence';
import { Layout } from '../../../components/layout';
import { Alert } from '../../../components/common';
import './AdherencePage.css';

const PRESETS = [
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 30 },
];

const STATUS_META = {
  TAKEN: {
    label: 'Taken',
    className: 'adherence-status adherence-status-taken',
  },
  MISSED: {
    label: 'Missed',
    className: 'adherence-status adherence-status-missed',
  },
  SNOOZED: {
    label: 'Snoozed',
    className: 'adherence-status adherence-status-pending',
  },
  PENDING: {
    label: 'Pending',
    className: 'adherence-status adherence-status-pending',
  },
};

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getPresetRange(days) {
  const end = new Date();
  const start = new Date();

  start.setDate(end.getDate() - (days - 1));

  return {
    startDate: getLocalDateString(start),
    endDate: getLocalDateString(end),
  };
}

function formatDisplayDate(value) {
  if (!value) return '—';

  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatShortDate(value) {
  if (!value) return '';

  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function formatTime(value) {
  if (!value) return '—';

  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatPercentage(value) {
  if (value === null || value === undefined) return '—';

  return `${Number(value).toFixed(1)}%`;
}

function getErrorMessage(error, fallback = 'Unable to load adherence data.') {
  const detail = error?.response?.data?.detail;

  if (detail) return detail;

  const firstFieldError = Object.values(error?.response?.data || {})[0];

  if (Array.isArray(firstFieldError) && firstFieldError.length > 0) {
    return firstFieldError[0];
  }

  if (typeof firstFieldError === 'string') {
    return firstFieldError;
  }

  return fallback;
}

function StatCard({ label, value, helper, icon: Icon, tone }) {
  return (
    <article className="adherence-stat-card">
      <div className="adherence-stat-top">
        <div>
          <p className="adherence-stat-label">{label}</p>
          <p className={`adherence-stat-value adherence-stat-${tone}`}>{value}</p>
        </div>

        <div className={`adherence-stat-icon adherence-stat-icon-${tone}`}>
          <Icon size={21} strokeWidth={2.2} />
        </div>
      </div>

      <p className="adherence-stat-helper">{helper}</p>
    </article>
  );
}

function SectionHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="adherence-section-header">
      <div className="adherence-section-heading">
        <div className="adherence-section-icon">
          <Icon size={18} />
        </div>

        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>

      {action}
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.PENDING;

  return <span className={meta.className}>{meta.label}</span>;
}

export function AdherencePage() {
  const defaultRange = getPresetRange(7);

  const [preset, setPreset] = useState('7');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  const [report, setReport] = useState(null);
  const [todayDoses, setTodayDoses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    if (!startDate || !endDate) {
      throw new Error('Please select a valid date range.');
    }

    if (startDate > endDate) {
      throw new Error('Start date must be on or before the end date.');
    }

    const diff =
      (new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) / (1000 * 60 * 60 * 24);

    if (diff > 365) {
      throw new Error('Please select a date range of 366 days or less.');
    }

    const [reportResponse, todayResponse] = await Promise.all([
      adherenceApi.getReport({
        start_date: startDate,
        end_date: endDate,
      }),
      adherenceApi.getToday(),
    ]);

    return {
      reportResponse,
      todayResponse,
    };
  }, [startDate, endDate]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { reportResponse, todayResponse } = await fetchDashboard();

      setReport(reportResponse);
      setTodayDoses(todayResponse);
    } catch (requestError) {
      setReport(null);
      setTodayDoses([]);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [fetchDashboard]);

  useEffect(() => {
    let cancelled = false;

    const loadInitialDashboard = async () => {
      try {
        const { reportResponse, todayResponse } = await fetchDashboard();

        if (cancelled) return;

        setReport(reportResponse);
        setTodayDoses(todayResponse);
        setError('');
      } catch (requestError) {
        if (cancelled) return;

        setReport(null);
        setTodayDoses([]);
        setError(getErrorMessage(requestError));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialDashboard();

    return () => {
      cancelled = true;
    };
  }, [fetchDashboard]);

  const handlePresetChange = (presetId) => {
    const selected = PRESETS.find((item) => item.id === presetId);

    if (!selected) return;

    const range = getPresetRange(selected.days);

    setPreset(presetId);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const handleStartDateChange = (event) => {
    setPreset('custom');
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setPreset('custom');
    setEndDate(event.target.value);
  };

  const handleDoseAction = async (dose, status) => {
    const actionKey = `${dose.schedule_id}-${dose.dose_date}-${status}`;

    try {
      setActionId(actionKey);
      setError('');

      await adherenceApi.logDose({
        schedule: dose.schedule_id,
        dose_date: dose.dose_date,
        status,
      });

      await loadDashboard();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, `Unable to mark this dose as ${status.toLowerCase()}.`)
      );
    } finally {
      setActionId(null);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError('');

      const data = await adherenceApi.getReport({
        start_date: startDate,
        end_date: endDate,
      });

      const rows = [['Date', 'Scheduled', 'Taken', 'Missed', 'Pending', 'Adherence %']];

      data.daily_history.forEach((day) => {
        rows.push([
          day.date,
          day.scheduled,
          day.taken,
          day.missed,
          day.pending,
          day.adherence_rate ?? '',
        ]);
      });

      const csv = rows
        .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `pillsync-adherence-${startDate}-to-${endDate}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to export the adherence report.'));
    } finally {
      setExporting(false);
    }
  };

  const dailyChartData = useMemo(() => {
    return (report?.daily_history || []).map((item) => ({
      ...item,
      label: formatShortDate(item.date),
      adherence: item.adherence_rate ?? 0,
    }));
  }, [report]);

  const statusChartData = useMemo(() => {
    if (!report?.status_breakdown) return [];

    return [
      {
        name: 'Taken',
        value: report.status_breakdown.taken || 0,
        fill: '#10b981',
      },
      {
        name: 'Missed',
        value: report.status_breakdown.missed || 0,
        fill: '#f43f5e',
      },
      {
        name: 'Pending',
        value: report.status_breakdown.pending || 0,
        fill: '#f59e0b',
      },
    ].filter((item) => item.value > 0);
  }, [report]);

  const summary = report?.summary;

  const hasHistory = dailyChartData.length > 0;
  const hasMedicationData = (report?.medications || []).length > 0;
  const hasTodayDoses = todayDoses.length > 0;

  return (
    <Layout>
      <main className="adherence-page">
        <section className="adherence-hero">
          <div>
            <div className="adherence-eyebrow">
              <span className="adherence-eyebrow-dot" />
              Medication management
            </div>

            <h1>Adherence Analytics</h1>

            <p>
              Monitor your medication intake, identify missed doses, and understand adherence trends
              from your recorded dose history.
            </p>
          </div>

          <div className="adherence-toolbar">
            <div className="adherence-range-select">
              <CalendarDays size={17} />
              <select
                value={preset}
                onChange={(event) => handlePresetChange(event.target.value)}
                aria-label="Adherence date range"
              >
                {PRESETS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
                <option value="custom">Custom range</option>
              </select>
            </div>

            <button
              type="button"
              className="adherence-secondary-button"
              onClick={loadDashboard}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'adherence-spin' : ''} />
              Refresh
            </button>

            <button
              type="button"
              className="adherence-primary-button"
              onClick={handleExport}
              disabled={exporting || loading || !report}
            >
              <FileDown size={16} />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </section>

        <section className="adherence-filters-panel">
          <div>
            <p className="adherence-filter-label">Start date</p>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              max={endDate || getLocalDateString()}
            />
          </div>

          <div>
            <p className="adherence-filter-label">End date</p>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate || undefined}
              max={getLocalDateString()}
            />
          </div>

          <div className="adherence-range-summary">
            <span>Showing</span>
            <strong>
              {formatDisplayDate(startDate)} — {formatDisplayDate(endDate)}
            </strong>
          </div>
        </section>

        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        {loading ? (
          <div className="adherence-loading-grid">
            {[1, 2, 3, 4].map((item) => (
              <div className="adherence-skeleton-card" key={item}>
                <div className="adherence-skeleton-line adherence-skeleton-small" />
                <div className="adherence-skeleton-line adherence-skeleton-large" />
                <div className="adherence-skeleton-line adherence-skeleton-medium" />
              </div>
            ))}

            <div className="adherence-skeleton-chart" />
            <div className="adherence-skeleton-chart adherence-skeleton-small-chart" />
          </div>
        ) : report ? (
          <>
            <section className="adherence-stats-grid">
              <StatCard
                label="Overall adherence"
                value={formatPercentage(summary?.adherence_rate)}
                helper={`${summary?.taken_doses || 0} taken of ${
                  summary?.completed_doses || 0
                } completed doses`}
                icon={TrendingUp}
                tone="indigo"
              />

              <StatCard
                label="Taken doses"
                value={summary?.taken_doses || 0}
                helper={`${summary?.scheduled_doses || 0} scheduled in this range`}
                icon={CheckCircle2}
                tone="green"
              />

              <StatCard
                label="Missed doses"
                value={summary?.missed_doses || 0}
                helper={`${summary?.pending_doses || 0} currently pending`}
                icon={XCircle}
                tone="rose"
              />

              <StatCard
                label="Current streak"
                value={`${summary?.current_streak || 0} ${
                  summary?.current_streak === 1 ? 'day' : 'days'
                }`}
                helper="Consecutive days without a missed scheduled dose"
                icon={Flame}
                tone="amber"
              />
            </section>

            <section className="adherence-main-grid">
              <article className="adherence-panel adherence-trend-panel">
                <SectionHeader
                  icon={TrendingUp}
                  title="Daily adherence trend"
                  description="Completed-dose adherence across the selected period"
                />

                {hasHistory ? (
                  <div className="adherence-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={dailyChartData}
                        margin={{
                          top: 12,
                          right: 12,
                          left: -12,
                          bottom: 0,
                        }}
                      >
                        <defs>
                          <linearGradient id="adherenceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />

                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: '#64748b',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        />

                        <YAxis
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: '#94a3b8',
                            fontSize: 11,
                          }}
                          tickFormatter={(value) => `${value}%`}
                        />

                        <Tooltip
                          formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Adherence']}
                          labelFormatter={(label) => `Date: ${label}`}
                          contentStyle={{
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.10)',
                            background: '#ffffff',
                          }}
                        />

                        <Area
                          type="monotone"
                          dataKey="adherence"
                          stroke="#4f46e5"
                          strokeWidth={3}
                          fill="url(#adherenceAreaGradient)"
                          activeDot={{
                            r: 5,
                            strokeWidth: 2,
                            stroke: '#ffffff',
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="adherence-empty-state">
                    <BarChart3 size={30} />
                    <h3>No adherence history yet</h3>
                    <p>Once doses are recorded as taken or missed, the trend will appear here.</p>
                  </div>
                )}
              </article>

              <article className="adherence-panel adherence-status-panel">
                <SectionHeader
                  icon={BarChart3}
                  title="Dose status"
                  description="Recorded and pending dose distribution"
                />

                {statusChartData.length > 0 ? (
                  <>
                    <div className="adherence-donut">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={62}
                            outerRadius={88}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {statusChartData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>

                          <Tooltip
                            formatter={(value, name) => [value, name]}
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                            }}
                          />

                          <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            wrapperStyle={{
                              fontSize: '12px',
                              paddingTop: '8px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="adherence-status-summary">
                      <div>
                        <span className="adherence-status-dot adherence-dot-taken" />
                        <span>Taken</span>
                        <strong>{report.status_breakdown?.taken || 0}</strong>
                      </div>

                      <div>
                        <span className="adherence-status-dot adherence-dot-missed" />
                        <span>Missed</span>
                        <strong>{report.status_breakdown?.missed || 0}</strong>
                      </div>

                      <div>
                        <span className="adherence-status-dot adherence-dot-pending" />
                        <span>Pending</span>
                        <strong>{report.status_breakdown?.pending || 0}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="adherence-empty-state adherence-empty-state-compact">
                    <Clock3 size={28} />
                    <h3>No dose data</h3>
                    <p>Your recorded dose activity will appear here.</p>
                  </div>
                )}
              </article>
            </section>

            <section className="adherence-panel">
              <SectionHeader
                icon={Pill}
                title="Today's doses"
                description="Record what happened today to keep your analytics current"
              />

              {hasTodayDoses ? (
                <div className="adherence-today-list">
                  {todayDoses.map((dose) => {
                    const isTaken = dose.status === 'TAKEN';
                    const isPending = dose.status === 'PENDING';

                    const takenActionKey = `${dose.schedule_id}-${dose.dose_date}-TAKEN`;
                    const missedActionKey = `${dose.schedule_id}-${dose.dose_date}-MISSED`;

                    return (
                      <div
                        className="adherence-today-row"
                        key={`${dose.schedule_id}-${dose.dose_date}`}
                      >
                        <div className="adherence-today-time">
                          <span>{formatTime(dose.scheduled_time)}</span>
                          <small>{dose.time_of_day}</small>
                        </div>

                        <div className="adherence-today-medicine">
                          <div className="adherence-pill-icon">
                            <Pill size={17} />
                          </div>

                          <div>
                            <strong>{dose.medicine_name}</strong>
                            <span>Scheduled for {formatTime(dose.scheduled_time)}</span>
                          </div>
                        </div>

                        <div className="adherence-today-status">
                          <StatusBadge status={dose.status} />

                          {isTaken && dose.taken_at && (
                            <span className="adherence-action-note">
                              Recorded at{' '}
                              {new Date(dose.taken_at).toLocaleTimeString('en-IN', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        <div className="adherence-today-actions">
                          {!isTaken && (
                            <>
                              <button
                                type="button"
                                className="adherence-take-button"
                                onClick={() => handleDoseAction(dose, 'TAKEN')}
                                disabled={
                                  actionId === takenActionKey || actionId === missedActionKey
                                }
                              >
                                <CheckCircle2 size={15} />
                                {actionId === takenActionKey ? 'Saving…' : 'Mark taken'}
                              </button>

                              {isPending && (
                                <button
                                  type="button"
                                  className="adherence-miss-button"
                                  onClick={() => handleDoseAction(dose, 'MISSED')}
                                  disabled={
                                    actionId === takenActionKey || actionId === missedActionKey
                                  }
                                >
                                  <XCircle size={15} />
                                  {actionId === missedActionKey ? 'Saving…' : 'Mark missed'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="adherence-empty-state">
                  <CalendarDays size={30} />
                  <h3>No doses scheduled today</h3>
                  <p>Add an active medication schedule to start recording today's intake.</p>
                </div>
              )}
            </section>

            <section className="adherence-panel">
              <SectionHeader
                icon={Pill}
                title="Adherence by medication"
                description="Medication-level performance for the selected period"
              />

              {hasMedicationData ? (
                <div className="adherence-table-scroll">
                  <table className="adherence-table">
                    <thead>
                      <tr>
                        <th>Medication</th>
                        <th>Scheduled</th>
                        <th>Taken</th>
                        <th>Missed</th>
                        <th>Pending</th>
                        <th>Adherence</th>
                      </tr>
                    </thead>

                    <tbody>
                      {report.medications.map((medicine) => (
                        <tr key={medicine.medicine_id}>
                          <td>
                            <div className="adherence-medication-cell">
                              <div className="adherence-medication-avatar">
                                <Pill size={16} />
                              </div>
                              <div>
                                <strong>{medicine.medicine_name}</strong>
                                <span>
                                  {medicine.completed_doses ||
                                    medicine.taken_doses + medicine.missed_doses}{' '}
                                  completed
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>{medicine.scheduled_doses}</td>

                          <td>
                            <span className="adherence-number-success">{medicine.taken_doses}</span>
                          </td>

                          <td>
                            <span className="adherence-number-danger">{medicine.missed_doses}</span>
                          </td>

                          <td>{medicine.pending_doses}</td>

                          <td>
                            <div className="adherence-progress-cell">
                              <div className="adherence-progress-track">
                                <div
                                  className="adherence-progress-fill"
                                  style={{
                                    width: `${medicine.adherence_rate || 0}%`,
                                  }}
                                />
                              </div>

                              <strong>{formatPercentage(medicine.adherence_rate)}</strong>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="adherence-empty-state">
                  <Pill size={30} />
                  <h3>No active medication schedules</h3>
                  <p>
                    Your medication adherence breakdown will appear once you have active schedules.
                  </p>
                </div>
              )}
            </section>

            <section className="adherence-panel">
              <SectionHeader
                icon={CalendarDays}
                title="Daily history"
                description="A complete day-by-day view of scheduled and completed doses"
              />

              {hasHistory ? (
                <div className="adherence-history-list">
                  {report.daily_history
                    .slice()
                    .reverse()
                    .map((day) => (
                      <div className="adherence-history-row" key={day.date}>
                        <div className="adherence-history-date">
                          <strong>{formatShortDate(day.date)}</strong>
                          <span>{day.date}</span>
                        </div>

                        <div className="adherence-history-metric">
                          <span>Scheduled</span>
                          <strong>{day.scheduled}</strong>
                        </div>

                        <div className="adherence-history-metric adherence-history-success">
                          <span>Taken</span>
                          <strong>{day.taken}</strong>
                        </div>

                        <div className="adherence-history-metric adherence-history-danger">
                          <span>Missed</span>
                          <strong>{day.missed}</strong>
                        </div>

                        <div className="adherence-history-metric">
                          <span>Pending</span>
                          <strong>{day.pending}</strong>
                        </div>

                        <div className="adherence-history-rate">
                          <strong>{formatPercentage(day.adherence_rate)}</strong>

                          <div className="adherence-progress-track">
                            <div
                              className="adherence-progress-fill"
                              style={{
                                width: `${day.adherence_rate || 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="adherence-empty-state">
                  <CalendarDays size={30} />
                  <h3>No history for this period</h3>
                  <p>Select a different date range or start recording doses.</p>
                </div>
              )}
            </section>

            <section className="adherence-footer-note">
              <div className="adherence-footer-icon">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <strong>Analytics are based on recorded medication doses.</strong>
                <p>
                  Future doses remain pending until their scheduled time, and historical unrecorded
                  doses are treated as missed for adherence reporting.
                </p>
              </div>

              <Download size={17} className="adherence-footer-download-icon" />
            </section>
          </>
        ) : (
          <section className="adherence-page-empty">
            <div className="adherence-page-empty-icon">
              <Pill size={32} />
            </div>

            <h2>Adherence analytics unavailable</h2>

            <p>We couldn't retrieve your adherence data. Check your connection and try again.</p>

            <button type="button" className="adherence-primary-button" onClick={loadDashboard}>
              <RefreshCw size={16} />
              Try again
            </button>
          </section>
        )}
      </main>
    </Layout>
  );
}
