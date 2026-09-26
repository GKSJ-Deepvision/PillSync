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

  const [medicines, setMedicines] = useState([])
  const [medicineLoading, setMedicineLoading] = useState(true)
  const [medicineError, setMedicineError] = useState('')
  const [selectedMedicineId, setSelectedMedicineId] = useState(null)

  const [refillPrediction, setRefillPrediction] = useState(null)
  const [refillLoading, setRefillLoading] = useState(false)
  const [refillError, setRefillError] = useState('')

  const [stockAmount, setStockAmount] = useState('')
  const [stockLoading, setStockLoading] = useState(false)
  const [stockMessage, setStockMessage] = useState('')

  const [refillNotificationLoading, setRefillNotificationLoading] =
    useState(false)
  const [refillNotificationMessage, setRefillNotificationMessage] =
    useState('')

  const [adherence, setAdherence] = useState(null)
  const [adherenceLoading, setAdherenceLoading] = useState(true)
  const [adherenceError, setAdherenceError] = useState('')

  const [actionLoading, setActionLoading] = useState(null)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('pillsync_token')

    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const fetchReminders = async () => {
    try {
      setReminderLoading(true)
      setReminderError('')

      const response = await axios.get(`${API_URL}/reminders`, {
        headers: getAuthHeaders(),
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

      const response = await axios.get(
        `${API_URL}/medication-history`,
        {
          headers: getAuthHeaders(),
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

      const response = await axios.get(
        `${API_URL}/notifications`,
        {
          headers: getAuthHeaders(),
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

  const fetchMedicines = async () => {
    try {
      setMedicineLoading(true)
      setMedicineError('')

      const response = await axios.get(`${API_URL}/medicines`, {
        headers: getAuthHeaders(),
      })

      const medicineList = response.data

      setMedicines(medicineList)

      if (medicineList.length > 0) {
        setSelectedMedicineId((currentId) => {
          const stillExists = medicineList.some(
            (medicine) => medicine.id === currentId,
          )

          return stillExists ? currentId : medicineList[0].id
        })
      } else {
        setSelectedMedicineId(null)
        setRefillPrediction(null)
      }
    } catch (err) {
      setMedicineError(
        err.response?.data?.detail ||
          'Unable to load medicines.',
      )
    } finally {
      setMedicineLoading(false)
    }
  }

  const fetchRefillPrediction = async (medicineId) => {
    if (!medicineId) {
      setRefillPrediction(null)
      return
    }

    try {
      setRefillLoading(true)
      setRefillError('')

      const response = await axios.get(
        `${API_URL}/refill-predictions/${medicineId}`,
        {
          headers: getAuthHeaders(),
        },
      )

      setRefillPrediction(response.data)
    } catch (err) {
      setRefillError(
        err.response?.data?.detail ||
          'Unable to load refill prediction.',
      )
      setRefillPrediction(null)
    } finally {
      setRefillLoading(false)
    }
  }

  const fetchAdherence = async () => {
    try {
      setAdherenceLoading(true)
      setAdherenceError('')

      const response = await axios.get(
        `${API_URL}/medication-history/adherence`,
        {
          headers: getAuthHeaders(),
        },
      )

      setAdherence(response.data)
    } catch (err) {
      setAdherenceError(
        err.response?.data?.detail ||
          'Unable to load adherence summary.',
      )
    } finally {
      setAdherenceLoading(false)
    }
  }

  const handleReminderAction = async (reminderId, action) => {
    try {
      setActionLoading(`${reminderId}-${action}`)
      setReminderError('')

      if (action === 'snooze') {
        const snoozedUntil = new Date(
          Date.now() + 30 * 60 * 1000,
        ).toISOString()

        await axios.post(
          `${API_URL}/reminders/${reminderId}/snooze`,
          null,
          {
            headers: getAuthHeaders(),
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
            headers: getAuthHeaders(),
          },
        )
      }

      await Promise.all([
        fetchReminders(),
        fetchMedicationHistory(),
        fetchNotifications(),
        fetchMedicines(),
        fetchAdherence(),
      ])

      if (selectedMedicineId) {
        await fetchRefillPrediction(selectedMedicineId)
      }
    } catch (err) {
      setReminderError(
        err.response?.data?.detail ||
          'Unable to update the reminder.',
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleMedicineChange = async (event) => {
    const medicineId = Number(event.target.value)

    setSelectedMedicineId(medicineId)
    setStockMessage('')
    setRefillNotificationMessage('')

    await fetchRefillPrediction(medicineId)
  }

  const handleAddStock = async (event) => {
    event.preventDefault()

    const quantity = Number(stockAmount)

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setStockMessage('Enter a whole number greater than zero.')
      return
    }

    if (!selectedMedicineId) {
      setStockMessage('Please select a medicine first.')
      return
    }

    try {
      setStockLoading(true)
      setStockMessage('')

      const response = await axios.post(
        `${API_URL}/medicines/${selectedMedicineId}/stock`,
        {
          quantity,
        },
        {
          headers: getAuthHeaders(),
        },
      )

      setStockMessage(
        `Stock updated successfully. Current quantity: ${response.data.current_quantity}.`,
      )

      setStockAmount('')

      await Promise.all([
        fetchMedicines(),
        fetchRefillPrediction(selectedMedicineId),
      ])
    } catch (err) {
      setStockMessage(
        err.response?.data?.detail ||
          'Unable to update medicine stock.',
      )
    } finally {
      setStockLoading(false)
    }
  }

  const handleCreateRefillNotification = async () => {
    if (!selectedMedicineId) {
      setRefillNotificationMessage(
        'Please select a medicine first.',
      )
      return
    }

    try {
      setRefillNotificationLoading(true)
      setRefillNotificationMessage('')

      const response = await axios.post(
        `${API_URL}/refill-predictions/${selectedMedicineId}/notification`,
        null,
        {
          headers: getAuthHeaders(),
        },
      )

      setRefillNotificationMessage(response.data.message)

      await fetchNotifications()
    } catch (err) {
      setRefillNotificationMessage(
        err.response?.data?.detail ||
          'Unable to create refill notification.',
      )
    } finally {
      setRefillNotificationLoading(false)
    }
  }

  useEffect(() => {
    if (user.role === 'patient') {
      fetchReminders()
      fetchMedicationHistory()
      fetchNotifications()
      fetchMedicines()
      fetchAdherence()
    } else {
      setReminderLoading(false)
      setHistoryLoading(false)
      setNotificationLoading(false)
      setMedicineLoading(false)
      setAdherenceLoading(false)
    }
  }, [user.role])

  useEffect(() => {
    if (selectedMedicineId && user.role === 'patient') {
      fetchRefillPrediction(selectedMedicineId)
    }
  }, [selectedMedicineId, user.role])

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

  const selectedMedicine = medicines.find(
    (medicine) => medicine.id === selectedMedicineId,
  )

  const formatDate = (value) => {
    if (!value) {
      return 'Not available'
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString()
  }

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
            {/* ==================== MEDICINE & REFILL ==================== */}

            <section className="management-section">
              <div className="section-heading-row">
                <div>
                  <h2 className="section-title">
                    Medicine & Refill Management
                  </h2>

                  <p className="section-subtitle">
                    Monitor medicine stock and predict when a refill may be needed.
                  </p>
                </div>
              </div>

              {medicineLoading && (
                <div className="dashboard-message">
                  Loading medicines...
                </div>
              )}

              {medicineError && (
                <div className="error-message">
                  {medicineError}
                </div>
              )}

              {!medicineLoading &&
                !medicineError &&
                medicines.length === 0 && (
                  <div className="dashboard-message">
                    No medicines found.
                  </div>
                )}

              {!medicineLoading &&
                !medicineError &&
                medicines.length > 0 && (
                  <>
                    <div className="medicine-selector-card">
                      <div className="form-group">
                        <label htmlFor="medicine-select">
                          Select Medicine
                        </label>

                        <select
                          id="medicine-select"
                          value={selectedMedicineId || ''}
                          onChange={handleMedicineChange}
                        >
                          {medicines.map((medicine) => (
                            <option
                              key={medicine.id}
                              value={medicine.id}
                            >
                              {medicine.name}
                              {medicine.dosage
                                ? ` — ${medicine.dosage}`
                                : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedMedicine && (
                        <div className="stock-summary">
                          <div className="stock-icon">
                            💊
                          </div>

                          <div>
                            <span className="summary-label">
                              Current Stock
                            </span>

                            <strong className="stock-number">
                              {selectedMedicine.quantity}
                            </strong>

                            <span className="stock-unit">
                              units
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {stockMessage && (
                      <div className="success-message">
                        {stockMessage}
                      </div>
                    )}

                    <div className="refill-grid">
                      <div className="refill-card">
                        <div className="refill-card-header">
                          <span>📦</span>
                          <h3>Stock Management</h3>
                        </div>

                        <p>
                          Add newly purchased medicine to your current stock.
                        </p>

                        <form
                          onSubmit={handleAddStock}
                          className="stock-form"
                        >
                          <div className="form-group">
                            <label htmlFor="stock-amount">
                              Quantity to Add
                            </label>

                            <input
                              id="stock-amount"
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Enter quantity"
                              value={stockAmount}
                              onChange={(event) =>
                                setStockAmount(event.target.value)
                              }
                            />
                          </div>

                          <button
                            type="submit"
                            className="primary-action-button"
                            disabled={stockLoading}
                          >
                            {stockLoading
                              ? 'Updating...'
                              : '+ Add Stock'}
                          </button>
                        </form>
                      </div>

                      <div className="refill-card">
                        <div className="refill-card-header">
                          <span>🔮</span>
                          <h3>Refill Prediction</h3>
                        </div>

                        {refillLoading && (
                          <div className="dashboard-message compact">
                            Calculating prediction...
                          </div>
                        )}

                        {refillError && (
                          <div className="error-message">
                            {refillError}
                          </div>
                        )}

                        {!refillLoading &&
                          !refillError &&
                          refillPrediction && (
                            <>
                              <div
                                className={`refill-alert ${
                                  refillPrediction.refill_required
                                    ? 'refill-required'
                                    : 'refill-normal'
                                }`}
                              >
                                <span>
                                  {refillPrediction.refill_required
                                    ? '⚠️ Refill Required'
                                    : '✓ Stock Level OK'}
                                </span>

                                <strong>
                                  {refillPrediction.estimated_days_remaining ===
                                  null
                                    ? 'No schedule'
                                    : `${refillPrediction.estimated_days_remaining} days remaining`}
                                </strong>
                              </div>

                              <div className="prediction-grid">
                                <div className="prediction-item">
                                  <span>
                                    Current Stock
                                  </span>
                                  <strong>
                                    {refillPrediction.current_stock}
                                  </strong>
                                </div>

                                <div className="prediction-item">
                                  <span>
                                    Daily Consumption
                                  </span>
                                  <strong>
                                    {refillPrediction.daily_consumption}
                                  </strong>
                                </div>

                                <div className="prediction-item">
                                  <span>
                                    Depletion Date
                                  </span>
                                  <strong>
                                    {formatDate(
                                      refillPrediction.estimated_depletion_date,
                                    )}
                                  </strong>
                                </div>

                                <div className="prediction-item">
                                  <span>
                                    Recommended Refill
                                  </span>
                                  <strong>
                                    {formatDate(
                                      refillPrediction.recommended_refill_date,
                                    )}
                                  </strong>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="notification-action-button"
                                onClick={
                                  handleCreateRefillNotification
                                }
                                disabled={
                                  refillNotificationLoading ||
                                  !refillPrediction.refill_required
                                }
                              >
                                {refillNotificationLoading
                                  ? 'Creating...'
                                  : refillPrediction.refill_required
                                    ? '🔔 Create Refill Notification'
                                    : '✓ No Refill Needed'}
                              </button>

                              {refillNotificationMessage && (
                                <div className="refill-notification-message">
                                  {refillNotificationMessage}
                                </div>
                              )}
                            </>
                          )}
                      </div>
                    </div>
                  </>
                )}
            </section>

            {/* ==================== ADHERENCE ==================== */}

            <section className="adherence-section">
              <div className="section-heading-row">
                <div>
                  <h2 className="section-title">
                    Medication Adherence
                  </h2>

                  <p className="section-subtitle">
                    Track your medication-taking activity.
                  </p>
                </div>
              </div>

              {adherenceLoading && (
                <div className="dashboard-message">
                  Loading adherence summary...
                </div>
              )}

              {adherenceError && (
                <div className="error-message">
                  {adherenceError}
                </div>
              )}

              {!adherenceLoading &&
                !adherenceError &&
                adherence && (
                  <div className="adherence-card">
                    <div className="adherence-main">
                      <div className="adherence-circle">
                        <strong>
                          {adherence.adherence_percentage}%
                        </strong>
                        <span>Adherence</span>
                      </div>

                      <div className="adherence-description">
                        <h3>
                          Medication Adherence Summary
                        </h3>

                        <p>
                          This summary is calculated from your recorded
                          medication history.
                        </p>
                      </div>
                    </div>

                    <div className="adherence-stats">
                      <div className="adherence-stat">
                        <span className="stat-icon">
                          💊
                        </span>
                        <span>Total Doses</span>
                        <strong>
                          {adherence.total_doses}
                        </strong>
                      </div>

                      <div className="adherence-stat">
                        <span className="stat-icon">
                          ✓
                        </span>
                        <span>Taken</span>
                        <strong>
                          {adherence.taken_doses}
                        </strong>
                      </div>

                      <div className="adherence-stat">
                        <span className="stat-icon">
                          ✕
                        </span>
                        <span>Missed</span>
                        <strong>
                          {adherence.missed_doses}
                        </strong>
                      </div>

                      <div className="adherence-stat">
                        <span className="stat-icon">
                          ⏰
                        </span>
                        <span>Snoozed</span>
                        <strong>
                          {adherence.snoozed_doses}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
            </section>

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
                    View your medication and refill notifications.
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