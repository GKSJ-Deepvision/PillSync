import { useState } from 'react'
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
          <div className="dashboard-icon">{data.icon}</div>

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
            <div className="feature-card" key={feature}>
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
      </main>
    </div>
  )
}

export default App