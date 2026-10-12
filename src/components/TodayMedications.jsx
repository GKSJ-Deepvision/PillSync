import { useState } from "react";
import { Calendar, Check, Clock, Pill, X } from "lucide-react";
import { TODAY_MEDICATIONS } from "../data/mockData";

const TodayMedications = () => {
  const [medications, setMedications] = useState(TODAY_MEDICATIONS);

  const handleStatus = (id, status) => {
    setMedications((prev) =>
      prev.map((medicine) =>
        medicine.id === id
          ? { ...medicine, status }
          : medicine
      )
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <Calendar className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Today's Medications
            </h2>

            <p className="text-sm text-slate-500">
              Your medications scheduled for today
            </p>
          </div>
        </div>
      </div>

      {/* Medication list */}
      <div className="p-6 space-y-4">
        {medications.map((medicine) => (
          <div
            key={medicine.id}
            className="border border-slate-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between gap-4">

              {/* Medicine information */}
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <Pill className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-800">
                    {medicine.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {medicine.dosage} • {medicine.frequency}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <Clock className="h-4 w-4" />
                    {medicine.time}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">

                {medicine.status === "taken" ? (
                  <span className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-semibold">
                    ✓ Taken
                  </span>
                ) : medicine.status === "skipped" ? (
                  <span className="px-3 py-2 rounded-lg bg-red-50 text-red-500 text-sm font-semibold">
                    Skipped
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        handleStatus(medicine.id, "taken")
                      }
                      className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4 inline mr-1" />
                      Take
                    </button>

                    <button
                      onClick={() =>
                        handleStatus(medicine.id, "skipped")
                      }
                      className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                    >
                      <X className="h-4 w-4 inline mr-1" />
                      Skip
                    </button>
                  </>
                )}

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodayMedications;