import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, XCircle, Clock, Filter, Search, BarChart2 } from 'lucide-react';
import { getStoredHistoryLogs, calculateAdherenceStats } from './historyService';
import { getStoredProfiles, getActiveProfile } from '../profile/familyProfileService';

export default function HistoryTable() {
  const [logs, setLogs] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [filterProfileId, setFilterProfileId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshData = () => {
    const history = getStoredHistoryLogs();
    const active = getActiveProfile();
    const allProfiles = getStoredProfiles();
    setLogs(history);
    setActiveProfile(active);
    setProfiles(allProfiles);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('pillsync_history_updated', refreshData);
    window.addEventListener('pillsync_profile_changed', refreshData);
    return () => {
      window.removeEventListener('pillsync_history_updated', refreshData);
      window.removeEventListener('pillsync_profile_changed', refreshData);
    };
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchProfile = filterProfileId === 'ALL' || String(log.profileId) === String(filterProfileId);
    const matchStatus = filterStatus === 'ALL' || log.status === filterStatus;
    const matchQuery = searchQuery === '' || 
      log.med.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (log.profileName && log.profileName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchProfile && matchStatus && matchQuery;
  });

  const stats = calculateAdherenceStats(filteredLogs);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Adherence Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#FFF0F3', color: '#DC143C' }}>
            <BarChart2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Adherence Rate</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#DC143C' }}>{stats.percentage}%</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Doses Taken</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>{stats.taken}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#ef4444' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Missed Doses</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ef4444' }}>{stats.missed}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#fffbeb', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Snoozed Doses</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b' }}>{stats.snoozed}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
            <Filter size={16} color="#DC143C" /> Filters:
          </div>

          <select
            value={filterProfileId}
            onChange={(e) => setFilterProfileId(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white', fontWeight: 600 }}
          >
            <option value="ALL">All Family Profiles</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.relationship})</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white', fontWeight: 600 }}
          >
            <option value="ALL">All Intake Statuses</option>
            <option value="Taken">Taken</option>
            <option value="Missed">Missed</option>
            <option value="Snoozed">Snoozed</option>
          </select>
        </div>

        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine..."
            style={{ width: '100%', padding: '7px 12px 7px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* History Log Table */}
      {filteredLogs.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#FFF0F3', border: '2px dashed #FFD6DC' }}>
          <History size={44} color="#DC143C" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>
            No Intake History Logs Found
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#7E646A' }}>
            No medication logs match the selected family profile or filter options.
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #fee2e2', color: '#64748b' }}>
                <th style={{ padding: '12px 10px' }}>Date</th>
                <th style={{ padding: '12px 10px' }}>Time</th>
                <th style={{ padding: '12px 10px' }}>Family Member</th>
                <th style={{ padding: '12px 10px' }}>Medication Name</th>
                <th style={{ padding: '12px 10px' }}>Intake Status</th>
                <th style={{ padding: '12px 10px' }}>Notes / Context</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 600, color: '#0f172a' }}>{log.date}</td>
                  <td style={{ padding: '12px 10px', color: '#475569' }}>{log.time}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ fontWeight: 700, color: '#DC143C', fontSize: '0.82rem', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#FFF0F3' }}>
                      {log.profileName || 'Family Member'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 700, color: '#0f172a' }}>💊 {log.med}</td>
                  <td style={{ padding: '12px 10px' }}>
                    {log.status === 'Taken' ? (
                      <span className="badge-taken"><CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> Taken</span>
                    ) : log.status === 'Missed' ? (
                      <span className="badge-missed"><XCircle size={12} style={{ display: 'inline', marginRight: '4px' }} /> Missed</span>
                    ) : (
                      <span className="badge-snoozed"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> Snoozed</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '0.82rem' }}>
                    {log.notes || 'Recorded via Schedule'}
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
