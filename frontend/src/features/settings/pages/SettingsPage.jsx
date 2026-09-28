import { Layout } from '../../../components/layout';
import { Bell, ShieldCheck, Smartphone, SlidersHorizontal, Save } from 'lucide-react';
import './SettingsPage.css';

const PREFS = [
  { label: 'Push dose reminders', enabled: true },
  { label: 'Critical SMS alerts', enabled: true },
  { label: 'Weekly clinical summary', enabled: true },
  { label: 'Sound notifications', enabled: false },
  { label: 'Caregiver escalation notices', enabled: true },
];

export function SettingsPage() {
  return (
    <Layout>
      <div className="settings-page">
        <div className="settings-header">
          <div>
            <div className="settings-eyebrow">
              <SlidersHorizontal className="h-4 w-4" />
              Account Settings
            </div>
            <h1>Preferences & Security</h1>
            <p>Manage alert channels, privacy controls, and clinical preferences.</p>
          </div>
        </div>

        <div className="settings-grid">
          <div className="settings-card">
            <div className="block-title">
              <Bell className="h-4 w-4" />
              Notification preferences
            </div>

            <div className="settings-list">
              {PREFS.map((item) => (
                <label key={item.label} className="switch-row">
                  <span>{item.label}</span>
                  <span className={`switch ${item.enabled ? 'on' : ''}`}>
                    <span className="switch-knob" />
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="settings-card">
            <div className="block-title">
              <ShieldCheck className="h-4 w-4" />
              Security
            </div>

            <ul className="security-list">
              <li>
                <span>Two-step verification</span>
                <strong>Enabled</strong>
              </li>
              <li>
                <span>Session timeout</span>
                <strong>30 minutes</strong>
              </li>
              <li>
                <span>Last password change</span>
                <strong>14 days ago</strong>
              </li>
            </ul>
          </div>

          <div className="settings-card full">
            <div className="block-title">
              <Smartphone className="h-4 w-4" />
              Device & accessibility
            </div>

            <div className="device-row">
              <div>
                <h3>Mobile sync</h3>
                <p>Push notifications enabled for Android and iOS devices.</p>
              </div>
              <span className="device-badge">Connected</span>
            </div>

            <div className="device-row">
              <div>
                <h3>High contrast mode</h3>
                <p>Improves readability for low-vision clinical workflows.</p>
              </div>
              <span className="device-badge muted">Off</span>
            </div>

            <button type="button" className="save-btn">
              <Save className="h-4 w-4" />
              Save changes
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
