import React, { useState, useRef } from 'react';

/**
 * PrescriptionOCR Component
 * Milestone 3: OCR Medicine Recognition and Structured Information Extraction.
 * Integrates with backend POST /api/ocr/extract/ and POST /api/ocr/save/.
 */
export default function PrescriptionOCR() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rawText, setRawText] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [confidence, setConfidence] = useState({ level: 'Medium', score: 0 });
  const [medicines, setMedicines] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    setError(null);
    setSuccess(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleExtract = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('prescription_image', selectedFile);

    try {
      const res = await fetch('/api/ocr/extract/', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to process prescription image.');
        return;
      }

      setRawText(data.raw_text || '');
      setConfidence({
        level: data.confidence_level || 'Medium',
        score: data.mean_confidence || 0,
      });
      setMedicines(data.medicines || []);
      setSuccess(data.message || 'Prescription extracted successfully!');
    } catch (err) {
      setError('Network error while connecting to the OCR service.');
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        medicine_name: '',
        dosage: '',
        quantity: '',
        frequency: '',
        duration: '',
        prescription_details: '',
        confidence: 'High',
      },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError(null);
    const validMeds = medicines.filter((m) => m.medicine_name && m.medicine_name.trim());
    if (validMeds.length === 0) {
      setError('Please provide at least one medicine with a name before saving.');
      return;
    }

    setSaveLoading(true);
    try {
      const res = await fetch('/api/ocr/save/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: validMeds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save medications.');
        return;
      }
      setSuccess(data.message || 'Medications saved successfully to tracker!');
    } catch (err) {
      setError('Network error occurred while saving.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescription OCR</h1>
          <p className="text-sm text-slate-500">
            Scan and extract medicine name, dosage, quantity, frequency, and instructions.
          </p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200">
          Tesseract OCR 5.4 Active
        </span>
      </div>

      {/* Medical Safety Disclaimer */}
      <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-md text-amber-900 text-sm flex gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <strong>Medical Safety Notice:</strong> PillSync OCR extracts text from prescription images.
          It does not diagnose, prescribe, or change treatments. Always verify all extracted details
          manually against your doctor's original prescription.
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 text-sm rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-800 text-sm rounded-md">
          {success}
        </div>
      )}

      {/* Upload Zone */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50 transition rounded-xl p-8 text-center cursor-pointer"
        >
          <div className="text-4xl mb-2">📄</div>
          <p className="font-medium text-slate-700">Click or drag & drop prescription image</p>
          <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP (Max 10 MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          />
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-16 h-16 object-cover rounded border border-slate-300 bg-white"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{selectedFile?.name}</p>
                <p className="text-xs text-slate-500">
                  {selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                setMedicines([]);
                setRawText('');
              }}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1 border border-red-200 rounded bg-white"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleExtract}
            disabled={!selectedFile || loading}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            {loading ? 'Processing OCR...' : 'Extract Prescription'}
          </button>
        </div>
      </div>

      {/* Extracted Results */}
      {(rawText || medicines.length > 0) && (
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Extracted Medications</h2>
              <span className="px-2.5 py-0.5 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full">
                {medicines.length} Found
              </span>
            </div>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1 rounded bg-slate-50"
            >
              {showRaw ? 'Hide Raw OCR Text' : 'View Raw OCR Text'}
            </button>
          </div>

          {/* Raw Text Drawer */}
          {showRaw && (
            <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-700">
                <span className="text-slate-400">Raw Recognized Output</span>
                <span className="text-sky-400">
                  Confidence: {confidence.level} ({confidence.score}%)
                </span>
              </div>
              {rawText || 'No text recognized.'}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs uppercase border-b border-slate-200">
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Dosage</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Instructions</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {medicines.map((med, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2">
                      <input
                        type="text"
                        value={med.medicine_name || ''}
                        onChange={(e) => handleMedicineChange(idx, 'medicine_name', e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-sm"
                        placeholder="Medicine name"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={med.dosage || ''}
                        onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-sm"
                        placeholder="e.g. 500 mg"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={med.quantity || ''}
                        onChange={(e) => handleMedicineChange(idx, 'quantity', e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-sm"
                        placeholder="e.g. 10 tablets"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={med.frequency || ''}
                        onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-sm"
                        placeholder="e.g. Twice daily"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={med.duration || ''}
                        onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-sm"
                        placeholder="e.g. 5 days"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={med.prescription_details || ''}
                        onChange={(e) => handleMedicineChange(idx, 'prescription_details', e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-sm"
                        placeholder="e.g. After food"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="text-red-500 hover:text-red-700 px-2 py-1 text-xs"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddMedicine}
              className="text-xs text-sky-600 hover:text-sky-800 font-medium px-3 py-1.5 border border-sky-200 rounded bg-sky-50"
            >
              + Add Another Medicine
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading || medicines.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-sm transition"
            >
              {saveLoading ? 'Saving...' : '💾 Save to Medication Tracker'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
