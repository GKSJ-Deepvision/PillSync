import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, Edit3, ArrowRight } from 'lucide-react';

export default function PrescriptionUploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setSelectedFile(file);
      simulateOCRScan(file);
    }
  };

  const simulateOCRScan = (file) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setOcrResult({
        medicineName: 'Amoxicillin Trihydrate',
        dosage: '500 mg',
        frequency: '3 Times Daily (Every 8 hours)',
        duration: '7 Days',
        quantity: 21,
        confidence: '96% (High Confidence)'
      });
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          📷 Smart Prescription OCR Scanner
        </h2>
        <p style={{ margin: '6px 0 16px', fontSize: '0.9rem', color: '#64748b' }}>
          Upload a clear photo or PDF scan of your doctor's prescription. PillSync AI extracts medicine name, dosage, and frequency automatically.
        </p>

        {/* Dropzone */}
        <div style={{
          border: '2px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '36px',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          cursor: 'pointer'
        }}>
          <UploadCloud size={44} color="#0d9488" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
            Drag and drop prescription scan here
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', margin: '6px 0 16px' }}>
            Supports JPG, PNG, and PDF up to 10MB
          </span>
          <input 
            type="file" 
            id="ocr-upload" 
            style={{ display: 'none' }} 
            accept="image/*,.pdf"
            onChange={handleFileDrop}
          />
          <label htmlFor="ocr-upload" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
            Browse Computer
          </label>
        </div>
      </div>

      {/* Scanning State */}
      {isScanning && (
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0d9488' }}>
            Processing image with Tesseract OCR & spaCy NLP Pipeline...
          </div>
        </div>
      )}

      {/* OCR Results View */}
      {ocrResult && !isScanning && (
        <div className="glass-card" style={{ padding: '24px', borderColor: '#ccfbf1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle color="#16a34a" size={20} />
              Extracted Schedule Data
            </h3>
            <span style={{ fontSize: '0.8rem', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '4px 10px', borderRadius: '12px' }}>
              {ocrResult.confidence}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', backgroundColor: '#f0fdfa', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Medicine Name</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{ocrResult.medicineName}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Dosage Unit</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{ocrResult.dosage}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Frequency</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{ocrResult.frequency}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Duration & Total Count</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{ocrResult.duration} ({ocrResult.quantity} pills)</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Add To My Daily Schedule <ArrowRight size={16} />
            </button>
            <button style={{ border: '1px solid #cbd5e1', background: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={16} /> Edit Extracted Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
