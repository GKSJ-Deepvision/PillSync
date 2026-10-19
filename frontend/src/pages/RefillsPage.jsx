import React, { useState, useEffect, useCallback } from "react";
import StockProgressBar from "../components/refills/StockProgressBar";
import {
  fetchRefillPredictionsApi,
  requestRefillApi,
  updateStockApi,
  fetchAssignments,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useConnections } from "../hooks/useConnections";
import {
  Sparkles,
  ShoppingCart,
  RefreshCw,
  CheckCircle2,
  Calendar,
  User,
  Users,
  Search,
  Filter,
  Phone,
} from "lucide-react";

const INITIAL_PATIENTS = [
  {
    id: "p1",
    name: "Sarah Jenkins",
    relation: "(Self / Primary)",
    age: 68,
    gender: "Female",
    adherence: "94%",
    conditions: ["Diabetes", "Blood Pressure"],
    emergencyContact: "+1 (555) 234-5678",
  },
  {
    id: "p2",
    name: "Eleanor Morgan",
    relation: "(Mother)",
    age: 84,
    gender: "Female",
    adherence: "78%",
    conditions: ["Thyroid", "Heart"],
    emergencyContact: "+1 (555) 876-5432",
  },
  {
    id: "p3",
    name: "Robert Morgan",
    relation: "(Father)",
    age: 86,
    gender: "Male",
    adherence: "95%",
    conditions: ["Vitamins", "Blood Pressure"],
    emergencyContact: "+1 (555) 345-6789",
  },
];

