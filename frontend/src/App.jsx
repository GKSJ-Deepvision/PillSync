import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [role, setRole] = useState('patient')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()

    setLoading(true)
    setError('')

    try {
      const formData = new URLSearchParams()

      formData.append('username', username)
      formData.append('password', password)

      const loginResponse = await axios.post(
        `${API_URL}/auth/login`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )

      const token = loginResponse.data.access_token

      const userResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const loggedInUser = userResponse.data

      if (loggedInUser.role !== role) {
        setError(
          `This account belongs to the ${loggedInUser.role} role. Please select the correct role.`,
        )
        return
      }

      localStorage.setItem('pillsync_token', token)
      localStorage.setItem(
        'pillsync_user',
        JSON.stringify(loggedInUser),
      )

      setUser(loggedInUser)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Login failed. Please check your username and password.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('pillsync_token')
    localStorage.removeItem('pillsync_user')

    setUser(null)
    setUsername('')
    setPassword('')
    setError('')
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div className="app">
      <div className="login-container">
        <div className="brand-section">
          <div className="logo">💊</div>

          <h1>PillSync</h1>

          <p>
            Intelligent Medicine Reminder
            <br />
            & Medication Tracking Platform
          </p>
        </div>

        <div className="login-card">
          <div className="role-section">
            <h2>Welcome to PillSync</h2>

            <p className="subtitle">
              Select your role to continue
            </p>

            <div className="role-grid">
              <button
                type="button"
                className={`role-card ${
                  role === 'patient' ? 'selected' : ''
                }`}
                onClick={() => {
                  setRole('patient')
                  setError('')
                }}
              >
                <span className="role-icon">👤</span>
                <span className="role-name">Patient</span>
                <span className="role-description">
                  Manage your medication
                </span>
              </button>

              <button
                type="button"
                className={`role-card ${
                  role === 'caregiver' ? 'selected' : ''
                }`}
                onClick={() => {
                  setRole('caregiver')
                  setError('')
                }}
              >
                <span className="role-icon">🩺</span>
                <span className="role-name">Caregiver</span>
                <span className="role-description">
                  Monitor patients
                </span>
              </button>

              <button
                type="button"
                className={`role-card ${
                  role === 'admin' ? 'selected' : ''
                }`}
                onClick={() => {
                  setRole('admin')
                  setError('')
                }}
              >
                <span className="role-icon">⚙️</span>
                <span className="role-name">Admin</span>
                <span className="role-description">
                  Manage the platform
                </span>
              </button>
            </div>
          </div>

          <div className="divider"></div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : `Login as ${
                    role.charAt(0).toUpperCase() + role.slice(1)
                  }`}
            </button>
          </form>

          <p className="security-note">
            🔒 Secure role-based authentication
          </p>
        </div>

        <p className="footer">
          © 2026 PillSync • Healthcare Management Platform
        </p>
      </div>
    </div>
  )
}

