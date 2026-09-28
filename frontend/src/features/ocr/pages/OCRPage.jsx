import { useRef, useState } from 'react';
import { Layout } from '../../../components/layout';
import { UploadCloud, ScanLine, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import './OCRPage.css';

const MOCK_RESULTS = [
  {
    id: 1,
    name: 'Metformin 500mg',
    type: 'Medication',
    frequency: 'Twice daily',
    confidence: 96,
    source: 'Prescription image',
  },
  {
    id: 2,
    name: 'Lisinopril 10mg',
    type: 'Medication',
    frequency: 'Once daily',
    confidence: 94,
    source: 'Prescription image',
  },
  {
    id: 3,
    name: 'Vitamin D3 2000 IU',
    type: 'Supplement',
    frequency: 'Once daily',
    confidence: 91,
    source: 'Medication pack',
  },
];

export function OCRPage() {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState(MOCK_RESULTS);
  const [isScanning, setIsScanning] = useState(false);

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsScanning(true);

    setTimeout(() => {
      setResults(MOCK_RESULTS);
      setIsScanning(false);
    }, 1200);
  };

  return (
    <Layout>
      <div className="ocr-page">
        <div className="ocr-header">
          <div>
            <div className="ocr-eyebrow">
              <ScanLine className="h-4 w-4" />
              AI Prescription Extraction
            </div>
            <h1>OCR & Medication Intake Recognition</h1>
            <p>
              Upload a medication image or prescription to extract medication names, dosage, and
              schedule.
            </p>
          </div>
        </div>

        <div className="ocr-layout">
          <div className="ocr-upload-panel">
            <label className="upload-box" htmlFor="ocr-file-input">
              <input
                id="ocr-file-input"
                type="file"
                accept="image/*"
                ref={inputRef}
                hidden
                onChange={handleUpload}
              />
              <UploadCloud className="h-9 w-9" />
              <h3>{selectedFile ? selectedFile.name : 'Upload medication image'}</h3>
              <p>PNG, JPG, or PDF prescription snapshots</p>
            </label>

            {isScanning && (
              <div className="scan-status">
                <Sparkles className="h-4 w-4" />
                Scanning image and extracting medication details...
              </div>
            )}
          </div>

          <div className="ocr-results-panel">
            <div className="panel-head">
              <h2>Extracted medication list</h2>
              <span>{results.length} entries</span>
            </div>

            <div className="ocr-results-list">
              {results.map((item) => (
                <div key={item.id} className="ocr-result-card">
                  <div className="result-main">
                    <div>
                      <h3>{item.name}</h3>
                      <p>
                        {item.type} · {item.frequency}
                      </p>
                    </div>
                    <span className="confidence">{item.confidence}% match</span>
                  </div>

                  <div className="result-footer">
                    <span>{item.source}</span>
                    <div className="action-row">
                      <button type="button" className="accept-btn">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Accept
                      </button>
                      <button type="button" className="reject-btn">
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
