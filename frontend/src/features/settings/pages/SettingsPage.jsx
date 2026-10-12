import { useState } from 'react';
import { Layout } from '../../../components/layout';
import { Bell, ShieldCheck, Smartphone, SlidersHorizontal, Save, CheckCircle2 } from 'lucide-react';
import './SettingsPage.css';

const DEFAULT_PREFS = [
  { label: 'Push dose reminders', enabled: true },
  { label: 'Critical SMS alerts', enabled: true },
  { label: 'Weekly clinical summary', enabled: true },
  { label: 'Sound notifications', enabled: false },
  { label: 'Caregiver escalation notices', enabled: true },
];

export function SettingsPage() {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('pillsync_user_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PREFS;
  });
  const [highContrast, setHighContrast] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const togglePref = (idx) => {
    setPrefs((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleSave = () => {
    localStorage.setItem('pillsync_user_settings', JSON.stringify(prefs));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

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
              {prefs.map((item, idx) => (
                <div
                  key={item.label}
                  onClick={() => togglePref(idx)}
                  className="switch-row cursor-pointer select-none"
                >
                  <span>{item.label}</span>
                  <span className={`switch ${item.enabled ? 'on' : ''}`}>
                    <span className="switch-knob" />
                  </span>
                </div>
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
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`device-badge cursor-pointer border-0 ${highContrast ? 'bg-emerald-100 text-emerald-800' : 'muted'}`}
              >
                {highContrast ? 'Active' : 'Off'}
              </button>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button type="button" onClick={handleSave} className="save-btn cursor-pointer">
                <Save className="h-4 w-4" />
                Save changes
              </button>
              {savedSuccess && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Preferences saved successfully!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