export default function RefillsPage() {
  const { user, viewMode } = useAuth();
  const activeRole =
    user?.role === "admin"
      ? viewMode || "admin"
      : viewMode || user?.role || "patient";

  const isPatient = activeRole === "patient";
  const isCaregiver = !isPatient;

  // Live connections
  const { connections } = useConnections(user, activeRole);

  // Persistent patient roster
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

  // Selected patient profile filter
  // If patient role: default to patient's own ID/name; if caregiver: default to "All" or first patient
  const [selectedPatientId, setSelectedPatientId] = useState(
    isPatient ? String(user?.id || "p1") : "All",
  );

  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderStatus, setOrderStatus] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Sync backend assignments into patientsList
  useEffect(() => {
    async function loadBackendAssignments() {
      try {
        const data = await fetchAssignments();
        if (Array.isArray(data) && data.length > 0) {
          setPatientsList((prev) => {
            const updated = [...prev];
            data.forEach((a) => {
              const strId = String(a.patient);
              const exists = updated.some(
                (p) => String(p.id) === strId || p.name === a.patient_name,
              );
              if (!exists) {
                updated.unshift({
                  id: strId,
                  name: a.patient_name,
                  relation: "(Assigned Patient)",
                  age: 45,
                  gender: "Patient",
                  adherence: "95%",
                  conditions: ["General Care"],
                  emergencyContact: a.patient_email || "+1 (555) 000-1122",
                });
              }
            });
            return updated;
          });
        }
      } catch (e) {
        console.warn("Could not load assignments in RefillsPage", e);
      }
    }
    loadBackendAssignments();
  }, []);

  // Merge live connections into patientsList
  useEffect(() => {
    if (Array.isArray(connections) && connections.length > 0) {
      setPatientsList((prev) => {
        const updated = [...prev];
        connections.forEach((c) => {
          const strId = String(c.id || c.patient);
          const name = c.name || c.patient_name;
          if (name) {
            const exists = updated.some(
              (p) => String(p.id) === strId || p.name === name,
            );
            if (!exists) {
              updated.unshift({
                id: strId,
                name: name,
                relation: "(Assigned Patient)",
                age: c.age || 45,
                gender: c.gender || "Patient",
                adherence: "95%",
                conditions: c.conditions || ["General Care"],
                emergencyContact: c.email || c.phone || "+1 (555) 000-1122",
                avatar: c.avatar || c.patient_avatar,
              });
            }
          }
        });
        return updated;
      });
    }
  }, [connections]);

  // If patient, ensure selectedPatientId matches current user
  useEffect(() => {
    if (isPatient && user?.id) {
      setSelectedPatientId(String(user.id));
    }
  }, [isPatient, user?.id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass selected patient id to backend prediction service if filtered
      const queryId =
        selectedPatientId !== "All" ? selectedPatientId : null;
      const data = await fetchRefillPredictionsApi(queryId);
      setPredictions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch refill predictions:", err);
      setError("Unable to calculate refill predictions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOrderRefill = async (medId) => {
    try {
      await requestRefillApi(
        medId,
        60,
        "Refill requested via AI Refill Engine",
      );
      setOrderStatus((prev) => ({ ...prev, [medId]: "Refill Order Placed!" }));
      setTimeout(() => {
        setOrderStatus((prev) => ({ ...prev, [medId]: null }));
      }, 3000);
    } catch (err) {
      alert(`Failed to place refill order: ${err.message}`);
    }
  };

  const handleStockAdjust = async (medId, currentStock) => {
    const newStockStr = prompt("Enter new stock level:", currentStock);
    if (newStockStr !== null) {
      const newStock = parseInt(newStockStr, 10);
      if (!isNaN(newStock) && newStock >= 0) {
        await updateStockApi(medId, newStock);
        await loadData();
      }
    }
  };

  // Helper to match a prediction item to its patient
  const getPatientForMed = useCallback(
    (item) => {
      if (item.patientId) {
        const match = patientsList.find(
          (p) => String(p.id) === String(item.patientId),
        );
        if (match) return match;
      }
      if (item.patientName) {
        const match = patientsList.find(
          (p) =>
            p.name &&
            p.name.toLowerCase() === item.patientName.toLowerCase(),
        );
        if (match) return match;
      }
      return null;
    },
    [patientsList],
  );

  // Active patient object if a specific patient is selected
  const activePatient =
    selectedPatientId !== "All"
      ? patientsList.find((p) => String(p.id) === String(selectedPatientId)) ||
        (isPatient
          ? {
              id: user?.id || "p1",
              name: user?.name || "My Profile",
              age: 45,
              gender: "Patient",
              adherence: "95%",
              conditions: ["Assigned Care"],
              emergencyContact: user?.email || "+1 (555) 234-5678",
            }
          : null)
      : null;

  // Filter predictions exclusively for the selected patient
  const filteredPredictions = predictions.filter((item) => {
    const medPatient = getPatientForMed(item);
    const medPatientName = medPatient?.name || item.patientName || "";
    const medPatientId = medPatient?.id || item.patientId;

    // 1. Patient profile isolation: show only their assigned medicines
    if (selectedPatientId !== "All") {
      const targetName = activePatient?.name?.toLowerCase();
      const matchesId =
        medPatientId && String(medPatientId) === String(selectedPatientId);
      const matchesName =
        targetName &&
        medPatientName &&
        medPatientName.toLowerCase() === targetName;

      if (!matchesId && !matchesName) return false;
    }

    // 2. Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matches =
        item.medicationName.toLowerCase().includes(q) ||
        medPatientName.toLowerCase().includes(q) ||
        (item.diseaseCategory &&
          item.diseaseCategory.toLowerCase().includes(q));
      if (!matches) return false;
    }

    // 3. Status filter
    if (statusFilter !== "All") {
      if (statusFilter === "LOW_STOCK") {
        if (item.status !== "CRITICAL" && item.status !== "LOW_STOCK")
          return false;
      } else if (item.status !== statusFilter) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-950 text-xs font-bold text-brand-700 dark:text-brand-300 mb-2 border border-brand-200 dark:border-brand-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Refill Engine • Patient-Specific Stock Intelligence
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Automated Stock Depletion & Refill Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Calculates real-time daily dosage consumption rate and predicts exact
            exhaustion dates exclusively linked to each patient profile.
          </p>
        </div>

        {/* Patient Selection Dropdown for Caregiver/Admin */}
        {isCaregiver && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <User className="w-4 h-4 text-brand-600 dark:text-brand-400 ml-1 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Patient Profile:
              </span>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer pr-2"
              >
                <option value="All">All Patients ({patientsList.length})</option>
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.relation ? `• ${p.relation}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Patient Profile Selector Pills (Quick Switcher for Caregiver) */}
      {isCaregiver && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedPatientId("All")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedPatientId === "All"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                : "glass-card text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            All Patients
          </button>
          {patientsList.map((p) => {
            const isSelected = String(selectedPatientId) === String(p.id);
            const avatar =
              p.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name.replace(/ /g, "_")}`;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(String(p.id))}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                    : "glass-card text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                }`}
              >
                <img
                  src={avatar}
                  alt={p.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Patient Profile Spotlight Card */}
      {activePatient && (
        <div className="p-5 rounded-3xl glass-card border border-brand-500/30 bg-gradient-to-r from-brand-50/70 via-indigo-50/40 to-brand-50/70 dark:from-brand-950/40 dark:via-indigo-950/20 dark:to-brand-950/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={
                activePatient.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${activePatient.name.replace(/ /g, "_")}`
              }
              alt={activePatient.name}
              className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 object-cover ring-2 ring-brand-500/40 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {activePatient.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                  Active Patient Profile
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {activePatient.age ? `Age ${activePatient.age} • ` : ""}
                {activePatient.gender || "Patient"} •{" "}
                {Array.isArray(activePatient.conditions)
                  ? activePatient.conditions.join(" • ")
                  : activePatient.conditions || "General Care"}
                {activePatient.emergencyContact && (
                  <span className="ml-2 inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Phone className="w-3 h-3 text-emerald-500" />
                    {activePatient.emergencyContact}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-brand-700 dark:text-brand-300 font-semibold mt-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Showing assigned medicines exclusively for {activePatient.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-slate-800 pt-3 md:pt-0 md:pl-5 shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Adherence
              </span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {activePatient.adherence || "95%"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Assigned Meds
              </span>
              <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
                {filteredPredictions.length}
              </span>
            </div>
            {isCaregiver && (
              <button
                onClick={() => setSelectedPatientId("All")}
                className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-sm"
              >
                View All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Status Filter Bar */}
      <div className="p-4 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={
              activePatient
                ? `Search medicines assigned to ${activePatient.name}...`
                : "Search medicine, condition, or patient..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {["All", "LOW_STOCK", "SUFFICIENT"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {st === "LOW_STOCK"
                ? "Low Stock Alerts"
                : st === "SUFFICIENT"
                  ? "Healthy Stock"
                  : "All Status"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadData}
            className="underline font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] text-slate-500 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
          <span className="font-semibold text-sm">
            Calculating real-time stock depletion for assigned medications...
          </span>
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="p-10 rounded-3xl glass-card text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {activePatient
              ? `No refill predictions found for ${activePatient.name}`
              : "No active refills needed"}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activePatient
              ? `All assigned prescription stock levels for ${activePatient.name} are healthy and above depletion threshold.`
              : "All active patient prescription stock levels are healthy and above threshold."}
          </p>
          {isCaregiver && selectedPatientId !== "All" && (
            <button
              onClick={() => setSelectedPatientId("All")}
              className="mt-2 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold text-xs hover:bg-brand-100 transition-colors cursor-pointer"
            >
              ← Back to All Patients
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPredictions.map((item) => {
            const itemPatient = getPatientForMed(item);
            const patientName = itemPatient?.name || item.patientName;
            const patientAvatar =
              itemPatient?.avatar ||
              item.patientAvatar ||
              (patientName
                ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${patientName.replace(/ /g, "_")}`
                : null);

            return (
              <div
                key={item.medicationId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 hover:border-brand-500/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {/* Patient Profile attribution badge */}
                      {patientName && (
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span
                            onClick={() =>
                              itemPatient &&
                              setSelectedPatientId(String(itemPatient.id))
                            }
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 ${
                              itemPatient ? "cursor-pointer hover:bg-indigo-100" : ""
                            }`}
                            title={
                              itemPatient
                                ? "Click to view only this patient's refill schedule"
                                : ""
                            }
                          >
                            {patientAvatar && (
                              <img
                                src={patientAvatar}
                                alt={patientName}
                                className="w-3.5 h-3.5 rounded-full object-cover"
                              />
                            )}
                            <span>Patient: {patientName}</span>
                          </span>

                          <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800">
                            {item.diseaseCategory || "General"}
                          </span>
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {item.medicationName} ({item.dosage})
                      </h3>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                        item.status === "CRITICAL" || item.status === "LOW_STOCK"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          : item.status === "WARNING"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {item.status === "LOW_STOCK"
                        ? "Low Stock"
                        : item.status === "CRITICAL"
                          ? "Critical"
                          : "Healthy"}
                    </span>
                  </div>

                  <StockProgressBar
                    medicineName=""
                    currentStock={item.initialQuantity}
                    totalStock={item.totalStock}
                    refillDate={`Exhausts in ${item.effectiveStockDays} Days (${item.depletionDate})`}
                  />

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl space-y-1">
                      <div className="text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-500" />{" "}
                        Depletion Date
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {item.depletionDate}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl space-y-1">
                      <div className="text-slate-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Reorder
                        By
                      </div>
                      <div className="font-bold text-brand-600 dark:text-brand-400">
                        {item.recommendedRefillDate}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <button
                    onClick={() =>
                      handleOrderRefill(
                        item.medicationId,
                        item.medicationName,
                      )
                    }
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white hover:bg-brand-600 dark:hover:bg-brand-400 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    {orderStatus[item.medicationId] ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                        {orderStatus[item.medicationId]}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Request Refill Order
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleStockAdjust(
                        item.medicationId,
                        item.initialQuantity,
                      )
                    }
                    className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                    title="Update manual stock"
                  >
                    Update Stock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
