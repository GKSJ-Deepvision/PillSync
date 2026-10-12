import { useState } from "react";

import {
  Pill,
  Plus,
  Clock,
  CalendarDays,
  Edit3,
  Trash2,
  X,
  Bell,
  CheckCircle2,
  Upload,
  FileText,
  Loader2,
} from 'lucide-react';
const initialMedicines = [
  {
    id: 1,
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    times: ['08:00 AM', '08:00 PM'],
    status: 'Active',
    compliance: 95,
  },
  {
    id: 2,
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    times: ['08:00 AM'],
    status: 'Active',
    compliance: 90,
  },
  {
    id: 3,
    name: 'Atorvastatin',
    dosage: '20mg',
    frequency: 'Once daily (Night)',
    times: ['09:00 PM'],
    status: 'Active',
    compliance: 85,
  },
];

const Medicines = () => {
  const [medicines, setMedicines] = useState(initialMedicines);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    time: '',
  });

 const handleFileChange = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  setSelectedFile(file);
  setOcrResult(null);
};

const handleProcessOCR = () => {
  if (!selectedFile) {
    alert("Please select a prescription image first.");
    return;
  }

  setIsProcessing(true);

  // Temporary mock OCR result
  setTimeout(() => {
    setOcrResult({
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      time: "08:00 AM",
    });

    setIsProcessing(false);
  }, 1500);
};
const handleAddOCRMedicine = () => {
  if (!ocrResult) return;

  if (!ocrResult.name || !ocrResult.dosage) {
    alert("Please enter the medicine name and dosage.");
    return;
  }

  const newMedicine = {
    id: Date.now(),
    name: ocrResult.name.trim(),
    dosage: ocrResult.dosage.trim(),
    frequency: ocrResult.frequency || "Once daily",
    times: ocrResult.time ? [ocrResult.time] : [],
    instructions: ocrResult.instructions || "",
    quantity: Number(ocrResult.quantity) || 0,
    refillThreshold: Number(ocrResult.refillThreshold) || 0,
    status: "Active",
    compliance: 100,
  };

  setMedicines((prev) => [...prev, newMedicine]);

  setSelectedFile(null);
  setOcrResult(null);

  alert("Medicine added successfully.");
};
const handleDelete = (id) => {
  setMedicines((prev) =>
    prev.filter((medicine) => medicine.id !== id)
  );

  setSelectedMedicine(null);
};
const handleAddMedicine = (e) => {
  e.preventDefault();

  if (!form.name.trim() || !form.dosage.trim() || !form.time) {
    alert("Please fill in all required fields.");
    return;
  }

  const newMedicine = {
    id: Date.now(),
    name: form.name.trim(),
    dosage: form.dosage.trim(),
    frequency: form.frequency,
    times: [form.time],
    status: "Active",
    compliance: 100,
  };

  setMedicines((prev) => [...prev, newMedicine]);

  setForm({
    name: "",
    dosage: "",
    frequency: "Once daily",
    time: "",
  });

  setShowAddModal(false);
};

  return (
    <div
      className="max-w-5xl mx-auto space-y-6 animate-fade-in"
      data-testid="medicines-page"
    >
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Pill className="h-5 w-5 text-emerald-600" />
            Prescriptions & Medicines
          </h1>

          <p className="text-xs text-slate-400 mt-1 font-medium">
            Manage your active medications and dosage information.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Medication
        </button>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">
                Active Medicines
              </p>

              <h2 className="text-2xl font-extrabold text-slate-800 mt-1">
                {medicines.length}
              </h2>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Pill className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">
                Scheduled Today
              </p>

              <h2 className="text-2xl font-extrabold text-slate-800 mt-1">
                {medicines.reduce(
                  (total, medicine) =>
                    total + medicine.times.length,
                  0
                )}
              </h2>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">
                Reminder Status
              </p>

              <h2 className="text-lg font-extrabold text-emerald-600 mt-1">
                Active
              </h2>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Bell className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
      {/* ================= OCR PRESCRIPTION ================= */}
<div className="bg-white border border-slate-100 rounded-2xl shadow-sm mb-6">
  <div className="p-5 border-b border-slate-100">
    <div className="flex items-center gap-2">
      <FileText className="h-5 w-5 text-emerald-600" />

      <div>
        <h2 className="text-sm font-extrabold text-slate-800">
          Prescription Scanner
        </h2>

        <p className="text-[11px] text-slate-400 mt-1">
          Upload a prescription to extract medicine information.
        </p>
      </div>
    </div>
  </div>

  <div className="p-5">
    <label
      htmlFor="prescription-upload"
      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all"
    >
      <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
        <Upload className="h-7 w-7" />
      </div>

      <h3 className="text-sm font-bold text-slate-700 mt-4">
        Upload Prescription
      </h3>

      <p className="text-xs text-slate-400 mt-1 text-center">
        Select a prescription image to extract medicine details.
      </p>

      <span className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
        Choose File
      </span>

      <input
        id="prescription-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </label>

    {selectedFile && (
      <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-emerald-600" />

            <div>
              <p className="text-xs font-bold text-slate-700">
                {selectedFile.name}
              </p>

              <p className="text-[10px] text-slate-400 mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <button
            onClick={handleProcessOCR}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Process Prescription"
            )}
          </button>
        </div>
      </div>
    )}
  </div>
