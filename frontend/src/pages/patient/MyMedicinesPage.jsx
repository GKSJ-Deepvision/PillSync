import React, { useState } from 'react';
import { Pill, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function MyMedicinesPage({ setActiveTab }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Start with empty medicines array - NO PRE-POPULATED DATA
  const [medicines, setMedicines] = useState([]);

  const handleDelete = (id) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const filtered = medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>💊 My Medicines</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Manage your active medication schedule, dosages & stock</span>
        </div>
        <button onClick={() => setActiveTab('add-medicine')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Add Medicine
        </button>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search medicine by name or disease category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: '#FFF0F3', borderRadius: '12px', border: '2px dashed #FFD6DC' }}>
            <Pill size={40} color="#DC143C" style={{ marginBottom: '10px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>No Medicines Added Yet</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A' }}>Click below to manually add your medicine name, dosage, quantity, and time slots.</p>
            <button onClick={() => setActiveTab('add-medicine')} className="btn-primary" style={{ fontSize: '0.88rem' }}>
              + Add Medicine Schedule Manually
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #fee2e2', color: '#64748b' }}>
                  <th style={{ padding: '10px' }}>Medicine Name</th>
                  <th style={{ padding: '10px' }}>Dosage</th>
                  <th style={{ padding: '10px' }}>Frequency</th>
                  <th style={{ padding: '10px' }}>Category</th>
                  <th style={{ padding: '10px' }}>Stock Left</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: '#0f172a' }}>
                      💊 {m.name}
                    </td>
                    <td style={{ padding: '12px 10px', color: '#334155' }}>{m.dosage}</td>
                    <td style={{ padding: '12px 10px', color: '#334155' }}>{m.frequency}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fff1f2', color: '#DC143C', fontWeight: 700, fontSize: '0.75rem' }}>
                        {m.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: m.stock <= 10 ? '#dc2626' : '#16a34a' }}>
                      {m.stock} Pills {m.stock <= 10 && '⚠️ Low'}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge-taken">{m.status}</span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => handleDelete(m.id)} style={{ border: 'none', background: '#fef2f2', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#dc2626' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
