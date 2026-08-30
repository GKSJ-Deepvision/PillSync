import React, { useState } from 'react';
import { Camera, FilePlus, CheckCircle } from 'lucide-react';

export default function AddMedicinePage({ setActiveTab }) {
  const [method, setMethod] = useState('manual'); // 'manual' or 'ocr'
  const [ocrScanned, setOcrScanned] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', margin: '0 auto' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
        ➕ Add New Medicine Schedule
      </h2>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #fee2e2', paddingBottom: '8px' }}>
        <button 
          onClick={() => setMethod('manual')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: method === 'manual' ? '#DC143C' : '#fff1f2',
            color: method === 'manual' ? 'white' : '#881337',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Method 1 — Manual Entry
        </button>
        <button 
          onClick={() => setMethod('ocr')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: method === 'ocr' ? '#DC143C' : '#fff1f2',
            color: method === 'ocr' ? 'white' : '#881337',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Method 2 — Upload Image / Prescription (AI OCR)
        </button>
      </div>

      {method === 'manual' ? (
        <div className="glass-card" style={{ padding: '24px' }}>
          <form onSubmit={(e) => { e.preventDefault(); setActiveTab('all-medicines'); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Medicine Name</label>
                <input type="text" placeholder="e.g. Metformin" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Dosage Unit</label>
                <input type="text" placeholder="e.g. 500 mg / 1 Tablet" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Total Quantity / Stock</label>
                <input type="number" placeholder="60" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Frequency</label>
                <select style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}>
                  <option>1 / day (Once daily)</option>
                  <option>2 / day (Twice daily)</option>
                  <option>3 / day (Three times daily)</option>
                  <option>Weekly</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Scheduled Time Slot</label>
                <input type="time" defaultValue="08:00" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Disease Category</label>
                <select style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}>
                  <option>Diabetes</option>
                  <option>Blood Pressure</option>
                  <option>Thyroid</option>
                  <option>Antibiotics</option>
                  <option>Vitamins</option>
                  <option>Heart Medications</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Start Date</label>
                <input type="date" defaultValue="2026-08-30" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>End Date</label>
                <input type="date" defaultValue="2026-09-30" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '0.95rem', marginTop: '10px' }}>
              Save Medicine Schedule
            </button>
          </form>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <Camera size={48} color="#DC143C" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Upload Medicine Photo or Prescription</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '6px 0 20px' }}>
            Tesseract OCR & NLP will automatically extract Medicine Name, Dosage, Quantity, and Frequency.
          </p>

          <input 
            type="file" 
            id="prescription-file" 
            style={{ display: 'none' }} 
            onChange={() => setOcrScanned(true)} 
          />
          <label htmlFor="prescription-file" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block', padding: '10px 20px' }}>
            Upload Prescription Image
          </label>

          {ocrScanned && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'left' }}>
              <div style={{ fontWeight: 700, color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={18} /> AI Extracted Details
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#14532d' }}>
                <li><strong>Medicine:</strong> Metformin 500mg</li>
                <li><strong>Dosage:</strong> 1 Tablet</li>
                <li><strong>Frequency:</strong> 2 Times Daily</li>
                <li><strong>Prescription Details:</strong> Doctor Smith, 30 Days Count</li>
              </ul>
              <button onClick={() => setActiveTab('all-medicines')} className="btn-primary" style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                Review & Save Schedule
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