</div>
{/* ================= OCR RESULT ================= */}
{ocrResult && (
  <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm mb-6">
    <div className="p-5 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />

        <div>
          <h2 className="text-sm font-extrabold text-slate-800">
            OCR Result
          </h2>

          <p className="text-[11px] text-slate-400 mt-1">
            Review and edit the extracted medicine information before adding it.
          </p>
        </div>
      </div>
    </div>

    <div className="p-5 space-y-4">

      {/* EXTRACTED TEXT */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Extracted Text
        </label>

        <textarea
          value={ocrResult.extractedText || "Metformin Tablets 500mg"}
          onChange={(e) =>
            setOcrResult({
              ...ocrResult,
              extractedText: e.target.value,
            })
          }
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* MEDICINE NAME */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Medicine Name
        </label>

        <input
          type="text"
          value={ocrResult.name || ""}
          onChange={(e) =>
            setOcrResult({
              ...ocrResult,
              name: e.target.value,
            })
          }
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* DOSAGE */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Dosage
        </label>

        <input
          type="text"
          value={ocrResult.dosage || ""}
          onChange={(e) =>
            setOcrResult({
              ...ocrResult,
              dosage: e.target.value,
            })
          }
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* INSTRUCTIONS */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Instructions
        </label>

        <input
          type="text"
          value={ocrResult.instructions || ""}
          onChange={(e) =>
            setOcrResult({
              ...ocrResult,
              instructions: e.target.value,
            })
          }
          placeholder="e.g. Take after food"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* QUANTITY + REFILL THRESHOLD */}
      <div className="grid grid-cols-2 gap-3">

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Quantity
          </label>

          <input
            type="number"
            value={ocrResult.quantity || ""}
            onChange={(e) =>
              setOcrResult({
                ...ocrResult,
                quantity: e.target.value,
              })
            }
            placeholder="20"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Refill Threshold
          </label>

          <input
            type="number"
            value={ocrResult.refillThreshold || ""}
            onChange={(e) =>
              setOcrResult({
                ...ocrResult,
                refillThreshold: e.target.value,
              })
            }
            placeholder="5"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

      </div>

      {/* BUTTONS */}
      <div className="flex gap-3 pt-2">

        <button
          onClick={() => setOcrResult(null)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          onClick={handleAddOCRMedicine}
          className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
        >
          Add to Medicines
        </button>

      </div>
    </div>
  </div>
)}

      {/* ================= MEDICINE LIST ================= */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-emerald-600" />

            <div>
              <h2 className="text-sm font-extrabold text-slate-800">
                Active Medications
              </h2>

              <p className="text-[11px] text-slate-400 mt-1">
                Your current prescription and dosage details.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {medicines.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center">
                <Pill className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="text-sm font-bold text-slate-700 mt-4">
                No Medications Added
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Add your first medication to start tracking.
              </p>

              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                <Plus className="inline h-4 w-4 mr-1" />
                Add Medication
              </button>
            </div>
          ) : (
            medicines.map((medicine) => (
              <div
                key={medicine.id}
                className="border border-slate-100 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* MEDICINE INFORMATION */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                      <Pill className="h-6 w-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-800">
                          {medicine.name}
                        </h3>

                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          {medicine.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        {medicine.dosage} • {medicine.frequency}
                      </p>
                      {/* OCR MEDICINE DETAILS */}
{(medicine.instructions ||
  medicine.quantity ||
  medicine.refillThreshold) && (
  <div className="mt-3 space-y-1.5">

    {medicine.instructions && (
      <p className="text-[11px] text-slate-500">
        <span className="font-bold text-slate-600">
          Instructions:
        </span>{" "}
        {medicine.instructions}
      </p>
    )}

    {medicine.quantity > 0 && (
      <p className="text-[11px] text-slate-500">
        <span className="font-bold text-slate-600">
          Quantity:
        </span>{" "}
        {medicine.quantity}
      </p>
    )}

    {medicine.refillThreshold > 0 && (
      <p className="text-[11px] text-slate-500">
        <span className="font-bold text-slate-600">
          Refill at:
        </span>{" "}
        {medicine.refillThreshold}
      </p>
    )}

  </div>
)}
                      {/* TIMES */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />

                        {medicine.times.map((time) => (
                          <span
                            key={time}
                            className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg"
                          >
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* COMPLIANCE + ACTIONS */}
                  <div className="flex items-center justify-between lg:justify-end gap-5">
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-slate-400">
                        Compliance
                      </p>

                      <p className="text-sm font-extrabold text-slate-700">
                        {medicine.compliance}%
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setSelectedMedicine(medicine)
                        }
                        className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                        title="View details"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(medicine.id)
                        }
                        className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                        title="Delete medication"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= REMINDER INFORMATION ================= */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-100 text-purple-600 shrink-0">
            <Bell className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-purple-950">
              Medication Reminders
            </h3>

            <p className="text-[11px] leading-relaxed text-purple-800 mt-1">
              Your medication schedule is displayed with reminder
              times. Upcoming reminder notifications can be managed
              from the Schedule and Notifications sections.
            </p>
          </div>
        </div>
      </div>

      {/* ================= ADD MEDICATION MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">
                  Add Medication
                </h2>

                <p className="text-[11px] text-slate-400 mt-1">
                  Add medication details and reminder time.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleAddMedicine}
              className="p-5 space-y-4"
            >
              {/* MEDICINE NAME */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Medicine Name *
                </label>

                <input
                  type="text"
                  placeholder="e.g. Paracetamol"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* DOSAGE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dosage *
                </label>

                <input
                  type="text"
                  placeholder="e.g. 500mg"
                  value={form.dosage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dosage: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* FREQUENCY */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Frequency
                </label>

                <select
                  value={form.frequency}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      frequency: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times daily</option>
                  <option>Once daily (Night)</option>
                  <option>As needed</option>
                </select>
              </div>

              {/* REMINDER TIME */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reminder Time *
                </label>

                <input
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      time: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Save Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DETAILS MODAL ================= */}
      {selectedMedicine && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* HEADER */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <Pill className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-slate-800">
                    {selectedMedicine.name}
                  </h2>

                  <p className="text-[11px] text-slate-400">
                    Medication Details
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMedicine(null)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

  {/* DETAILS */}
<div className="p-5 space-y-3">

  {/* DOSAGE */}
  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
    <span className="text-xs text-slate-500">
      Dosage
    </span>

    <span className="text-xs font-bold text-slate-800">
      {selectedMedicine.dosage}
    </span>
  </div>

  {/* FREQUENCY */}
  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
    <span className="text-xs text-slate-500">
      Frequency
    </span>

    <span className="text-xs font-bold text-slate-800">
      {selectedMedicine.frequency || "Once daily"}
    </span>
  </div>

  {/* INSTRUCTIONS */}
  {selectedMedicine.instructions && (
    <div className="p-3 rounded-xl bg-slate-50">
      <span className="text-xs text-slate-500">
        Instructions
      </span>

      <p className="text-xs font-bold text-slate-800 mt-1">
        {selectedMedicine.instructions}
      </p>
    </div>
  )}

  {/* QUANTITY + REFILL THRESHOLD */}
  {(selectedMedicine.quantity > 0 ||
    selectedMedicine.refillThreshold > 0) && (
    <div className="grid grid-cols-2 gap-3">

      {selectedMedicine.quantity > 0 && (
        <div className="p-3 rounded-xl bg-slate-50">
          <span className="text-xs text-slate-500">
            Quantity
          </span>

          <p className="text-xs font-bold text-slate-800 mt-1">
            {selectedMedicine.quantity}
          </p>
        </div>
      )}

      {selectedMedicine.refillThreshold > 0 && (
        <div className="p-3 rounded-xl bg-slate-50">
          <span className="text-xs text-slate-500">
            Refill At
          </span>

          <p className="text-xs font-bold text-slate-800 mt-1">
            {selectedMedicine.refillThreshold}
          </p>
        </div>
      )}

    </div>
  )}

  {/* REMINDER TIMES */}
  <div className="p-3 rounded-xl bg-slate-50">
    <span className="text-xs text-slate-500">
      Reminder Times
    </span>

    <div className="flex gap-2 flex-wrap mt-2">
      {selectedMedicine.times?.length > 0 ? (
        selectedMedicine.times.map((time) => (
          <span
            key={time}
            className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-lg"
          >
            <Clock className="h-3.5 w-3.5" />
            {time}
          </span>
        ))
      ) : (
        <span className="text-xs text-slate-400">
          No reminder time added
        </span>
      )}
    </div>
  </div>

  {/* COMPLIANCE */}
  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
    <span className="text-xs text-slate-500">
      Compliance
    </span>

    <span className="text-xs font-bold text-emerald-600">
      {selectedMedicine.compliance}%
    </span>
  </div>

  {/* ACTIVE STATUS */}
  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700">
    <CheckCircle2 className="h-4 w-4" />

    <span className="text-xs font-bold">
      Medication is currently active
    </span>
  </div>

</div>

            {/* ACTIONS */}
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() =>
                  handleDelete(selectedMedicine.id)
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>

              <button
                onClick={() => setSelectedMedicine(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicines;