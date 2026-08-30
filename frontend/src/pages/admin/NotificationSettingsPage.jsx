import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, ShieldCheck } from 'lucide-react';

export default function NotificationSettingsPage() {
  const [toggles, setToggles] = useState({
    reminder: true,
    missed: true,
    refill: true,
    expiry: true,
    emergency: true
  });

  const [channels, setChannels] = useState({
    push: true,
    email: true,
    sms: false
  });

  const toggleAlert = (key) => setToggles({ ...toggles, [key]: !toggles[key] });
  const toggleChannel = (key) => setChannels({ ...channels, [key]: !channels[key] });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
        ⚙️ Platform Notification Settings
      </h2>

      {/* Channels */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, color: '#DC143C' }}>Notification Channels</h3>
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={channels.push} onChange={() => toggleChannel('push')} />
            🔔 Push Notifications
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={channels.email} onChange={() => toggleChannel('email')} />
            📧 Email Alerts (SendGrid)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={channels.sms} onChange={() => toggleChannel('sms')} />
            💬 SMS Gateway (Twilio)
          </label>
        </div>
      </div>

      {/* Alert Categories Toggles */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, color: '#DC143C' }}>System Trigger Rules</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { key: 'reminder', label: 'Smart Medicine Intake Reminders' },
            { key: 'missed', label: 'Missed Dose Escalation Alerts' },
            { key: 'refill', label: 'AI Refill & Stock Warnings' },
            { key: 'expiry', label: 'Prescription Expiry Reminders' },
            { key: 'emergency', label: 'Emergency Caregiver Notifications' }
          ].map(rule => (
            <div key={rule.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#881337' }}>{rule.label}</span>
              <button 
                onClick={() => toggleAlert(rule.key)}
                style={{
                  padding: '4px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: toggles[rule.key] ? '#DC143C' : '#cbd5e1',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {toggles[rule.key] ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