function Dashboard({ user, onLogout }) {
  const [reminders, setReminders] = useState([])
  const [reminderLoading, setReminderLoading] = useState(true)
  const [reminderError, setReminderError] = useState('')

  const [medicationHistory, setMedicationHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')

  const [notifications, setNotifications] = useState([])
  const [notificationLoading, setNotificationLoading] =
    useState(true)
  const [notificationError, setNotificationError] = useState('')

  const [actionLoading, setActionLoading] = useState(null)

  const fetchReminders = async () => {
    try {
      setReminderLoading(true)
      setReminderError('')

      const token = localStorage.getItem('pillsync_token')

      const response = await axios.get(`${API_URL}/reminders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setReminders(response.data)
    } catch (err) {
      setReminderError(
        err.response?.data?.detail ||
          'Unable to load reminders.',
      )
    } finally {
      setReminderLoading(false)
    }
  }

  const fetchMedicationHistory = async () => {
    try {
      setHistoryLoading(true)
      setHistoryError('')

      const token = localStorage.getItem('pillsync_token')

      const response = await axios.get(
        `${API_URL}/medication-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setMedicationHistory(response.data)
    } catch (err) {
      setHistoryError(
        err.response?.data?.detail ||
          'Unable to load medication history.',
      )
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true)
      setNotificationError('')

      const token = localStorage.getItem('pillsync_token')

      const response = await axios.get(
        `${API_URL}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setNotifications(response.data)
    } catch (err) {
      setNotificationError(
        err.response?.data?.detail ||
          'Unable to load notifications.',
      )
    } finally {
      setNotificationLoading(false)
    }
  }

  const handleReminderAction = async (reminderId, action) => {
    try {
      setActionLoading(`${reminderId}-${action}`)
      setReminderError('')

      const token = localStorage.getItem('pillsync_token')

      if (action === 'snooze') {
        const snoozedUntil = new Date(
          Date.now() + 30 * 60 * 1000,
        ).toISOString()

        await axios.post(
          `${API_URL}/reminders/${reminderId}/snooze`,
          null,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              snoozed_until: snoozedUntil,
            },
          },
        )
      } else {
        await axios.post(
          `${API_URL}/reminders/${reminderId}/${action}`,
          null,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
      }

      await Promise.all([
        fetchReminders(),
        fetchMedicationHistory(),
        fetchNotifications(),
      ])
    } catch (err) {
      setReminderError(
        err.response?.data?.detail ||
          'Unable to update the reminder.',
      )
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    if (user.role === 'patient') {
      fetchReminders()
      fetchMedicationHistory()
      fetchNotifications()
    } else {
      setReminderLoading(false)
      setHistoryLoading(false)
      setNotificationLoading(false)
    }
  }, [user.role])

  const dashboardData = {
    patient: {
      icon: '👤',
      title: 'Patient Dashboard',
      description:
        'Manage your profile and medication journey.',
      features: [
        'My Profile',
        'Medicine Management',
        'Medication Schedule',
        'Medication History',
      ],
    },

    caregiver: {
      icon: '🩺',
      title: 'Caregiver Dashboard',
      description:
        'Monitor assigned patients and medication activities.',
      features: [
        'Assigned Patients',
        'Medication Monitoring',
        'Missed-Dose Alerts',
        'Adherence Reports',
      ],
    },

    admin: {
      icon: '⚙️',
      title: 'Admin Dashboard',
      description:
        'Manage users, caregivers and platform operations.',
      features: [
        'User Management',
        'Patient Management',
        'Caregiver Management',
        'Platform Analytics',
      ],
    },
  }

  const data = dashboardData[user.role]

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span>💊</span>
          <strong>PillSync</strong>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <div className="welcome-card">
          <div className="dashboard-icon">
            {data.icon}
          </div>

          <div>
            <p className="welcome-label">
              Welcome back
            </p>

            <h1>{user.username}</h1>

            <span className="role-badge">
              {user.role.toUpperCase()}
            </span>

            <p className="dashboard-description">
              {data.description}
            </p>
          </div>
        </div>

        <h2 className="section-title">
          Your PillSync Workspace
        </h2>

        <div className="feature-grid">
          {data.features.map((feature) => (
            <div
              className="feature-card"
              key={feature}
            >
              <div className="feature-icon">
                {user.role === 'patient'
                  ? '💊'
                  : user.role === 'caregiver'
                    ? '🩺'
                    : '⚙️'}
              </div>

              <h3>{feature}</h3>

              <p>
                Feature planned for the upcoming
                PillSync milestone.
              </p>
            </div>
          ))}
        </div>

        {user.role === 'patient' && (
          <>
            {/* ==================== REMINDERS ==================== */}

            <section className="reminders-section">
              <div className="reminders-header">
                <div>
                  <h2 className="section-title">
                    Upcoming Reminders
                  </h2>

                  <p className="reminders-subtitle">
                    Keep track of your scheduled medicines.
                  </p>
                </div>
              </div>

              {reminderLoading && (
                <div className="reminder-message">
                  Loading reminders...
                </div>
              )}

              {reminderError && (
                <div className="error-message">
                  {reminderError}
                </div>
              )}

              {!reminderLoading &&
                !reminderError &&
                reminders.length === 0 && (
                  <div className="reminder-message">
                    No reminders found.
                  </div>
                )}

              {!reminderLoading &&
                !reminderError &&
                reminders.length > 0 && (
                  <div className="reminder-grid">
                    {reminders.map((reminder) => (
                      <div
                        className="reminder-card"
                        key={reminder.id}
                      >
                        <div className="reminder-card-top">
                          <span className="reminder-icon">
                            💊
                          </span>

                          <span
                            className={`reminder-status status-${reminder.status}`}
                          >
                            {reminder.status}
                          </span>
                        </div>

                        <h3>
                          {reminder.medicine_name ||
                            'Medication Reminder'}
                        </h3>

                        {reminder.medicine_dosage && (
                          <p>
                            <strong>Dosage:</strong>{' '}
                            {reminder.medicine_dosage}
                          </p>
                        )}

                        {reminder.dosage_amount && (
                          <p>
                            <strong>Dose:</strong>{' '}
                            {reminder.dosage_amount}
                          </p>
                        )}

                        {reminder.frequency && (
                          <p>
                            <strong>Frequency:</strong>{' '}
                            {reminder.frequency}
                          </p>
                        )}

                        <p>
                          <strong>Scheduled:</strong>{' '}
                          {new Date(
                            reminder.scheduled_at,
                          ).toLocaleString()}
                        </p>

                        {reminder.time_of_day && (
                          <p>
                            <strong>Time:</strong>{' '}
                            {reminder.time_of_day}
                          </p>
                        )}

                        {reminder.snoozed_until && (
                          <p>
                            <strong>Snoozed until:</strong>{' '}
                            {new Date(
                              reminder.snoozed_until,
                            ).toLocaleString()}
                          </p>
                        )}

                        {reminder.action_at && (
                          <p>
                            <strong>Action recorded:</strong>{' '}
                            {new Date(
                              reminder.action_at,
                            ).toLocaleString()}
                          </p>
                        )}

                        <p>
                          <strong>Reminder ID:</strong>{' '}
                          {reminder.id}
                        </p>

                        {reminder.status === 'pending' && (
                          <div className="reminder-actions">
                            <button
                              type="button"
                              className="reminder-action-button taken-button"
                              onClick={() =>
                                handleReminderAction(
                                  reminder.id,
                                  'taken',
                                )
                              }
                              disabled={
                                actionLoading !== null
                              }
                            >
                              {actionLoading ===
                              `${reminder.id}-taken`
                                ? 'Saving...'
                                : '✓ Taken'}
                            </button>

                            <button
                              type="button"
                              className="reminder-action-button missed-button"
                              onClick={() =>
                                handleReminderAction(
                                  reminder.id,
                                  'missed',
                                )
                              }
                              disabled={
                                actionLoading !== null
                              }
                            >
                              {actionLoading ===
                              `${reminder.id}-missed`
                                ? 'Saving...'
                                : '✕ Missed'}
                            </button>

                            <button
                              type="button"
                              className="reminder-action-button snooze-button"
                              onClick={() =>
                                handleReminderAction(
                                  reminder.id,
                                  'snooze',
                                )
                              }
                              disabled={
                                actionLoading !== null
                              }
                            >
                              {actionLoading ===
                              `${reminder.id}-snooze`
                                ? 'Saving...'
                                : '⏰ Snooze 30m'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </section>

            {/* ==================== NOTIFICATIONS ==================== */}

            <section className="history-section">
              <div className="history-header">
                <div>
                  <h2 className="section-title">
                    Notifications
                  </h2>

                  <p className="history-subtitle">
                    View your medication reminder notifications.
                  </p>
                </div>
              </div>

              {notificationLoading && (
                <div className="history-message">
                  Loading notifications...
                </div>
              )}

              {notificationError && (
                <div className="error-message">
                  {notificationError}
                </div>
              )}

              {!notificationLoading &&
                !notificationError &&
                notifications.length === 0 && (
                  <div className="history-message">
                    No notifications found.
                  </div>
                )}

              {!notificationLoading &&
                !notificationError &&
                notifications.length > 0 && (
                  <div className="history-grid">
                    {notifications.map((notification) => (
                      <div
                        className="history-card"
                        key={notification.id}
                      >
                        <div className="history-card-top">
                          <span className="history-icon">
                            🔔
                          </span>

                          <span
                            className={`history-status status-${notification.status}`}
                          >
                            {notification.status}
                          </span>
                        </div>

                        <h3>
                          {notification.title}
                        </h3>

                        <p>
                          <strong>Message:</strong>{' '}
                          {notification.message}
                        </p>

                        <p>
                          <strong>Channel:</strong>{' '}
                          {notification.channel}
                        </p>

                        <p>
                          <strong>Created:</strong>{' '}
                          {new Date(
                            notification.created_at,
                          ).toLocaleString()}
                        </p>

                        {notification.sent_at && (
                          <p>
                            <strong>Sent:</strong>{' '}
                            {new Date(
                              notification.sent_at,
                            ).toLocaleString()}
                          </p>
                        )}

                        {notification.reminder_id && (
                          <p>
                            <strong>Reminder ID:</strong>{' '}
                            {notification.reminder_id}
                          </p>
                        )}

                        <p>
                          <strong>Notification ID:</strong>{' '}
                          {notification.id}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
            </section>

            {/* ==================== MEDICATION HISTORY ==================== */}

            <section className="history-section">
              <div className="history-header">
                <div>
                  <h2 className="section-title">
                    Medication History
                  </h2>

                  <p className="history-subtitle">
                    Review your previous medication activities.
                  </p>
                </div>
              </div>

              {historyLoading && (
                <div className="history-message">
                  Loading medication history...
                </div>
              )}

              {historyError && (
                <div className="error-message">
                  {historyError}
                </div>
              )}

              {!historyLoading &&
                !historyError &&
                medicationHistory.length === 0 && (
                  <div className="history-message">
                    No medication history found.
                  </div>
                )}

              {!historyLoading &&
                !historyError &&
                medicationHistory.length > 0 && (
                  <div className="history-grid">
                    {medicationHistory.map((history) => (
                      <div
                        className="history-card"
                        key={history.id}
                      >
                        <div className="history-card-top">
                          <span className="history-icon">
                            💊
                          </span>

                          <span
                            className={`history-status status-${history.status}`}
                          >
                            {history.status}
                          </span>
                        </div>

                        <h3>
                          {history.medicine_name}
                        </h3>

                        <p>
                          <strong>Dosage:</strong>{' '}
                          {history.dosage}
                        </p>

                        <p>
                          <strong>Scheduled:</strong>{' '}
                          {new Date(
                            history.scheduled_time,
                          ).toLocaleString()}
                        </p>

                        <p>
                          <strong>Action:</strong>{' '}
                          {history.action_at
                            ? new Date(
                                history.action_at,
                              ).toLocaleString()
                            : 'No action recorded'}
                        </p>

                        <p>
                          <strong>History ID:</strong>{' '}
                          {history.id}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App