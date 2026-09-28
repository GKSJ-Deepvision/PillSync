import React from "react";
import { CheckCircle2, Sparkles, User, Pill, Clock, Hash } from "lucide-react";

export default function OcrPreviewCard({ ocrResult, onConfirm }) {
  if (!ocrResult) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            OCR Parsing Verified
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Extracted Prescription Metadata
          </h3>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Confidence: {ocrResult.confidenceScore}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <Pill className="w-5 h-5 text-brand-600" />
          <div>
            <div className="text-slate-400 text-xs font-medium">
              Medicine Name
            </div>
            <div className="font-bold text-slate-900 dark:text-white">
              {ocrResult.medicineName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <Hash className="w-5 h-5 text-brand-600" />
          <div>
            <div className="text-slate-400 text-xs font-medium">
              Dosage & Stock
            </div>
            <div className="font-bold text-slate-900 dark:text-white">
              {ocrResult.dosage} • {ocrResult.quantity} Units
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <Clock className="w-5 h-5 text-brand-600" />
          <div>
            <div className="text-slate-400 text-xs font-medium">Frequency</div>
            <div className="font-bold text-slate-900 dark:text-white">
              {ocrResult.frequency}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <User className="w-5 h-5 text-brand-600" />
          <div>
            <div className="text-slate-400 text-xs font-medium">
              Prescribing Physician
            </div>
            <div className="font-bold text-slate-900 dark:text-white">
              {ocrResult.doctorName}
            </div>
          </div>
        </div>
      </div>

      {onConfirm && (
        <button
          onClick={onConfirm}
          className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <CheckCircle2 className="w-4 h-4" /> Save Extracted Medicine to
          Schedule
        </button>
      )}
    </div>
  );
}
