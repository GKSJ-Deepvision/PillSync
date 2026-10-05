import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
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
} from "lucide-react";

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || "Alex Morgan",
    email: user?.email || "alex.morgan@pillsync.com",
    phone: "+1 (555) 234-5678",
    age: "68",
    gender: "Female",
    bloodGroup: "O+",
    conditions: "Diabetes Type 2, Hypertension, Thyroid",
    allergies: "Sulfa Drugs, Penicillin",
    emergencyContactName: "Dr. Sarah Jenkins",
    emergencyContactPhone: "+1 (555) 987-6543",
    assignedCaregiver: "Dr. Sarah Jenkins (Primary Doctor)",
    address: "742 Evergreen Terrace, Springfield",
    alertSms: true,
    alertPush: true,
    alertEmail: true,
    caregiverSync: true,
  });

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
      // Update logged in user name in context
      login({ ...user, name: formData.name, email: formData.email });
    }
    setSaveMessage("Profile updated successfully!");
    setTimeout(() => setSaveMessage(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-3xl font-extrabold shadow-inner shrink-0">
            {formData.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-100 border border-white/20 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Patient Health Profile
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formData.name}
            </h1>
            <p className="text-xs sm:text-sm text-brand-100/90 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {formData.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {formData.phone}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-end md:self-center">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 rounded-2xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              Edit Health Profile
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

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          {saveMessage}
        </div>
      )}

      {/* 2. Main Profile Content */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Medical Details (2 cols) */}
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

          {/* Medical History & Allergies Card */}
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
                    {formData.conditions.split(",").map((c, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-extrabold text-[11px]"
                      >
                        {c.trim()}
                      </span>
                    ))}
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
                    {formData.allergies.split(",").map((a, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-extrabold text-[11px] flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        {a.trim()}
                      </span>
                    ))}
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
                {isEditing ? (
                  <input
                    type="text"
                    name="assignedCaregiver"
                    value={formData.assignedCaregiver}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    {formData.assignedCaregiver}
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
        </div>

        {/* Right Column: Adherence Summary & Preferences (1 col) */}
        <div className="space-y-6">
          {/* Health Adherence Summary */}
          <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Adherence Summary
            </h3>

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
                <div className="bg-emerald-500 h-full rounded-full w-[94%]"></div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Excellent tracking record! 0 missed doses recorded this month.
              </p>
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
                  Caregiver Real-time Sync
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
