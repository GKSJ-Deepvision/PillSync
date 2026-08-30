import React, { useState } from 'react';
import { History, CheckCircle2, XCircle } from 'lucide-react';

export default function MedicationHistoryPage() {
  // Start with empty history logs array - NO PRE-POPULATED DATA
  const [historyLogs, setHistoryLogs] = useState([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
        📜 Medication Intake History
      </h2>

      {historyLogs.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#FFF0F3', border: '2px dashed #FFD6DC' }}>
          <History size={44} color="#DC143C" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>
            No Medication Intake History Logs
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#7E646A' }}>
            Your history log is completely clean. Take or miss scheduled doses in your Schedule to automatically record intake logs here.
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #fee2e2', color: '#64748b' }}>
                <th style={{ padding: '10px' }}>Date</th>
                <th style={{ padding: '10px' }}>Scheduled Time</th>
                <th style={{ padding: '10px' }}>Medicine</th>
                <th style={{ padding: '10px' }}>Log Status</th>
              </tr>
            </thead>
            <tbody>
              {historyLogs.map((log, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 600, color: '#0f172a' }}>{log.date}</td>
                  <td style={{ padding: '12px 10px', color: '#475569' }}>{log.time}</td>
                  <td style={{ padding: '12px 10px', fontWeight: 700, color: '#0f172a' }}>💊 {log.med}</td>
                  <td style={{ padding: '12px 10px' }}>
                    {log.status === 'Taken' ? (
                      <span className="badge-taken"><CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> Taken</span>
                    ) : (
                      <span className="badge-missed"><XCircle size={12} style={{ display: 'inline', marginRight: '4px' }} /> Missed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
