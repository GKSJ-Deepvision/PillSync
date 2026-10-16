import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useConnections } from "../hooks/useConnections";
import {
  User,
  Mail,
  Phone,
  Shield,
  Heart,
  AlertTriangle,
  Users,
  CheckCircle2,
  Edit3,
  Save,
  X,
  Bell,
  Activity,
  Sparkles,
  Stethoscope,
  ShieldCheck,
  UserCog,
  Link2,
  RefreshCw,
} from "lucide-react";

export default function ProfilePage() {
  const { user, viewMode, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Live bidirectional connections from backend
  const { connections, loading: connLoading, error: connError, reload: reloadConnections } = useConnections(user);

  // Determine the ACTUAL logged-in role — never override with viewMode
  // viewMode is just a UI lens; the real user role is what matters for profile display
  const actualRole = user?.role || "patient";
  const isCaregiver = actualRole === "caregiver";
  const isAdmin = actualRole === "admin";
  const isPatient = actualRole === "patient";

  const [formData, setFormData] = useState(() => ({
    name: user?.name || "My Profile",
    email: user?.email || "",
    phone: "+1 (555) 234-5678",
    age: "—",
    gender: "—",
    bloodGroup: "—",
    // Patient-specific fields
    conditions: "—",
    allergies: "—",
    emergencyContactName: "—",
    emergencyContactPhone: "—",
    assignedCaregiver: "—",
    address: "—",
    // Caregiver-specific fields
    specialization: isCaregiver ? "General Medicine" : "",
    licenseNumber: isCaregiver ? "MED-2024-XXXX" : "",
    hospitalAffiliation: isCaregiver ? "PillSync Medical Center" : "",
    yearsExperience: isCaregiver ? "10" : "",
    // Shared alert prefs
    alertSms: true,
    alertPush: true,
    alertEmail: true,
    caregiverSync: true,
  }));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsEditing(false);
    if (user && login) {
      login({ ...user, name: formData.name, email: formData.email });
    }
    setSaveMessage("Profile updated successfully!");
    setTimeout(() => setSaveMessage(null), 3500);
  };

  // ── Header badge config by role ───────────────────────────────────────────
  const roleMeta = isCaregiver
    ? {
        label: "Caregiver / Doctor Profile",
        gradient: "from-violet-700 via-indigo-600 to-violet-800",
        icon: <Stethoscope className="w-3.5 h-3.5 text-violet-200" />,
        badgeBg: "bg-violet-500/20",
        badgeText: "text-violet-100",
      }
    : isAdmin
    ? {
        label: "Administrator Profile",
        gradient: "from-slate-800 via-slate-700 to-slate-900",
        icon: <UserCog className="w-3.5 h-3.5 text-slate-200" />,
        badgeBg: "bg-slate-500/20",
        badgeText: "text-slate-100",
      }
    : {
        label: "Patient Health Profile",
        gradient: "from-brand-600 via-indigo-600 to-brand-700",
        icon: <Sparkles className="w-3.5 h-3.5 text-amber-300" />,
        badgeBg: "bg-white/10",
        badgeText: "text-brand-100",
      };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Banner — role-aware */}
      <div
        className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-r ${roleMeta.gradient} text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-3xl font-extrabold shadow-inner shrink-0">
            {formData.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full ${roleMeta.badgeBg} backdrop-blur-md text-xs font-semibold ${roleMeta.badgeText} border border-white/20 mb-1`}
            >
              {roleMeta.icon}
              {roleMeta.label}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formData.name}
            </h1>
            <p className="text-xs sm:text-sm text-white/80 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {formData.email}
              </span>
              {formData.phone !== "—" && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {formData.phone}
                </span>
              )}
              {/* Role pill */}
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 border border-white/25 font-bold text-[11px] capitalize">
                <ShieldCheck className="w-3 h-3" />
                {actualRole}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-end md:self-center">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 rounded-2xl bg-white text-slate-800 hover:bg-slate-100 font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Caregiver-in-Patient-View notice ────────────────────────────── */}
      {isCaregiver && viewMode === "patient" && (
        <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">You are logged in as a Caregiver.</span>
            You switched the dashboard to Patient View to preview the patient
            experience. Your profile is still your caregiver account — not a patient
            profile. Switch to{" "}
            <strong>Caregiver View</strong> using the toggle in the top bar to
            access your full caregiver dashboard.
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          {saveMessage}
        </div>
      )}

      {/* 2. Main Profile Content */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left Column: Personal & Role-specific Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic & Contact Information */}
          <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-brand-600" />
              Personal & Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 font-bold text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800">
                    {formData.name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 font-bold text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800">
                    {formData.email}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 font-bold text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800">
                    {formData.phone}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    Age
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 font-bold text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 text-center">
                      {formData.age}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="—">—</option>
                    </select>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 font-bold text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 text-center">
                      {formData.gender}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    Blood
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 font-bold text-emerald-600 dark:text-emerald-400 border border-slate-100 dark:border-slate-800 text-center">
                      {formData.bloodGroup}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Caregiver-specific professional details ── */}
          {isCaregiver && (
            <div className="p-6 rounded-3xl glass-card border border-violet-200/80 dark:border-violet-800/80 space-y-4 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-violet-500" />
                Professional Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    Specialization
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 font-bold text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-800">
                      {formData.specialization}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    License / Registration No.
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 font-bold text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-800">
                      {formData.licenseNumber}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    Hospital / Clinic Affiliation
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="hospitalAffiliation"
                      value={formData.hospitalAffiliation}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 font-bold text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-800">
                      {formData.hospitalAffiliation}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    Years of Experience
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="yearsExperience"
                      value={formData.yearsExperience}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 font-bold text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-800">
                      {formData.yearsExperience} yrs
                    </div>
                  )}
                </div>
              </div>

              {/* Caregiver Role Clarification Box */}
              <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-xs text-violet-700 dark:text-violet-300 font-medium flex items-start gap-2">
                <Link2 className="w-4 h-4 shrink-0 mt-0.5 text-violet-500" />
                <span>
                  As a <strong>caregiver</strong>, you manage medication schedules for your
                  assigned patients. Go to{" "}
                  <strong>Caregiver View → Caregiver Portal</strong> to view and manage your
                  patient assignments and medication schedules.
                </span>
              </div>
            </div>
          )}

          {/* ── Patient-specific: Medical History & Allergies ── */}
          {isPatient && (
            <>
              <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  Medical Conditions & Allergies
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Diagnosed Conditions
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="conditions"
                        value={formData.conditions}
                        onChange={handleChange}
                        placeholder="e.g. Diabetes, Hypertension"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 font-bold text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 flex gap-2 flex-wrap">
                        {formData.conditions === "—" ? (
                          <span className="text-slate-400">No conditions recorded</span>
                        ) : (
                          formData.conditions.split(",").map((c, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-extrabold text-[11px]"
                            >
                              {c.trim()}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Drug & Substance Allergies
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        placeholder="e.g. Sulfa Drugs, Penicillin"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex gap-2 flex-wrap">
                        {formData.allergies === "—" ? (
                          <span className="text-slate-400">No allergies recorded</span>
                        ) : (
                          formData.allergies.split(",").map((a, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-extrabold text-[11px] flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              {a.trim()}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact & Assigned Caregiver */}
              <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Emergency Contacts & Caregiver Sync
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Assigned Caregiver / Doctor
                    </label>
                    {/* Live data is shown in "My Connections" panel on the right */}
                    {connLoading ? (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-400 text-xs">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading caregiver info...
                      </div>
                    ) : connections.length > 0 ? (
                      <div className="space-y-2">
                        {connections.map((c, i) => (
                          <div key={i} className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 flex items-center gap-2 text-xs">
                            <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div>
                              <div>{c.name || c.caregiver_name || "Caregiver"}</div>
                              <div className="text-[10px] font-normal text-indigo-500">{c.email || c.caregiver_email || ""}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-slate-400 text-xs">
                        No caregiver assigned yet.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Emergency Contact Name & Phone
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          name="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={handleChange}
                          placeholder="Contact Name"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <input
                          type="text"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleChange}
                          placeholder="Phone Number"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 font-bold text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 space-y-1">
                        <div>{formData.emergencyContactName}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] font-normal">
                          {formData.emergencyContactPhone}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Adherence Summary & Preferences */}
        <div className="space-y-6">
          {/* Adherence / Activity Summary */}
          <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              {isCaregiver ? "Caregiver Activity" : "Adherence Summary"}
            </h3>

            {isCaregiver ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      Patients Monitored
                    </span>
                    <span className="text-lg font-black text-violet-600 dark:text-violet-400">
                      3 🟢
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Active monitoring with real-time dose alerts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Overall Patient Adherence
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full w-[89%]" />
                    </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      89%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-brand-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">
                    Overall Adherence Score
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    94% 🟢
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[94%]" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Excellent tracking record! 0 missed doses recorded this month.
                </p>
              </div>
            )}
          </div>

          {/* ── My Connections (Live from Backend) ── */}
          <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-500" />
                {isCaregiver ? "My Assigned Patients" : "My Caregiver(s)"}
              </h3>
              <button
                type="button"
                onClick={reloadConnections}
                title="Refresh connections"
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${connLoading ? "animate-spin text-brand-500" : ""}`} />
              </button>
            </div>

            {connLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-3">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading connections...
              </div>
            ) : connError ? (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs font-medium">
                Could not load connections. Make sure you are logged in.
              </div>
            ) : connections.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 space-y-1">
                <Users className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                {isCaregiver
                  ? "No patients assigned to you yet. Go to Caregiver Portal → Assign Patient."
                  : "No caregiver assigned to you yet. Ask your caregiver to link your account."}
              </div>
            ) : (
              <div className="space-y-2">
                {connections.map((c, i) => {
                  const name = c.name || c.caregiver_name || c.patient_name || "Unknown";
                  const email = c.email || c.caregiver_email || c.patient_email || "";
                  const initial = name.charAt(0).toUpperCase();
                  return (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl flex items-center gap-3 border text-xs font-medium ${
                        isCaregiver
                          ? "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800"
                          : "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800"
                      }`}
                    >
                      {/* Avatar circle */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0 ${
                          isCaregiver
                            ? "bg-sky-200 dark:bg-sky-800 text-sky-800 dark:text-sky-100"
                            : "bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-100"
                        }`}
                      >
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-extrabold truncate ${
                          isCaregiver
                            ? "text-sky-800 dark:text-sky-200"
                            : "text-violet-800 dark:text-violet-200"
                        }`}>
                          {name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate">
                          {email}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isCaregiver
                          ? "bg-sky-100 dark:bg-sky-900 border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-300"
                          : "bg-violet-100 dark:bg-violet-900 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                      }`}>
                        {isCaregiver ? "Patient" : "Caregiver"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Account Role Badge */}
          <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-3 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              Account Role
            </h3>
            <div
              className={`p-3 rounded-2xl flex items-center gap-3 border text-sm font-bold ${
                isCaregiver
                  ? "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300"
                  : isAdmin
                  ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  : "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300"
              }`}
            >
              {isCaregiver ? (
                <Stethoscope className="w-5 h-5" />
              ) : isAdmin ? (
                <UserCog className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
              <div>
                <div className="font-extrabold capitalize">{actualRole}</div>
                <div className="text-[11px] font-normal opacity-70">
                  {isCaregiver
                    ? "Manages patient medication schedules"
                    : isAdmin
                    ? "Full system administrator access"
                    : "Views own assigned medications only"}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Alert Preferences
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  SMS Dose Alerts
                </span>
                <input
                  type="checkbox"
                  name="alertSms"
                  checked={formData.alertSms}
                  onChange={handleChange}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  App Push Notifications
                </span>
                <input
                  type="checkbox"
                  name="alertPush"
                  checked={formData.alertPush}
                  onChange={handleChange}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {isCaregiver ? "Patient Activity Sync" : "Caregiver Real-time Sync"}
                </span>
                <input
                  type="checkbox"
                  name="caregiverSync"
                  checked={formData.caregiverSync}
                  onChange={handleChange}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
              </label>
            </div>
          </div>

          {isEditing && (
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Save Profile Changes
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
