import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Eye, Download } from 'lucide-react';

export default function PrescriptionsPage() {
  const navigate = useNavigate();

  // Start with empty prescriptions array - NO PRE-POPULATED DATA
  const [prescriptions, setPrescriptions] = useState([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>📄 Prescription Management</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Store, view and parse prescription records with AI OCR</span>
        </div>
        <button onClick={() => navigate('/add-medicine')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Upload Prescription
        </button>
      </div>

      {prescriptions.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#FFF0F3', border: '2px dashed #FFD6DC' }}>
          <FileText size={44} color="#DC143C" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>No Prescriptions Uploaded</h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A' }}>
            Upload prescription images or PDFs to parse details automatically with AI OCR.
          </p>
          <button onClick={() => navigate('/add-medicine')} className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 18px' }}>
            + Upload Prescription Image
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {prescriptions.map(p => (
            <div key={p.id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC143C', backgroundColor: '#fff1f2', padding: '2px 8px', borderRadius: '4px' }}>
                    Prescription #{p.id}
                  </span>
                  <h3 style={{ margin: '6px 0 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{p.doctor}</h3>
                </div>
                <FileText size={24} color="#DC143C" />
              </div>

              <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                <div><strong>Issued Date:</strong> {p.date}</div>
                <div><strong>Expiry Date:</strong> {p.expiry}</div>
                <div><strong>Extracted Medicines:</strong> {p.medicines}</div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ flex: 1, border: '1px solid #cbd5e1', background: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Eye size={14} /> View
                </button>
                <button style={{ flex: 1, border: '1px solid #cbd5e1', background: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
