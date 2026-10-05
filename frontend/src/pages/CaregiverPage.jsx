import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAnalyticsOverview,
  fetchMedications,
  addMedication,
  takeDoseApi,
  deleteMedicationApi,
} from "../services/api";
import Modal from "../components/common/Modal";
import MedicineCard from "../components/medications/MedicineCard";
import AddMedicineModal from "../components/medications/AddMedicineModal";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  Plus,
  Pill,
  Clock,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  Download,
  Bell,
  ScanLine,
  Trash2,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";

const INITIAL_PATIENTS = [
  {
    id: "p1",
    name: "Sarah Jenkins",
    relation: "(Self / Primary)",
    age: 68,
    gender: "Female",
    adherence: "94%",
    adherenceNum: 94,
    status: "Healthy",
    missedDoses: 0,
    lastTaken: "Today, 08:00 AM",
    conditions: ["Diabetes", "Blood Pressure"],
    allergies: "Penicillin",
    emergencyContact: "+1 (555) 234-5678",
    assignedDoctor: "Dr. Sarah Jenkins",
    todaySchedule: [
      { time: "08:00 AM", med: "Metformin 500 mg", status: "taken" },
      { time: "01:00 PM", med: "Amlodipine 5 mg", status: "taken" },
      { time: "08:00 PM", med: "Metformin 500 mg", status: "pending" },
    ],
    medications: [
      {
        name: "Metformin",
        dosage: "500 mg",
        frequency: "2x daily (08:00 AM, 08:00 PM)",
        stock: 8,
      },
      {
        name: "Amlodipine",
        dosage: "5 mg",
        frequency: "1x daily (08:00 AM)",
        stock: 45,
      },
    ],
  },
  {
    id: "p2",
    name: "Eleanor Morgan",
    relation: "(Mother)",
    age: 84,
    gender: "Female",
    adherence: "78%",
    adherenceNum: 78,
    status: "Attention Needed",
    missedDoses: 3,
    lastTaken: "Yesterday, 09:00 PM",
    conditions: ["Thyroid", "Heart"],
    allergies: "Sulfa Drugs",
    emergencyContact: "+1 (555) 876-5432",
    assignedDoctor: "Mark Jenkins",
    todaySchedule: [
      { time: "08:00 AM", med: "Levothyroxine 50 mcg", status: "taken" },
      { time: "01:00 PM", med: "Vitamin D 1000 IU", status: "taken" },
      { time: "08:00 PM", med: "Atorvastatin 20 mg", status: "pending" },
    ],
    medications: [
      {
        name: "Levothyroxine",
        dosage: "50 mcg",
        frequency: "1x daily (08:00 AM)",
        stock: 28,
      },
      {
        name: "Atorvastatin",
        dosage: "20 mg",
        frequency: "1x daily (08:00 PM)",
        stock: 14,
      },
    ],
  },
  {
    id: "p3",
    name: "Robert Morgan",
    relation: "(Father)",
    age: 86,
    gender: "Male",
    adherence: "95%",
    adherenceNum: 95,
    status: "Healthy",
    missedDoses: 0,
    lastTaken: "Today, 08:30 AM",
    conditions: ["Vitamins", "Blood Pressure"],
    allergies: "None",
    emergencyContact: "+1 (555) 345-6789",
    assignedDoctor: "Dr. Sarah Jenkins",
    todaySchedule: [
      { time: "08:00 AM", med: "Multivitamin 1 Tab", status: "taken" },
      { time: "01:00 PM", med: "Lisinopril 10 mg", status: "taken" },
    ],
    medications: [
      {
        name: "Multivitamin",
        dosage: "1 Tablet",
        frequency: "1x daily (08:00 AM)",
        stock: 30,
      },
      {
        name: "Lisinopril",
        dosage: "10 mg",
        frequency: "1x daily (01:00 PM)",
        stock: 50,
      },
    ],
  },
];

