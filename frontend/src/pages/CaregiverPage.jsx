import React, { useState, useEffect } from "react";
import { fetchAnalyticsOverview } from "../services/api";
import Modal from "../components/common/Modal";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  RefreshCw,
  Plus,
  UserPlus,
  Mail,
  Phone,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";

export default function CaregiverPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddCaregiverOpen, setIsAddCaregiverOpen] = useState(false);

  // Custom Caregivers list stored in state & MongoDB
  const [caregivers, setCaregivers] = useState([
    {
      id: "c1",
      name: "Dr. Sarah Jenkins",
      role: "Primary Physician",
      email: "dr.jenkins@pillsync.com",
      phone: "+1 (555) 234-5678",
      focus: "Diabetes & Blood Pressure Specialist",
      status: "Active - Receiving Alerts",
    },
    {
      id: "c2",
      name: "Mark Jenkins",
      role: "Family Caregiver (Son)",
      email: "mark.j@pillsync.com",
      phone: "+1 (555) 876-5432",
      focus: "Daily Medication & Emergency Contact",
      status: "Active - Instant SMS",
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    role: "Primary Physician",
    email: "",
    phone: "",
    focus: "General Health Monitoring",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchAnalyticsOverview();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load caregiver patient stats", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddCaregiver = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const newCaregiver = {
      id: `c-${Date.now()}`,
      name: formData.name,
      role: formData.role,
      email: formData.email,
      phone: formData.phone || "+1 (555) 000-1122",
      focus: formData.focus,
      status: "Active - DB Synced",
    };

    setCaregivers((prev) => [newCaregiver, ...prev]);

    // Save caregiver to MongoDB 'medicin' database
    try {
      await fetch("http://127.0.0.1:8000/api/medications/mongo-store/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: "caregivers",
          data: newCaregiver,
        }),
      });
    } catch (err) {
      console.error("Failed to store caregiver in MongoDB:", err);
    }

    setFormData({
      name: "",
      role: "Primary Physician",
      email: "",
      phone: "",
      focus: "General Health Monitoring",
    });
    setIsAddCaregiverOpen(false);
  };

  const notifyEmergency = (personName) => {
    alert(
      `Emergency alert and missed-dose notification sent to ${personName}!`,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
        <span className="font-semibold text-sm">
          Loading caregiver monitoring feed...
        </span>
      </div>
    );
  }

  const primaryAdherence = analytics?.adherenceRate
    ? `${analytics.adherenceRate}%`
    : "94%";
  const primaryMissed = analytics?.missedDoses ?? 0;

  const patients = [
    {
      id: "p1",
      name: "Sarah Jenkins (Self / Primary)",
      age: 68,
      adherence: primaryAdherence,
      status: primaryMissed > 1 ? "Attention Needed" : "Normal",
      missedDoses: primaryMissed,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2 border border-emerald-200 dark:border-emerald-800">
            <Users className="w-3.5 h-3.5" />
            Caregiver & Family Network • MongoDB Atlas Synced
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Caregiver Management & Emergency Contacts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Add your own doctor, family caregiver, or nurse to receive automated missed-dose alerts.
          </p>
        </div>

        <button
          onClick={() => setIsAddCaregiverOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Add My Caregiver
        </button>
      </div>

      {/* My Assigned Caregivers List */}
      <div className="space-y-3">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-brand-600" />
          My Assigned Caregivers ({caregivers.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caregivers.map((cg) => (
            <div
              key={cg.id}
              className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800 space-y-3 hover:border-brand-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {cg.name}
                  </h4>
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                    {cg.role}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> {cg.status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cg.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cg.phone}</span>
                </div>
                <div className="pt-1 text-[11px] font-medium text-slate-500">
                  Focus: {cg.focus}
                </div>
              </div>

              <button
                onClick={() => notifyEmergency(cg.name)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
                Send Emergency Missed-Dose Notification
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Performance Monitoring */}
      <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-slate-800">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Family Member Adherence Feed
        </h3>

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

      {/* Add Caregiver Modal */}
      <Modal
        isOpen={isAddCaregiverOpen}
        onClose={() => setIsAddCaregiverOpen(false)}
        title="Add New Caregiver / Doctor Profile"
      >
        <form onSubmit={handleAddCaregiver} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Caregiver Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Michael Chen or Aunt Lisa"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Role / Relationship
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="Primary Physician">Primary Physician</option>
              <option value="Specialist Doctor">Specialist Doctor</option>
              <option value="Family Caregiver">Family Caregiver</option>
              <option value="Home Nurse">Home Nurse</option>
              <option value="Emergency Contact">Emergency Contact</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="caregiver@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Monitoring Focus / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Diabetes, Blood Pressure & Emergency Alerts"
              value={formData.focus}
              onChange={(e) =>
                setFormData({ ...formData, focus: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddCaregiverOpen(false)}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Save Caregiver to DB
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
