import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import { MOCK_PATIENTS, MOCK_NOTIFICATIONS } from '../../data/mockData';
import { Calendar, Pill, Activity, Bell, Award, ArrowRight, CheckCircle, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientDashboard = () => {
  const { user } = useAuth();
  
  const patientData = MOCK_PATIENTS.find(
    (p) => p.email.toLowerCase() === user?.email.toLowerCase()
  ) || MOCK_PATIENTS[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-soft">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome, {user?.name || 'Patient'}!</h1>
          <p className="text-xs text-brand-100 mt-1">Here is your medication tracking summary for today.</p>
        </div>
        <div className="flex gap-2 bg-white/10 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
          <Award className="h-5 w-5 text-yellow-300 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Compliance Status: </span>
            <span className="font-semibold text-brand-100">{patientData.adherence.monthly}% Monthly Adherence</span>
          </div>
        </div>
      </div>

      {/* Statistics deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Adherence Rate" subtitle="This month" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{patientData.adherence.monthly}%</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+2% this week</span>
          </div>
        </Card>
        <Card title="Active Medicines" subtitle="Prescriptions logged" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{patientData.medications.length}</span>
            <span className="text-xs text-slate-400 font-medium">prescribed drugs</span>
          </div>
        </Card>
        <Card title="Today's Dosages" subtitle="Compliance tracker" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">
              {patientData.schedule.filter((s) => s.status === 'Taken').length}/{patientData.schedule.length}
            </span>
            <span className="text-xs text-slate-450 font-medium">taken today</span>
          </div>
        </Card>
        <Card title="Next Dosage" subtitle="Reminder" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-bold text-slate-800">08:00 PM</span>
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">Metformin</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main interactive schedule timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule Card */}
          <Card title="Today's Schedule" subtitle="Your hourly dosage timeline">
            <div className="mt-4 divide-y divide-slate-100">
              {patientData.schedule.map((slot, index) => (
                <div key={index} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      slot.status === 'Taken' ? 'bg-emerald-50 text-emerald-600' : slot.status === 'Missed' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {slot.status === 'Taken' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-850">{slot.name}</h4>
                      <p className="text-xs text-slate-450 mt-0.5">{slot.dosage} • Scheduled for {slot.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    slot.status === 'Taken' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : slot.status === 'Missed' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 text-right border-t border-slate-50 pt-4">
              <Link to="/schedule" className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors">
                View Full Calendar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>

          {/* Active Prescription Deck */}
          <Card title="Medication Details" subtitle="Active prescription dosages details">
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {patientData.medications.map((med) => (
                <div key={med.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{med.name}</h4>
                      <p className="text-xs text-slate-450 mt-0.5">{med.dosage} • {med.frequency}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      Compliance: {med.compliance}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Scheduled: <span className="font-semibold text-slate-700">{med.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 text-right border-t border-slate-50 pt-4">
              <Link to="/medicines" className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors">
                Manage Prescriptions <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          {/* Quick Actions Shortcuts */}
          <Card title="Quick Actions">
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Link to="/profile/edit" className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all text-center">
                <User className="h-5 w-5 text-brand-600 mb-2" />
                <span className="text-xs font-bold text-slate-700">Edit Profile</span>
              </Link>
              <Link to="/schedule" className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all text-center">
                <Calendar className="h-5 w-5 text-brand-600 mb-2" />
                <span className="text-xs font-bold text-slate-700">Schedule</span>
              </Link>
              <Link to="/medicines" className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all text-center">
                <Pill className="h-5 w-5 text-brand-600 mb-2" />
                <span className="text-xs font-bold text-slate-700">Medicines</span>
              </Link>
              <Link to="/adherence" className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all text-center">
                <Activity className="h-5 w-5 text-brand-600 mb-2" />
                <span className="text-xs font-bold text-slate-700">Adherence</span>
              </Link>
            </div>
          </Card>

          {/* Recent System Alerts */}
          <Card title="Recent Notifications" subtitle="Alerts history">
            <div className="mt-4 divide-y divide-slate-100">
              {MOCK_NOTIFICATIONS.slice(0, 3).map((not) => (
                <div key={not.id} className="py-3 first:pt-0 last:pb-0 flex gap-3">
                  <div className="bg-slate-50 p-2 rounded-lg text-slate-400 shrink-0 h-fit">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{not.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{not.message}</p>
                    <span className="text-[9px] text-slate-400 mt-1 block font-medium">{not.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 text-right border-t border-slate-50 pt-4">
              <Link to="/notifications" className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors">
                View All Notifications <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