const INITIAL_CAREGIVERS = [
  {
    id: "c1",
    name: "Dr. Sarah Jenkins",
    email: "sarah.jenkins@pillsync.com",
    phone: "+1 (555) 234-5678",
    relationship: "Doctor",
    assignedPatientsCount: 2,
    status: "Active Network",
    alertMissedDose: true,
    alertLowStock: true,
    alertRefill: true,
  },
  {
    id: "c2",
    name: "Mark Jenkins",
    email: "mark.jenkins@pillsync.com",
    phone: "+1 (555) 876-5432",
    relationship: "Family",
    assignedPatientsCount: 1,
    status: "Active Network",
    alertMissedDose: true,
    alertLowStock: true,
    alertRefill: false,
  },
];

export default function CaregiverPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddCaregiverOpen, setIsAddCaregiverOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);
  const [defaultPatientIdForMedicine, setDefaultPatientIdForMedicine] =
    useState("");

  // Medication inventory state
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDisease, setSelectedDisease] = useState("All");
  const [reportMsg, setReportMsg] = useState(null);

  // Notifications Feed
  const [notifications] = useState([
    {
      id: 1,
      type: "error",
      title: "Eleanor missed Levothyroxine 50 mcg",
      time: "10 minutes ago",
      icon: "🔴",
    },
    {
      id: 2,
      type: "warning",
      title: "Eleanor overall adherence dropped to 78%",
      time: "Today",
      icon: "🟠",
    },
    {
      id: 3,
      type: "error",
      title: "Metformin low stock warning (8 pills remaining)",
      time: "Today",
      icon: "🔴",
    },
    {
      id: 4,
      type: "success",
      title: "Robert completed all scheduled doses for today",
      time: "Today",
      icon: "🟢",
    },
  ]);

  // Persistent Patients List
  const [patientsList, setPatientsList] = useState(() => {
    const saved = localStorage.getItem("pillsync_patients");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved patients", e);
      }
    }
    return INITIAL_PATIENTS;
  });

  // Persistent Caregivers List
  const [caregiversList, setCaregiversList] = useState(() => {
    const saved = localStorage.getItem("pillsync_caregivers");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved caregivers", e);
      }
    }
    return INITIAL_CAREGIVERS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("pillsync_patients", JSON.stringify(patientsList));
  }, [patientsList]);

  useEffect(() => {
    localStorage.setItem("pillsync_caregivers", JSON.stringify(caregiversList));
  }, [caregiversList]);

  // Form states
  const [patientFormData, setPatientFormData] = useState({
    name: "",
    age: "",
    gender: "Female",
    conditions: "",
    allergies: "",
    emergencyContact: "",
    assignedCaregiver: "Dr. Sarah Jenkins",
  });

  const [caregiverFormData, setCaregiverFormData] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "Doctor",
    alertMissedDose: true,
    alertLowStock: true,
    alertRefill: true,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [, medsData] = await Promise.all([
          fetchAnalyticsOverview(),
          fetchMedications(),
        ]);
        setMedicines(medsData);
      } catch (err) {
        console.error("Failed to load caregiver patient stats", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddPatient = (e) => {
    e.preventDefault();
    if (!patientFormData.name) return;

    const newPatient = {
      id: `p-${Date.now()}`,
      name: patientFormData.name,
      relation: "(Assigned Patient)",
      age: Number(patientFormData.age) || 45,
      gender: patientFormData.gender || "Female",
      adherence: "100%",
      adherenceNum: 100,
      status: "Healthy",
      missedDoses: 0,
      lastTaken: "Just Registered",
      conditions: patientFormData.conditions
        ? patientFormData.conditions.split(",").map((c) => c.trim())
        : ["General Monitoring"],
      allergies: patientFormData.allergies || "None",
      emergencyContact: patientFormData.emergencyContact || "+1 (555) 000-1122",
      assignedDoctor: patientFormData.assignedCaregiver || "Dr. Sarah Jenkins",
      todaySchedule: [],
      medications: [],
    };

    setPatientsList((prev) => [newPatient, ...prev]);
    setReportMsg(`Patient profile "${patientFormData.name}" added and saved successfully!`);
    setPatientFormData({
      name: "",
      age: "",
      gender: "Female",
      conditions: "",
      allergies: "",
      emergencyContact: "",
      assignedCaregiver: "Dr. Sarah Jenkins",
    });
    setIsAddPatientOpen(false);
  };

  const handleAddCaregiver = (e) => {
    e.preventDefault();
    if (!caregiverFormData.name || !caregiverFormData.email) return;

    const newCaregiver = {
      id: `c-${Date.now()}`,
      name: caregiverFormData.name,
      email: caregiverFormData.email,
      phone: caregiverFormData.phone || "+1 (555) 000-1122",
      relationship: caregiverFormData.relationship || "Doctor",
      assignedPatientsCount: 0,
      status: "Active Network",
      alertMissedDose: caregiverFormData.alertMissedDose,
      alertLowStock: caregiverFormData.alertLowStock,
      alertRefill: caregiverFormData.alertRefill,
    };

    setCaregiversList((prev) => [newCaregiver, ...prev]);
    setReportMsg(
      `Caregiver "${caregiverFormData.name}" registered and added to Caregiver Roster!`,
    );
    setCaregiverFormData({
      name: "",
      email: "",
      phone: "",
      relationship: "Doctor",
      alertMissedDose: true,
      alertLowStock: true,
      alertRefill: true,
    });
    setIsAddCaregiverOpen(false);
  };

  const handleDeletePatient = (id, name) => {
    if (window.confirm(`Are you sure you want to remove patient profile for ${name}?`)) {
      setPatientsList((prev) => prev.filter((p) => p.id !== id));
      setReportMsg(`Patient profile "${name}" removed.`);
    }
  };

  const handleDeleteCaregiver = (id, name) => {
    if (window.confirm(`Are you sure you want to remove caregiver ${name}?`)) {
      setCaregiversList((prev) => prev.filter((c) => c.id !== id));
      setReportMsg(`Caregiver "${name}" removed.`);
    }
  };

  const handleAddMedicine = async (newMed) => {
    try {
      const saved = await addMedication(newMed);
      setMedicines((prev) => [saved, ...prev]);

      if (newMed.assignedPatientId) {
        setPatientsList((prev) =>
          prev.map((p) => {
            if (p.id === newMed.assignedPatientId) {
              const newPatientMed = {
                name: newMed.name,
                dosage: newMed.dosage,
                frequency: newMed.frequency,
                stock: newMed.stock,
              };
              const newScheduleItem = {
                time: "08:00 AM",
                med: `${newMed.name} ${newMed.dosage}`,
                status: "pending",
              };
              return {
                ...p,
                medications: [...(p.medications || []), newPatientMed],
                todaySchedule: [...(p.todaySchedule || []), newScheduleItem],
              };
            }
            return p;
          }),
        );
      }
    } catch (err) {
      console.error("Failed to add medicine for patient:", err);
      alert("Failed to save medicine.");
    }
  };

  const handleTakeDose = async (id) => {
    try {
      const updated = await takeDoseApi(id);
      setMedicines((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      console.error("Failed to record dose", err);
    }
  };

  const handleDeleteMedicine = async (id) => {
    try {
      await deleteMedicationApi(id);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Failed to delete medicine", err);
      alert("Failed to delete medicine.");
    }
  };

  const notifyEmergency = (personName) => {
    alert(
      `🚨 EMERGENCY ALERT: Instant SMS & Email alert sent to emergency contacts for ${personName}!`,
    );
  };

  const handleSendReminder = (patientName, medName) => {
    alert(
      `🔔 Dose reminder alert pushed to ${patientName}'s mobile app for ${medName}!`,
    );
  };

  const handleDownloadReport = (reportType) => {
    setReportMsg(`Generating official ${reportType} report...`);

    let csvHeader = "";
    let csvRows = [];
    const dateStr = new Date().toISOString().split("T")[0];

    if (reportType === "Weekly Adherence" || reportType === "Monthly Summary") {
      csvHeader =
        "Patient ID,Patient Name,Relation,Age,Gender,Adherence Rate,Status,Missed Doses,Emergency Contact\n";
      csvRows = patientsList.map(
        (p) =>
          `"${p.id}","${p.name}","${p.relation}",${p.age},"${p.gender}","${p.adherence}","${p.status}",${p.missedDoses},"${p.emergencyContact}"`,
      );
    } else if (reportType === "Missed Dosage Analysis") {
      csvHeader =
        "Patient Name,Relation,Missed Doses Count,Last Taken,Status,Emergency Contact\n";
      csvRows = patientsList
        .filter((p) => p.missedDoses > 0 || p.status !== "Healthy")
        .map(
          (p) =>
            `"${p.name}","${p.relation}",${p.missedDoses},"${p.lastTaken}","${p.status}","${p.emergencyContact}"`,
        );
      if (csvRows.length === 0) {
        csvRows = patientsList.map(
          (p) =>
            `"${p.name}","${p.relation}",${p.missedDoses},"${p.lastTaken}","${p.status}","${p.emergencyContact}"`,
        );
      }
    } else if (reportType === "Prescription Refill Forecast") {
      csvHeader =
        "Medication Name,Dosage,Frequency,Current Stock,Refill Status\n";
      csvRows = medicines.map((m) => {
        const threshold = m.refillThreshold || 10;
        const status =
          m.stock <= threshold ? "REFILL REQUIRED" : "ADEQUATE STOCK";
        return `"${m.name}","${m.dosage}","${m.frequency}",${m.stock},"${status}"`;
      });
      if (csvRows.length === 0) {
        csvRows = [
          '"Metformin","500 mg","2x daily",8,"REFILL REQUIRED"',
          '"Levothyroxine","50 mcg","1x daily",15,"ADEQUATE STOCK"',
          '"Atorvastatin","20 mg","1x daily",5,"REFILL REQUIRED"',
        ];
      }
    } else {
      csvHeader = "Report,Date\n";
      csvRows = [`"${reportType}","${dateStr}"`];
    }

    const csvData = csvHeader + csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedFileName = reportType.toLowerCase().replace(/\s+/g, "_");
    link.setAttribute(
      "download",
      `PillSync_${sanitizedFileName}_${dateStr}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setReportMsg(`${reportType} report downloaded successfully!`);
      setTimeout(() => setReportMsg(null), 4000);
    }, 400);
  };

  const filteredMeds = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.diseaseCategory &&
        m.diseaseCategory.toLowerCase().includes(search.toLowerCase()));
    const matchesDisease =
      selectedDisease === "All" ||
      (m.diseaseCategory &&
        m.diseaseCategory.toLowerCase() === selectedDisease.toLowerCase());
    return matchesSearch && matchesDisease;
  });

  const totalMissedDoses = patientsList.reduce(
    (acc, p) => acc + p.missedDoses,
    0,
  );
  const lowStockCount =
    medicines.filter((m) => m.stock <= (m.refillThreshold || 10)).length || 2;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
        <span className="font-semibold text-sm">
          Loading caregiver monitoring dashboard...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2 border border-emerald-200 dark:border-emerald-800">
            <Users className="w-3.5 h-3.5" />
            Caregiver & Family Network • Real-time Sync
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Caregiver Dashboard & Patient Roster
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor patient adherence, manage assigned medications, and receive
            live missed-dose alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate("/ocr-upload")}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <ScanLine className="w-4 h-4" />
            OCR Prescription Scan
          </button>

          <button
            onClick={() => navigate("/refills")}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            AI Refill Engine
          </button>

          <button
            onClick={() => setIsAddPatientOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Patient Profile
          </button>

          <button
            onClick={() => {
              setDefaultPatientIdForMedicine(patientsList[0]?.id || "");
              setIsAddMedicineOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Medicine
          </button>

          <button
            onClick={() => setIsAddCaregiverOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Add Caregiver
          </button>
        </div>
      </div>

      {reportMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          {reportMsg}
        </div>
      )}

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Assigned Patients
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {patientsList.length}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-1">
              <Users className="w-3 h-3" /> Active Monitoring
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Average Adherence
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              89%
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> +2.1% this week
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Missed Doses
            </p>
            <h3 className="text-3xl font-extrabold text-rose-500 mt-1">
              {totalMissedDoses}
            </h3>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5 mt-1">
              <AlertTriangle className="w-3 h-3" /> Action Required
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => navigate("/refills")}
          className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between cursor-pointer hover:border-amber-500/50 transition-all group"
        >
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Low Stock Alerts
            </p>
            <h3 className="text-3xl font-extrabold text-amber-500 mt-1">
              {lowStockCount}
            </h3>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 group-hover:underline">
              <RefreshCw className="w-3 h-3" /> Launch AI Refill Engine →
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Caregiver Patient List (My Patients) & Live Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient & Caregiver Roster (2 columns wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3a. My Patients Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                My Patients ({patientsList.length})
              </h3>
              <button
                onClick={() => setIsAddPatientOpen(true)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Patient
              </button>
            </div>

            {patientsList.length === 0 ? (
              <div className="p-6 rounded-3xl glass-card text-center text-slate-500 text-xs">
                No patient profiles found. Click "+ Add Patient Profile" to register one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientsList.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 hover:border-emerald-400/50 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {patient.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Age {patient.age} &bull;{" "}
                            {Array.isArray(patient.conditions)
                              ? patient.conditions.join(" • ")
                              : patient.conditions}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {patient.status === "Attention Needed" ||
                          patient.missedDoses > 0 ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                              🟠 Attention
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                              🟢 Healthy
                            </span>
                          )}
                          <button
                            onClick={() => handleDeletePatient(patient.id, patient.name)}
                            title="Remove patient"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
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
                          <strong
                            className={`text-base font-bold ${
                              patient.missedDoses > 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-emerald-600"
                            }`}
                          >
                            {patient.missedDoses} missed
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setSelectedPatientDetail(patient)}
                        className="py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20 transition-all active:scale-95"
                      >
                        <Users className="w-3.5 h-3.5" />
                        View Patient
                      </button>
                      <button
                        onClick={() => {
                          setDefaultPatientIdForMedicine(patient.id);
                          setIsAddMedicineOpen(true);
                        }}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />+ Medicine
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3b. Caregiver & Healthcare Network Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Caregivers & Healthcare Network ({caregiversList.length})
              </h3>
              <button
                onClick={() => setIsAddCaregiverOpen(true)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Caregiver
              </button>
            </div>

            {caregiversList.length === 0 ? (
              <div className="p-6 rounded-3xl glass-card text-center text-slate-500 text-xs">
                No caregivers registered. Click "+ Add Caregiver" to invite a doctor or family member.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caregiversList.map((cg) => (
                  <div
                    key={cg.id}
                    className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-3 hover:border-indigo-400/50 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                              {cg.name}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {cg.relationship}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {cg.email}
                          </p>
                          {cg.phone && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {cg.phone}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteCaregiver(cg.id, cg.name)}
                          title="Remove caregiver"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Alert preferences badges */}
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        {cg.alertMissedDose && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                            Missed Dose Alerts
                          </span>
                        )}
                        {cg.alertLowStock && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            Low Stock Warnings
                          </span>
                        )}
                        {cg.alertRefill && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            Refill Reminders
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {cg.status || "Active Network"}
                      </span>
                      <button
                        onClick={() =>
                          alert(`Sending notification to ${cg.name} (${cg.email})...`)
                        }
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-800"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Notifications Feed (1 column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-600" />
              Notifications & Alerts
            </h3>
          </div>

          <div className="p-4 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3 hover:border-brand-300 transition-all cursor-pointer"
              >
                <span className="text-base">{item.icon}</span>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Caregiver Analytics & Reports Section */}
      <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Caregiver Analytics & Reports
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Download weekly/monthly adherence reports, missed dosage
              breakdowns, and patient comparative analysis.
            </p>
          </div>

          {/* Export Report Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleDownloadReport("Weekly Adherence")}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-brand-600" />
              Weekly Report
            </button>
            <button
              onClick={() => handleDownloadReport("Monthly Summary")}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-brand-600" />
              Monthly Report
            </button>
            <button
              onClick={() => handleDownloadReport("Missed Dosage Analysis")}
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-900"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Missed Dose Report
            </button>
            <button
              onClick={() =>
                handleDownloadReport("Prescription Refill Forecast")
              }
              className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-200 dark:border-amber-900"
            >
              <Pill className="w-3.5 h-3.5 text-amber-500" />
              Refill Report
            </button>
          </div>
        </div>

        {/* Report Download Notification Banner */}
        {reportMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              {reportMsg}
            </span>
            <button
              onClick={() => setReportMsg(null)}
              className="text-emerald-500 hover:text-emerald-700 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Patient Comparison Bars */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Patient Adherence Comparison
          </h4>
          <div className="space-y-3">
            {patientsList.map((p) => (
              <div key={p.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {p.name}
                    <span className="text-[10px] font-normal text-slate-400">
                      {p.relation}
                    </span>
                  </span>
                  <span
                    className={`font-extrabold ${
                      p.adherenceNum >= 90
                        ? "text-emerald-600"
                        : "text-amber-500"
                    }`}
                  >
                    {p.adherence} {p.adherenceNum >= 90 ? "🟢" : "🟠"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.adherenceNum >= 90 ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${p.adherenceNum}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Medication Schedule & Inventory Grid */}
      <div className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-brand-600" />
              Medication Schedule & Inventory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage daily doses, disease categories, and active inventory for
              assigned patients.
            </p>
          </div>
          <button
            onClick={() => {
              setDefaultPatientIdForMedicine(patientsList[0]?.id || "");
              setIsAddMedicineOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-2 hover:from-brand-500 hover:to-brand-400 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Medicine
          </button>
        </div>

        {/* Search & Condition Filter Pills */}
        <div className="p-4 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search medicine or disease..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
            {[
              "All",
              "General",
              "Diabetes",
              "Thyroid",
              "Blood Pressure",
              "bp",
              "Antibiotics",
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedDisease(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedDisease.toLowerCase() === cat.toLowerCase()
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Medication Card Grid */}
        {filteredMeds.length === 0 ? (
          <div className="p-8 rounded-3xl glass-card text-center text-slate-500 text-xs">
            No active medications found matching "{search || selectedDisease}".
            Click "+ Add Medicine" to create a schedule.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMeds.map((med) => (
              <MedicineCard
                key={med.id}
                medicine={med}
                onTake={handleTakeDose}
                onMiss={() => alert(`Logged missed dose for ${med.name}`)}
                onDelete={handleDeleteMedicine}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. MODALS */}

      {/* Patient Detail Modal (View Patient) */}
      <Modal
        isOpen={!!selectedPatientDetail}
        onClose={() => setSelectedPatientDetail(null)}
        title={
          selectedPatientDetail
            ? `Patient Detail — ${selectedPatientDetail.name}`
            : "Patient Detail"
        }
      >
        {selectedPatientDetail && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold">
                  {selectedPatientDetail.name}
                </h3>
                <p className="text-xs text-brand-100 mt-0.5">
                  Age {selectedPatientDetail.age} &bull; Gender:{" "}
                  {selectedPatientDetail.gender}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider block text-brand-200">
                  Adherence
                </span>
                <span className="text-xl font-extrabold">
                  {selectedPatientDetail.adherence}
                </span>
              </div>
            </div>

            {/* Conditions & Missed */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-semibold text-[10px]">
                  Conditions
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedPatientDetail.conditions?.join(" • ") || "General"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                <span className="text-rose-400 block font-semibold text-[10px]">
                  Missed Doses
                </span>
                <span className="font-bold text-base">
                  {selectedPatientDetail.missedDoses} missed
                </span>
              </div>
            </div>

            {/* Today's Schedule Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                Today's Schedule
              </h4>
              <div className="space-y-2">
                {selectedPatientDetail.todaySchedule &&
                selectedPatientDetail.todaySchedule.length > 0 ? (
                  selectedPatientDetail.todaySchedule.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-500 w-16">
                          {s.time}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {s.med}
                        </span>
                      </div>
                      {s.status === "taken" ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          ✓ Taken
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          ⚠️ Pending
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-xs text-center">
                    No doses scheduled for today.
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
              <button
                onClick={() =>
                  handleSendReminder(
                    selectedPatientDetail.name,
                    "today's medication",
                  )
                }
                className="py-2 px-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center gap-1 border border-brand-200 dark:border-brand-800"
              >
                <Bell className="w-3.5 h-3.5 text-brand-500" />
                Send Reminder
              </button>
              <button
                onClick={() => {
                  setDefaultPatientIdForMedicine(selectedPatientDetail.id);
                  setSelectedPatientDetail(null);
                  setIsAddMedicineOpen(true);
                }}
                className="py-2 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1 border border-emerald-200 dark:border-emerald-800"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                Add Medicine
              </button>
              <button
                onClick={() => notifyEmergency(selectedPatientDetail.name)}
                className="py-2 px-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-900"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Emergency Alert
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Patient Profile Modal */}
      <Modal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        title="Add Patient Profile"
      >
        <form onSubmit={handleAddPatient} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Eleanor Morgan"
              value={patientFormData.name}
              onChange={(e) =>
                setPatientFormData({ ...patientFormData, name: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Age
              </label>
              <input
                type="number"
                placeholder="84"
                value={patientFormData.age}
                onChange={(e) =>
                  setPatientFormData({
                    ...patientFormData,
                    age: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Gender
              </label>
              <select
                value={patientFormData.gender}
                onChange={(e) =>
                  setPatientFormData({
                    ...patientFormData,
                    gender: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Medical Conditions (e.g. Thyroid, Heart)
            </label>
            <input
              type="text"
              placeholder="e.g. Thyroid, Heart, Blood Pressure"
              value={patientFormData.conditions}
              onChange={(e) =>
                setPatientFormData({
                  ...patientFormData,
                  conditions: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Allergies
            </label>
            <input
              type="text"
              placeholder="e.g. Sulfa Drugs, Penicillin, None"
              value={patientFormData.allergies}
              onChange={(e) =>
                setPatientFormData({
                  ...patientFormData,
                  allergies: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 876-5432"
              value={patientFormData.emergencyContact}
              onChange={(e) =>
                setPatientFormData({
                  ...patientFormData,
                  emergencyContact: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddPatientOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
            >
              Create Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Caregiver Modal */}
      <Modal
        isOpen={isAddCaregiverOpen}
        onClose={() => setIsAddCaregiverOpen(false)}
        title="Add Caregiver"
      >
        <form onSubmit={handleAddCaregiver} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Michael Chen"
              value={caregiverFormData.name}
              onChange={(e) =>
                setCaregiverFormData({
                  ...caregiverFormData,
                  name: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="doctor@pillsync.com"
                value={caregiverFormData.email}
                onChange={(e) =>
                  setCaregiverFormData({
                    ...caregiverFormData,
                    email: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Phone
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-1122"
                value={caregiverFormData.phone}
                onChange={(e) =>
                  setCaregiverFormData({
                    ...caregiverFormData,
                    phone: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Relationship
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
              {["Doctor", "Family", "Nurse", "Other"].map((rel) => (
                <button
                  type="button"
                  key={rel}
                  onClick={() =>
                    setCaregiverFormData({
                      ...caregiverFormData,
                      relationship: rel,
                    })
                  }
                  className={`py-2 px-3 rounded-xl border text-center transition-all ${
                    caregiverFormData.relationship === rel
                      ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-md"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {rel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Alert Preferences
            </label>
            <div className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caregiverFormData.alertMissedDose}
                  onChange={(e) =>
                    setCaregiverFormData({
                      ...caregiverFormData,
                      alertMissedDose: e.target.checked,
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Missed Dose Alerts
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caregiverFormData.alertLowStock}
                  onChange={(e) =>
                    setCaregiverFormData({
                      ...caregiverFormData,
                      alertLowStock: e.target.checked,
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Low Stock Warnings
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caregiverFormData.alertRefill}
                  onChange={(e) =>
                    setCaregiverFormData({
                      ...caregiverFormData,
                      alertRefill: e.target.checked,
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Refill Reminders
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddCaregiverOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Medicine Modal */}
      <AddMedicineModal
        isOpen={isAddMedicineOpen}
        onClose={() => setIsAddMedicineOpen(false)}
        onAddMedicine={handleAddMedicine}
        patientsList={patientsList}
        defaultPatientId={defaultPatientIdForMedicine}
      />
    </div>
  );
}
