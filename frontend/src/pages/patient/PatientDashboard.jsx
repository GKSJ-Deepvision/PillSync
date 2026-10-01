import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import { Calendar, Pill, Activity, Bell, Award, ArrowRight, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../../services/api';
import { medicationService } from '../../services/medicationService';

const PatientDashboard = () => {
  const [medicines, setMedicines] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled([
        medicationService.listMedicines(),
        medicationService.listReminders(),
        medicationService.getAdherence(),
      ]);
      const [medicineResult, reminderResult, adherenceResult] = results;

      if (medicineResult.status === 'fulfilled') setMedicines(medicineResult.value);
      if (reminderResult.status === 'fulfilled') setReminders(reminderResult.value);
      if (adherenceResult.status === 'fulfilled') setAdherence(adherenceResult.value);

      const failedResult = results.find((result) => result.status === 'rejected');
      if (failedResult) {
        setError(getApiErrorMessage(failedResult.reason, 'Unable to load some dashboard data.'));
      }
      setLoading(false);
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  const pendingReminders = reminders.filter((reminder) => !['taken', 'missed'].includes(reminder.status));
  const nextReminder = pendingReminders[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card */}
      <div className="bg-gradient-to-r from-brand-655 to-primary-600 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-soft">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-xs text-brand-100 mt-1">Here is your medication tracking summary for today.</p>
        </div>
        <div className="flex gap-2 bg-white/10 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
          <Award className="h-5 w-5 text-yellow-300 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Compliance Status: </span>
            <span className="font-semibold text-brand-100">{adherence?.adherence_percentage ?? 0}% recorded adherence</span>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {loading ? <Loading text="Loading your dashboard..." /> : <>
      {/* Statistics deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Adherence Rate" subtitle="This month" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{adherence?.adherence_percentage ?? 0}%</span>
            <span className="text-xs text-slate-400 font-medium">recorded doses</span>
          </div>
        </Card>
        <Card title="Active Medicines" subtitle="Prescriptions logged" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{medicines.length}</span>
            <span className="text-xs text-slate-400 font-medium">prescribed drugs</span>
          </div>
        </Card>
        <Card title="Today's Dosages" subtitle="Compliance tracker" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">
              {adherence?.taken ?? 0}/{adherence?.total_scheduled ?? 0}
            </span>
            <span className="text-xs text-slate-450 font-medium">taken today</span>
          </div>
        </Card>
        <Card title="Next Dosage" subtitle="Reminder" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-bold text-slate-800">{nextReminder ? new Date(nextReminder.scheduled_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'None'}</span>
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{nextReminder ? nextReminder.period : 'Up to date'}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main interactive schedule timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule Card */}
          <Card title="Today's Schedule" subtitle="Your hourly dosage timeline">
            <div className="mt-4 divide-y divide-slate-100">
              {pendingReminders.slice(0, 4).map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      'bg-slate-100 text-slate-400'
                    }`}>
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-850">Scheduled dose</h4>
                      <p className="text-xs text-slate-450 mt-0.5">{new Date(slot.scheduled_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    'bg-slate-50 text-slate-500 border-slate-200'
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
              {medicines.slice(0, 4).map((med) => (
                <div key={med.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{med.name}</h4>
                      <p className="text-xs text-slate-450 mt-0.5">{med.dosage || 'Dosage not specified'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      Stock: {med.quantity}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Refill threshold: <span className="font-semibold text-slate-700">{med.refill_threshold}</span>
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
              {reminders.slice(0, 3).map((not) => (
                <div key={not.id} className="py-3 first:pt-0 last:pb-0 flex gap-3">
                  <div className="bg-slate-50 p-2 rounded-lg text-slate-400 shrink-0 h-fit">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Medication reminder</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{new Date(not.scheduled_at).toLocaleString()}</p>
                    <span className="text-[9px] text-slate-400 mt-1 block font-medium">{not.status}</span>
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
      </>}
    </div>
  );
};

export default PatientDashboard;
