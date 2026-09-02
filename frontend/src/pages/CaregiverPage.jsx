import React, { useState } from "react";
import { Users, AlertTriangle, CheckCircle2, PhoneCall } from "lucide-react";

const PATIENTS_DATA = [
  {
    id: "p1",
    name: "Alex Morgan (Self)",
    age: 68,
    adherence: "92%",
    status: "Normal",
    missedDoses: 1,
    lastTaken: "Today, 08:00 AM",
    conditions: ["Diabetes", "Blood Pressure"],
  },
  {
    id: "p2",
    name: "Eleanor Morgan (Mother)",
    age: 84,
    adherence: "78%",
    status: "Attention Needed",
    missedDoses: 3,
    lastTaken: "Yesterday, 09:00 PM",
    conditions: ["Thyroid", "Heart"],
  },
  {
    id: "p3",
    name: "Robert Morgan (Father)",
    age: 86,
    adherence: "95%",
    status: "Normal",
    missedDoses: 0,
    lastTaken: "Today, 08:30 AM",
    conditions: ["Vitamins", "Blood Pressure"],
  },
];

export default function CaregiverPage() {
  const [patients] = useState(PATIENTS_DATA);

  const notifyEmergency = (patientName) => {
    alert(
      `Emergency notification sent to caregiver hotline for ${patientName}!`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2 border border-emerald-200 dark:border-emerald-800">
          <Users className="w-3.5 h-3.5" />
          Caregiver & Family Monitoring Portal
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Assigned Patient Profiles & Emergency Alert Feed
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor multi-patient adherence, receive instant missed-dose push
          alerts, and manage family profiles.
        </p>
      </div>

      {/* Patient Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {patient.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Age {patient.age} &bull; {patient.conditions.join(", ")}
                </p>
              </div>

              {patient.missedDoses > 1 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Alert
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Healthy
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block font-medium text-[10px]">
                  Adherence Rate
                </span>
                <strong className="text-slate-900 dark:text-white text-base font-bold">
                  {patient.adherence}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium text-[10px]">
                  Missed Doses
                </span>
                <strong className="text-rose-600 dark:text-rose-400 text-base font-bold">
                  {patient.missedDoses}
                </strong>
              </div>
            </div>

            <button
              onClick={() => notifyEmergency(patient.name)}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-900 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
              Contact Patient / Emergency Trigger
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
