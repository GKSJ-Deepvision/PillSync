import React, { useState } from 'react';
import { UploadCloud, ScanLine, Sparkles, CheckCircle2, FileText, ArrowRight, Loader2 } from 'lucide-react';

export default function OcrUploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startScan = () => {
    if (!selectedFile) return;
    setIsScanning(true);

    // Simulate OCR Backend Tesseract & spaCy processing
    setTimeout(() => {
      setIsScanning(false);
      setOcrResult({
        medicineName: 'Atorvastatin',
        dosage: '20 mg',
        quantity: 30,
        frequency: '1 tablet daily at night',
        doctorName: 'Dr. Robert Vance, MD',
        confidenceScore: '96.8%',
        extractedDisease: 'Heart & Cholesterol Management',
      });
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Page Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-950 text-xs font-bold text-brand-700 dark:text-brand-300 mb-2 border border-brand-200 dark:border-brand-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          AI Module 3: OCR Prescription Parser
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Prescription Image OCR Extraction
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upload a handwritten or printed doctor prescription. Tesseract OCR & spaCy NLP will auto-extract medicine names, dosage, and frequency.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className="p-8 rounded-3xl glass-card border-2 border-dashed border-slate-300 dark:border-slate-700 text-center hover:border-brand-500 transition-all flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-glow">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {selectedFile ? selectedFile.name : 'Upload Doctor Prescription Image'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supports PNG, JPG, JPEG or PDF files (Max 10MB)
          </p>
        </div>

        <input
          type="file"
          id="prescription-file"
          onChange={handleFileChange}
          accept="image/*,.pdf"
          className="hidden"
        />

        <div className="flex items-center gap-3">
          <label
            htmlFor="prescription-file"
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            Browse File
          </label>

          {selectedFile && (
            <button
              onClick={startScan}
              disabled={isScanning}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Tesseract OCR...
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" />
                  Extract Details
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* OCR Result Visualizer */}
      {ocrResult && (
        <div className="p-6 rounded-3xl glass-card border border-emerald-200 dark:border-emerald-900/50 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                OCR Text Extraction Successful
              </h4>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Confidence Score: {ocrResult.confidenceScore}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 block font-semibold">Extracted Medicine</span>
              <strong className="text-base text-slate-900 dark:text-white font-bold">{ocrResult.medicineName}</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 block font-semibold">Dosage Strength</span>
              <strong className="text-base text-slate-900 dark:text-white font-bold">{ocrResult.dosage}</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 block font-semibold">Extracted Frequency</span>
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{ocrResult.frequency}</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 block font-semibold">Inferred Category</span>
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{ocrResult.extractedDisease}</strong>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => alert('Saved extracted medicine into active schedule!')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <span>Add to Active Schedules</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
