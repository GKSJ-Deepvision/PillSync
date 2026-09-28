import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  TrendingUp,
} from "lucide-react";

const Adherence = () => {
 // Temporary mock medication history data
const medicationHistory = [
  // Monday
  {
    id: 1,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-21",
    time: "08:00 AM",
    status: "Taken",
  },
  {
    id: 2,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-21",
    time: "08:00 PM",
    status: "Taken",
  },
  {
    id: 3,
    medicine: "Lisinopril",
    dosage: "10mg",
    date: "2026-09-21",
    time: "01:00 PM",
    status: "Taken",
  },
  {
    id: 4,
    medicine: "Atorvastatin",
    dosage: "20mg",
    date: "2026-09-21",
    time: "08:00 PM",
    status: "Missed",
  },

  // Tuesday
  {
    id: 5,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-22",
    time: "08:00 AM",
    status: "Taken",
  },
  {
    id: 6,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-22",
    time: "08:00 PM",
    status: "Taken",
  },
  {
    id: 7,
    medicine: "Lisinopril",
    dosage: "10mg",
    date: "2026-09-22",
    time: "01:00 PM",
    status: "Taken",
  },
  {
    id: 8,
    medicine: "Atorvastatin",
    dosage: "20mg",
    date: "2026-09-22",
    time: "08:00 PM",
    status: "Taken",
  },

  // Wednesday
  {
    id: 9,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-23",
    time: "08:00 AM",
    status: "Taken",
  },
  {
    id: 10,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-23",
    time: "08:00 PM",
    status: "Missed",
  },
  {
    id: 11,
    medicine: "Lisinopril",
    dosage: "10mg",
    date: "2026-09-23",
    time: "01:00 PM",
    status: "Taken",
  },

  // Thursday
  {
    id: 12,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-24",
    time: "08:00 AM",
    status: "Taken",
  },
  {
    id: 13,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-24",
    time: "08:00 PM",
    status: "Taken",
  },
  {
    id: 14,
    medicine: "Lisinopril",
    dosage: "10mg",
    date: "2026-09-24",
    time: "01:00 PM",
    status: "Taken",
  },
  {
    id: 15,
    medicine: "Atorvastatin",
    dosage: "20mg",
    date: "2026-09-24",
    time: "08:00 PM",
    status: "Taken",
  },

  // Friday
  {
    id: 16,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-25",
    time: "08:00 AM",
    status: "Taken",
  },
  {
    id: 17,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-25",
    time: "08:00 PM",
    status: "Missed",
  },
  {
    id: 18,
    medicine: "Lisinopril",
    dosage: "10mg",
    date: "2026-09-25",
    time: "01:00 PM",
    status: "Taken",
  },
  {
    id: 19,
    medicine: "Atorvastatin",
    dosage: "20mg",
    date: "2026-09-25",
    time: "08:00 PM",
    status: "Missed",
  },

  // Saturday
  {
    id: 20,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-26",
    time: "08:00 AM",
    status: "Taken",
  },
  {
    id: 21,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-26",
    time: "08:00 PM",
    status: "Taken",
  },
  {
    id: 22,
    medicine: "Lisinopril",
    dosage: "10mg",
    date: "2026-09-26",
    time: "01:00 PM",
    status: "Taken",
  },
  {
    id: 23,
    medicine: "Atorvastatin",
    dosage: "20mg",
    date: "2026-09-26",
    time: "08:00 PM",
    status: "Taken",
  },

  // Sunday
  {
    id: 24,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-27",
    time: "08:00 AM",
    status: "Taken",
  },
  {
    id: 25,
    medicine: "Metformin",
    dosage: "500mg",
    date: "2026-09-27",
    time: "08:00 PM",
    status: "Taken",
  },
  {
    id: 26,
    medicine: "Lisinopril",
    dosage: "10mg",
    date: "2026-09-27",
    time: "01:00 PM",
    status: "Taken",
  },
  {
    id: 27,
    medicine: "Atorvastatin",
    dosage: "20mg",
    date: "2026-09-27",
    time: "08:00 PM",
    status: "Missed",
  },
];
// Calculate adherence statistics
const totalDoses = medicationHistory.length;

const takenDoses = medicationHistory.filter(
  (dose) => dose.status === "Taken"
).length;

const missedDoses = medicationHistory.filter(
  (dose) => dose.status === "Missed"
).length;

const overallAdherence =
  totalDoses > 0
    ? Math.round((takenDoses / totalDoses) * 100)
    : 0;

// Today's medication records
const todayMedicines = medicationHistory
  .filter((dose) => dose.date === "2026-09-23")
  .map((dose) => ({
    id: dose.id,
    name: dose.medicine,
    dosage: dose.dosage,
    time: dose.time,
    status: dose.status,
  }));

// Medicine-wise adherence
const medicineNames = [
  ...new Set(medicationHistory.map((dose) => dose.medicine)),
];

const medicineAdherence = medicineNames.map((medicine) => {
  const medicineDoses = medicationHistory.filter(
    (dose) => dose.medicine === medicine
  );

  const taken = medicineDoses.filter(
    (dose) => dose.status === "Taken"
  ).length;

  const percentage =
    medicineDoses.length > 0
      ? Math.round((taken / medicineDoses.length) * 100)
      : 0;

  return {
    name: medicine,
    percentage,
  };
});

// Calculate daily adherence from medication history
const dailyAdherence = {};

medicationHistory.forEach((dose) => {
  if (!dailyAdherence[dose.date]) {
    dailyAdherence[dose.date] = {
      total: 0,
      taken: 0,
    };
  }

  dailyAdherence[dose.date].total += 1;

  if (dose.status === "Taken") {
    dailyAdherence[dose.date].taken += 1;
  }
});

const weeklyAdherence = Object.entries(dailyAdherence)
  .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
  .map(([date, data]) => ({
    day: new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
    }),
    percentage:
      data.total > 0
        ? Math.round((data.taken / data.total) * 100)
        : 0,
  }));
  return (
    <div
      className="max-w-6xl mx-auto space-y-6 animate-fade-in"
      data-testid="adherence-page"
    >
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
          Adherence Analytics
        </h1>

        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Track your medication intake and adherence history.
        </p>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* OVERALL ADHERENCE */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">
                Overall Adherence
              </p>

              <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                {overallAdherence}%
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            Based on your recent medication history
          </p>
        </div>

        {/* TAKEN DOSES */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">
                Doses Taken
              </p>

              <p className="text-3xl font-extrabold text-slate-800 mt-2">
                {takenDoses}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            Successfully completed doses
          </p>
        </div>

        {/* MISSED DOSES */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">
                Doses Missed
              </p>

              <p className="text-3xl font-extrabold text-slate-800 mt-2">
                {missedDoses}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-red-50 text-red-500">
              <XCircle className="h-5 w-5" />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            Missed doses in recent history
          </p>
        </div>
      </div>

      {/* TODAY'S MEDICATION */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-slate-800">
                Today's Medication
              </h2>

              <p className="text-[11px] text-slate-400 mt-1">
                Medication intake status for today
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {todayMedicines.map((medicine) => (
            <div
              key={medicine.id}
              className="p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Activity className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-extrabold text-slate-800">
                    {medicine.name}
                  </p>

                  <p className="text-[11px] text-slate-500 mt-1">
                    {medicine.dosage}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  {medicine.time}
                </div>

                {medicine.status === "Taken" ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Taken
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-red-50 text-red-600">
                    <XCircle className="h-3.5 w-3.5" />
                    Missed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WEEKLY ADHERENCE */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Activity className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-slate-800">
              Weekly Adherence
            </h2>

            <p className="text-[11px] text-slate-400 mt-1">
              Your adherence percentage over the last 7 days
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {weeklyAdherence.map((item) => (
            <div
              key={item.day}
              className="flex items-center gap-3"
            >
              <span className="w-8 text-[11px] font-bold text-slate-500">
                {item.day}
              </span>

              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              <span className="w-10 text-right text-[11px] font-bold text-slate-700">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MEDICINE-WISE ADHERENCE */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-800">
            Medicine-wise Adherence
          </h2>

          <p className="text-[11px] text-slate-400 mt-1">
            Adherence performance for each medication
          </p>
        </div>

        <div className="p-5 space-y-5">
          {medicineAdherence.map((medicine) => (
            <div key={medicine.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  {medicine.name}
                </span>

                <span className="text-xs font-extrabold text-emerald-600">
                  {medicine.percentage}%
                </span>
              </div>

              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${medicine.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADHERENCE SUMMARY */}
<div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
      <TrendingUp className="h-5 w-5" />
    </div>

    <div>
      <h2 className="text-sm font-extrabold text-slate-800">
        Adherence Summary
      </h2>

      <p className="text-[11px] text-slate-400 mt-1">
        Summary based on your medication history
      </p>
    </div>
  </div>

  <div className="bg-slate-50 rounded-xl p-4">
    <p className="text-xs text-slate-600 leading-relaxed">
      You have taken{" "}
      <span className="font-extrabold text-emerald-600">
        {takenDoses}
      </span>{" "}
      out of{" "}
      <span className="font-extrabold text-slate-800">
        {totalDoses}
      </span>{" "}
      scheduled doses, resulting in an overall adherence of{" "}
      <span className="font-extrabold text-emerald-600">
        {overallAdherence}%
      </span>.
    </p>

    <div className="mt-3 flex items-center gap-2">
      {overallAdherence >= 80 ? (
        <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
          Good adherence
        </span>
      ) : (
        <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-orange-50 text-orange-700">
          Needs attention
        </span>
      )}
        </div>
  </div>
  </div>
</div>
  );
};

export default Adherence;