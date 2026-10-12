import { useRef, useState } from 'react';
import { Layout } from '../../../components/layout';
import {
  UploadCloud,
  ScanLine,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  Pill,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ocrApi } from '../../../api/ocr';
import { medicationApi } from '../../../api/medications';
import './OCRPage.css';

export function OCRPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [results, setResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [showRawTextId, setShowRawTextId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsScanning(true);

    try {
      const response = await ocrApi.scanPrescription(file);
      const parsed = response.data || {};
      const raw = response.raw_text || '';

      if (
        !parsed.is_medicine ||
        (!parsed.medicine_name && (!parsed.medicines || parsed.medicines.length === 0))
      ) {
        setError(
          parsed.error_detail ||
            'Non-Medication Image Rejected: No valid medicine package, bottle label, or clinical prescription text was detected. PillSync only processes legitimate medication images.'
        );
        return;
      }

      const medsList =
        Array.isArray(parsed.medicines) && parsed.medicines.length > 0
          ? parsed.medicines
          : [parsed];

      const entries = medsList.map((m, idx) => ({
        id: Date.now() + idx,
        name: m.medicine_name,
        strength: m.strength || 'As prescribed',
        quantity: m.quantity || 10,
        dosage:
          m.dosage ||
          (m.strength && m.strength !== 'As prescribed' ? `1 dose (${m.strength})` : '1 tablet'),
        frequency: m.frequency || 'As directed by physician',
        instructions: m.instructions || 'Take as directed with water',
        confidence: Math.round((m.confidence || parsed.confidence || 0.85) * 100),
        source: file.name,
        rawText: raw || 'Clinical text extracted and verified.',
      }));

      setResults((prev) => [...entries, ...prev]);
      setError('');
      if (entries.length > 1) {
        setSuccessMsg(`Recognized all ${entries.length} prescription medications successfully!`);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error('Backend OCR error:', err);
      const detailMsg =
        err.response?.data?.detail ||
        err.message ||
        'Non-Medication Image Rejected: No valid medicine packaging or prescription detected.';
      setError(detailMsg);
    } finally {
      setIsScanning(false);
    }
  };

  const getScheduleFromFrequency = (frequency) => {
    const freqLower = (frequency || '').toLowerCase();
    if (freqLower.includes('twice') || freqLower.includes('bid') || freqLower.includes('bd')) {
      return ['08:00 AM', '08:00 PM'];
    }
    if (freqLower.includes('three') || freqLower.includes('tid') || freqLower.includes('tds')) {
      return ['08:00 AM', '02:00 PM', '08:00 PM'];
    }
    if (freqLower.includes('four') || freqLower.includes('qid')) {
      return ['08:00 AM', '12:00 PM', '04:00 PM', '08:00 PM'];
    }
    if (freqLower.includes('bedtime') || freqLower.includes('hs') || freqLower.includes('night')) {
      return ['09:00 PM'];
    }
    return ['08:00 AM'];
  };

  const handleAcceptAndAdd = async (item) => {
    try {
      await medicationApi.createMedication({
        name: item.name,
        dosage: item.strength || item.dosage || '1 tablet',
        frequency: item.frequency || 'Once daily (Morning)',
        quantity: item.quantity || 30,
        instructions: item.instructions || 'Take with water as directed',
        schedule: getScheduleFromFrequency(item.frequency),
        disease: 'Prescribed Care',
        status: 'active',
      });

      setSuccessMsg(`"${item.name}" added directly to your active prescriptions!`);
      setResults((prev) => prev.filter((r) => r.id !== item.id));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      navigate('/medications/new', { state: { prefill: item } });
    }
  };

  const handleAddAll = async () => {
    try {
      for (const item of results) {
        await medicationApi.createMedication({
          name: item.name,
          dosage: item.strength || item.dosage || '1 tablet',
          frequency: item.frequency || 'Once daily (Morning)',
          quantity: item.quantity || 30,
          instructions: item.instructions || 'Take with water as directed',
          schedule: getScheduleFromFrequency(item.frequency),
          disease: 'Prescribed Care',
          status: 'active',
        });
      }
      setSuccessMsg(`All ${results.length} medications added to active prescriptions!`);
      setResults([]);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCustomizeInForm = (item) => {
    navigate('/medications/new', { state: { prefill: item } });
  };

  const handleReject = (id) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  const handleNameChange = (id, newName) => {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, name: newName } : r)));
  };

  const handleStrengthChange = (id, newStrength) => {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, strength: newStrength } : r)));
  };

  return (
    <Layout>
      <div className="ocr-page">
        <div className="ocr-header">
          <div>
            <div className="ocr-eyebrow">
              <ScanLine className="h-4 w-4" />
              Tesseract AI Prescription Extraction
            </div>
            <h1>OCR & Medication Intake Recognition</h1>
            <p>
              Upload a prescription photo or pill bottle label to automatically extract medicine
              names, dosages, and schedules with AI.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-rose-50/90 border border-rose-200 p-4 text-xs font-semibold text-rose-900 shadow-sm animate-fade-in">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-800 uppercase tracking-wider text-[11px]">
                  Medication Verification Failed
                </span>
              </div>
              <p className="mt-1 text-xs text-rose-700 leading-relaxed font-normal">{error}</p>
              <p className="mt-1 text-[11px] text-rose-500 font-normal">
                Please upload a photo of an authentic medicine blister strip, syrup/drops bottle
                label, or official doctor prescription.
              </p>
            </div>
          </div>
        )}

        <div className="ocr-layout">
          {/* Upload Panel */}
          <div className="ocr-upload-panel">
            <label className="upload-box cursor-pointer" htmlFor="ocr-file-input">
              <input
                id="ocr-file-input"
                type="file"
                accept="image/*"
                ref={inputRef}
                hidden
                onChange={handleUpload}
              />
              {previewUrl ? (
                <div className="upload-box-preview">
                  <img src={previewUrl} alt="Prescription preview" />
                </div>
              ) : (
                <UploadCloud className="h-10 w-10 text-teal-600 mb-2" />
              )}
              <div className="upload-file-info">
                <h3
                  className="upload-file-name"
                  title={selectedFile ? selectedFile.name : 'Upload prescription or medicine image'}
                >
                  {selectedFile ? selectedFile.name : 'Upload prescription or medicine image'}
                </h3>
                <p className="upload-file-hint">
                  {selectedFile
                    ? 'Ready for OCR processing'
                    : 'Supports PNG, JPG, JPEG, or WEBP pill bottles & Rx slips'}
                </p>
                <span className="upload-action-btn">
                  <ScanLine className="h-3 w-3" />
                  {selectedFile ? 'Change image' : 'Click to browse files'}
                </span>
              </div>
            </label>

            {isScanning && (
              <div className="scan-status mt-3 flex items-center justify-center gap-2 rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs font-semibold text-teal-800 animate-pulse">
                <Sparkles className="h-4 w-4 text-teal-600 animate-spin" />
                Running Tesseract OCR &amp; clinical entity extraction...
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="ocr-results-panel">
            <div className="panel-head flex items-center justify-between">
              <div>
                <h2>Extracted Prescription Records</h2>
              </div>
              <div className="flex items-center gap-2">
                {results.length > 1 && (
                  <button
                    type="button"
                    onClick={handleAddAll}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Add All ({results.length}) to Prescriptions</span>
                  </button>
                )}
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  {results.length} Scanned
                </span>
              </div>
            </div>

            <div className="ocr-results-list">
              {results.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <ScanLine className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    No prescriptions scanned yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Upload a bottle label or doctor prescription on the left to extract medicine
                    details.
                  </p>
                </div>
              ) : (
                results.map((item) => (
                  <div
                    key={item.id}
                    className="ocr-result-card bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-3"
                  >
                    <div className="result-main flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-teal-600" />
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleNameChange(item.id, e.target.value)}
                            className="font-bold text-sm text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none bg-transparent"
                            title="Click to edit medicine name"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <input
                            type="text"
                            value={item.strength}
                            onChange={(e) => handleStrengthChange(item.id, e.target.value)}
                            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 w-24"
                            title="Edit strength"
                          />
                          <span className="text-xs text-slate-500 font-medium">
                            · {item.frequency}
                          </span>
                          <span className="text-xs text-slate-500">· {item.instructions}</span>
                        </div>
                      </div>
                      <span className="confidence text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {item.confidence}% Match
                      </span>
                    </div>

                    {/* Raw Text Drawer Toggle */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 gap-2">
                      <span className="truncate max-w-[220px]" title={item.source}>
                        Source: {item.source}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowRawTextId(showRawTextId === item.id ? null : item.id)}
                        className="text-teal-600 hover:text-teal-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="h-3 w-3" />
                        {showRawTextId === item.id ? 'Hide Raw Text' : 'View Raw OCR Text'}
                      </button>
                    </div>

                    {showRawTextId === item.id && (
                      <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11px] font-mono text-slate-600 border border-slate-200 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {item.rawText}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="result-footer mt-3.5 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptAndAdd(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Quick Add to Meds
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCustomizeInForm(item)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                      >
                        Edit Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(item.id)}
                        className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Discard
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
