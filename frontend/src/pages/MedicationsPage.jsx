import React, { useState, useEffect } from "react";
import MedicineCard from "../components/medications/MedicineCard";
import AddMedicineModal from "../components/medications/AddMedicineModal";
import { useAuth } from "../context/AuthContext";
import {
  fetchMedications,
  addMedication,
  takeDoseApi,
  deleteMedicationApi,
} from "../services/api";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";

export default function MedicationsPage() {
  const auth = useAuth() || {};
  const user = auth.user;
  const viewMode = auth.viewMode;
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDisease, setSelectedDisease] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeRole =
    user?.role === "admin"
      ? viewMode || "admin"
      : viewMode || user?.role || "patient";

  const isPatient = activeRole === "patient";

  const loadMeds = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMedications();
      setMedicines(data);
    } catch (err) {
      console.error("Failed to load medications", err);
      setError("Unable to load assigned medications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeds();
  }, []);

  const handleTakeDose = async (id) => {
    try {
      const updated = await takeDoseApi(id);
      setMedicines((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      console.error("Failed to take dose", err);
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (isPatient) return;
    try {
      await deleteMedicationApi(id);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Failed to delete medicine", err);
      alert("Failed to delete medicine.");
    }
  };

  const handleAddMedicine = async (newMed) => {
    try {
      const saved = await addMedication(newMed);
      setMedicines((prev) => [saved, ...prev]);
    } catch (err) {
      console.error("Failed to save medicine", err);
      alert("Failed to save medicine.");
    }
  };

  const filtered = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.diseaseCategory &&
        m.diseaseCategory.toLowerCase().includes(search.toLowerCase()));
    const matchesDisease =
      selectedDisease === "All" || m.diseaseCategory === selectedDisease;
    return matchesSearch && matchesDisease;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
        <span className="font-semibold text-sm">
          Loading medications inventory...
        </span>
      </div>
    );
  }

  const dynamicCategories = [
    "All",
    ...Array.from(
      new Set(
        medicines
          .map((m) => m.diseaseCategory)
          .filter((cat) => Boolean(cat) && cat.trim() !== ""),
      ),
    ),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Assigned Medications & Schedule
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isPatient
              ? "View your assigned prescriptions, dosages, timing, and active inventory."
              : "Manage patient prescription schedules, disease categories, and inventory."}
          </p>
        </div>

        {!isPatient && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Medicine
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadMeds} className="underline font-bold cursor-pointer">
            Try again
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="p-4 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search medicine or disease..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedDisease(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedDisease.toLowerCase() === cat.toLowerCase()
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Medicine Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-10 rounded-3xl glass-card text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            No medicines assigned yet
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isPatient
              ? "No prescriptions match your selected filter. Please contact your assigned caregiver to add medicines."
              : "No medications found. Click '+ Add New Medicine' or upload a doctor prescription."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((med) => (
            <MedicineCard
              key={med.id}
              medicine={med}
              onTake={handleTakeDose}
              onMiss={() => alert("Missed dose logged.")}
              onDelete={isPatient ? null : handleDeleteMedicine}
            />
          ))}
        </div>
      )}

      {!isPatient && (
        <AddMedicineModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddMedicine={handleAddMedicine}
        />
      )}
    </div>
  );
}
