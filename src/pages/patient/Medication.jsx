import { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import {
  Pill,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Bell,
  CalendarDays,
  Edit3,
  Trash2,
  X,
  AlarmClock,
} from 'lucide-react';

const initialMedications = [
  {
    id: 1,
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    time: '8:00 AM',
    status: 'Taken',
    color: 'purple',
  },
  {
    id: 2,
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    time: '8:00 AM',
    status: 'Taken',
    color: 'blue',
  },
  {
    id: 3,
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    time: '8:00 PM',
    status: 'Pending',
    color: 'purple',
  },
  {
    id: 4,
    name: 'Atorvastatin',
    dosage: '20mg',
    frequency: 'Once daily',
    time: '9:00 PM',
    status: 'Pending',
    color: 'pink',
  },
];

const Medication = () => {
  const [medications, setMedications] = useState(initialMedications);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);

  const [form, setForm] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    time: '',
  });

  const markAsTaken = (id) => {
    setMedications((prev) =>
      prev.map((med) =>
        med.id === id ? { ...med, status: 'Taken' } : med
      )
    );
  };

  const snoozeMedication = (id) => {
    alert('Reminder snoozed for 15 minutes.');
  };

  const deleteMedication = (id) => {
    setMedications((prev) => prev.filter((med) => med.id !== id));
    setSelectedMedication(null);
  };

  const addMedication = (e) => {
    e.preventDefault();

    if (!form.name || !form.dosage || !form.time) {
      alert('Please fill all required fields.');
      return;
    }

    const newMedication = {
      id: Date.now(),
      name: form.name,
      dosage: form.dosage,
      frequency: form.frequency,
      time: form.time,
      status: 'Pending',
      color: 'purple',
    };

    setMedications((prev) => [...prev, newMedication]);

    setForm({
      name: '',
      dosage: '',
      frequency: 'Once daily',
      time: '',
    });

    setShowAdd(false);
  };

  const takenCount = medications.filter(
    (med) => med.status === 'Taken'
  ).length;

  const progress =
    medications.length > 0
      ? Math.round((takenCount / medications.length) * 100)
      : 0;

  return (
    <div
      className="max-w-5xl mx-auto space-y-6 animate-fade-in"
      data-testid="medication-page"
    >

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Pill className="h-5 w-5 text-purple-600" />
            Medications & Reminders
          </h1>

          <p className="text-xs text-slate-450 mt-1 font-medium">
            Manage your medications and daily reminder schedule.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowAdd(true)}
          className="!py-2 !px-4 text-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Medication
        </Button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <Card className="p-5 border border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Today's Medications
              </p>

              <h2 className="text-2xl font-extrabold text-slate-800 mt-1">
                {medications.length}
              </h2>
            </div>

            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <Pill className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Taken Today
              </p>

              <h2 className="text-2xl font-extrabold text-slate-800 mt-1">
                {takenCount}
              </h2>
            </div>

            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Daily Progress
              </p>

              <h2 className="text-2xl font-extrabold text-slate-800 mt-1">
                {progress}%
              </h2>
            </div>

            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
        </Card>

      </div>

      {/* TODAY'S SCHEDULE */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">
              Today's Medication Schedule
            </h2>

            <p className="text-[11px] text-slate-400 mt-1">
              Stay on track with your medication reminders.
            </p>
          </div>

          <Bell className="h-5 w-5 text-purple-500" />
        </div>

        <div className="space-y-3">

          {medications.map((med) => (

            <div
              key={med.id}
              className="border border-slate-100 rounded-xl p-4 hover:border-purple-200 hover:bg-purple-50/20 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                {/* MEDICINE INFO */}
                <div className="flex items-center gap-3">

                  <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                    <Pill className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {med.name}
                    </h3>

                    <p className="text-xs text-slate-500 mt-0.5">
                      {med.dosage} • {med.frequency}
                    </p>

                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-slate-400" />

                      <span className="text-[11px] text-slate-400">
                        {med.time}
                      </span>
                    </div>
                  </div>

                </div>

                {/* STATUS + ACTIONS */}
                <div className="flex items-center gap-2">

                  {med.status === 'Taken' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Taken
                    </span>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        className="!py-1.5 !px-3 text-[10px]"
                        onClick={() => markAsTaken(med.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Taken
                      </Button>

                      <Button
                        variant="outline"
                        className="!py-1.5 !px-3 text-[10px]"
                        onClick={() => snoozeMedication(med.id)}
                      >
                        <AlarmClock className="h-3.5 w-3.5 mr-1" />
                        Snooze
                      </Button>
                    </>
                  )}

                  <button
                    onClick={() => setSelectedMedication(med)}
                    className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                </div>

              </div>
            </div>

          ))}

        </div>
      </Card>

      {/* UPCOMING REMINDERS */}
      <Card className="p-5">

        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-purple-600" />

          <div>
            <h2 className="text-sm font-extrabold text-slate-800">
              Upcoming Reminders
            </h2>

            <p className="text-[11px] text-slate-400">
              Your next scheduled medication reminders.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          {medications
            .filter((med) => med.status === 'Pending')
            .map((med) => (

              <div
                key={med.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-purple-50/60 border border-purple-100"
              >

                <div className="p-2.5 rounded-lg bg-white text-purple-600">
                  <Clock className="h-4 w-4" />
                </div>

                <div className="flex-1">
                  <h3 className="text-xs font-bold text-slate-800">
                    {med.name}
                  </h3>

                  <p className="text-[10px] text-slate-500">
                    {med.dosage}
                  </p>
                </div>

                <span className="text-xs font-bold text-purple-700">
                  {med.time}
                </span>

              </div>

            ))}

        </div>

      </Card>

      {/* ADD MEDICATION MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            <div className="flex items-center justify-between p-5 border-b border-slate-100">

              <div>
                <h2 className="text-base font-extrabold text-slate-800">
                  Add Medication
                </h2>

                <p className="text-[11px] text-slate-400 mt-1">
                  Add a medicine to your reminder schedule.
                </p>
              </div>

              <button
                onClick={() => setShowAdd(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>

            </div>

            <form
              onSubmit={addMedication}
              className="p-5 space-y-4"
            >

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Medicine Name
                </label>

                <input
                  type="text"
                  placeholder="e.g. Paracetamol"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Dosage
                </label>

                <input
                  type="text"
                  placeholder="e.g. 500mg"
                  value={form.dosage}
                  onChange={(e) =>
                    setForm({ ...form, dosage: e.target.value })
                  }
                  className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
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
                  className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                >
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times daily</option>
                  <option>As needed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Reminder Time
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
                  className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                />
              </div>

              <div className="flex gap-3 pt-2">

                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  Save Medication
                </Button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* MEDICATION DETAILS */}
      {selectedMedication && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

            <div className="flex justify-between items-start">

              <div className="flex items-center gap-3">

                <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                  <Pill className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-slate-800">
                    {selectedMedication.name}
                  </h2>

                  <p className="text-xs text-slate-400">
                    Medication Details
                  </p>
                </div>

              </div>

              <button
                onClick={() => setSelectedMedication(null)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            <div className="mt-6 space-y-3">

              <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-xs text-slate-500">
                  Dosage
                </span>

                <span className="text-xs font-bold text-slate-800">
                  {selectedMedication.dosage}
                </span>
              </div>

              <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-xs text-slate-500">
                  Frequency
                </span>

                <span className="text-xs font-bold text-slate-800">
                  {selectedMedication.frequency}
                </span>
              </div>

              <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-xs text-slate-500">
                  Reminder
                </span>

                <span className="text-xs font-bold text-slate-800">
                  {selectedMedication.time}
                </span>
              </div>

              <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-xs text-slate-500">
                  Status
                </span>

                <span
                  className={`text-xs font-bold ${
                    selectedMedication.status === 'Taken'
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {selectedMedication.status}
                </span>
              </div>

            </div>

            <div className="flex gap-3 mt-6">

              <Button
                variant="outline"
                className="flex-1 !text-red-600"
                onClick={() =>
                  deleteMedication(selectedMedication.id)
                }
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>

              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setSelectedMedication(null)}
              >
                Close
              </Button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Medication;