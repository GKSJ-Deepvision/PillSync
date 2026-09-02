import React, { useState } from "react";
import MedicineCard from "../components/medications/MedicineCard";
import AddMedicineModal from "../components/medications/AddMedicineModal";
import { Plus, Search, Filter } from "lucide-react";

const DEMO_MEDICINES = [
  {
    id: "1",
    name: "Metformin",
    dosage: "500 mg",
    stock: 8,
    totalStock: 60,
    frequency: "2 times daily",
    diseaseCategory: "Diabetes",
    timesOfDay: ["Morning", "Night"],
    stockDays: 4,
    refillThreshold: 10,
  },
  {
    id: "2",
    name: "Amlodipine",
    dosage: "5 mg",
    stock: 45,
    totalStock: 60,
    frequency: "1 time daily",
    diseaseCategory: "Blood Pressure",
    timesOfDay: ["Morning"],
    stockDays: 45,
    refillThreshold: 10,
  },
  {
    id: "3",
    name: "Levothyroxine",
    dosage: "50 mcg",
    stock: 28,
    totalStock: 30,
    frequency: "1 time daily",
    diseaseCategory: "Thyroid",
    timesOfDay: ["Morning"],
    stockDays: 28,
    refillThreshold: 7,
  },
  {
    id: "4",
    name: "Amoxicillin",
    dosage: "250 mg",
    stock: 12,
    totalStock: 20,
    frequency: "3 times daily",
    diseaseCategory: "Antibiotics",
    timesOfDay: ["Morning", "Afternoon", "Night"],
    stockDays: 4,
    refillThreshold: 5,
  },
  {
    id: "5",
    name: "Vitamin D3",
    dosage: "1000 IU",
    stock: 50,
    totalStock: 60,
    frequency: "1 time daily",
    diseaseCategory: "Vitamins",
    timesOfDay: ["Morning"],
    stockDays: 50,
    refillThreshold: 10,
  },
];

export default function MedicationsPage() {
  const [medicines, setMedicines] = useState(DEMO_MEDICINES);
  const [search, setSearch] = useState("");
  const [selectedDisease, setSelectedDisease] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.diseaseCategory.toLowerCase().includes(search.toLowerCase());
    const matchesDisease =
      selectedDisease === "All" || m.diseaseCategory === selectedDisease;
    return matchesSearch && matchesDisease;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Medication Schedule & Inventory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your daily doses, disease categories, and stock thresholds.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 hover:from-brand-500 hover:to-brand-400 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add New Medicine
        </button>
      </div>

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
          {[
            "All",
            "Diabetes",
            "Blood Pressure",
            "Thyroid",
            "Antibiotics",
            "Vitamins",
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedDisease(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDisease === cat
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((med) => (
          <MedicineCard
            key={med.id}
            medicine={med}
            onTake={(id) =>
              setMedicines((prev) =>
                prev.map((m) =>
                  m.id === id ? { ...m, stock: Math.max(0, m.stock - 1) } : m,
                ),
              )
            }
            onMiss={() => alert("Missed dose logged.")}
          />
        ))}
      </div>

      <AddMedicineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddMedicine={(newMed) => setMedicines([newMed, ...medicines])}
      />
    </div>
  );
}
