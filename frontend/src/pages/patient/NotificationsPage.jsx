import React, { useState } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  // Start with empty notifications array - NO PRE-POPULATED DATA
  const [notifications, setNotifications] = useState([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
        🔔 Notifications & Alert Feed
      </h2>

      {notifications.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#FFF0F3', border: '2px dashed #FFD6DC' }}>
          <Bell size={44} color="#DC143C" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>
            No Notifications Yet
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#7E646A' }}>
            You have zero active alerts. System alerts (missed doses, refill warnings, prescription reminders) will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((n, i) => (
            <div key={i} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid #DC143C` }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{n.title}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#475569' }}>{n.desc}</p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{n.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
