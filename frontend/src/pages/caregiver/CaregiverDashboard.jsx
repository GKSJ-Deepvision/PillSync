import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { MOCK_PATIENTS, MOCK_ALERTS } from '../../data/mockData';
import { Users, AlertTriangle, UserPlus, Send, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CaregiverDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalPatients = MOCK_PATIENTS.length;
  const criticalPatients = MOCK_PATIENTS.filter((p) => p.status === 'Needs Attention').length;
  const averageAdherence = Math.round(
    MOCK_PATIENTS.reduce((acc, curr) => acc + curr.adherence.monthly, 0) / totalPatients
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="caregiver-dashboard">
      {/* Welcome Banner Card */}
      <div className="bg-gradient-to-r from-caregiver-600 to-indigo-655 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-soft">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome, {user?.name || 'Caregiver'}!</h1>
          <p className="text-xs text-indigo-100 mt-1">Here is the care coordination overview for your assigned patients.</p>
        </div>
        <div className="flex gap-2 bg-white/10 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
          <Users className="h-5 w-5 text-indigo-150 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Monitored Registry: </span>
            <span className="font-semibold text-indigo-100">{totalPatients} active patients</span>
          </div>
        </div>
      </div>

      {/* Statistics deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Connected Patients" subtitle="Assigned to you" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{totalPatients}</span>
            <span className="text-xs text-slate-400 font-medium">registered</span>
          </div>
        </Card>
        <Card title="Needs Attention" subtitle="Missed-dose flags" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-extrabold ${criticalPatients > 0 ? 'text-red-650' : 'text-slate-800'}`}>
              {criticalPatients}
            </span>
            <span className="text-xs text-slate-400 font-medium">patients alert</span>
          </div>
        </Card>
        <Card title="Group Adherence" subtitle="Monthly average compliance" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{averageAdherence}%</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Good</span>
          </div>
        </Card>
        <Card title="Active Critical Alerts" subtitle="Requires check-in" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">
              {MOCK_ALERTS.filter((a) => a.severity === 'high').length}
            </span>
            <span className="text-xs text-slate-400 font-medium">severe cases</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Patients */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="My Assigned Patients" subtitle="Overview of compliance and last activity log">
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                    <th className="pb-3 pl-2">Patient</th>
                    <th className="pb-3">Monthly Adherence</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {MOCK_PATIENTS.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-55/50 transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="font-semibold text-slate-800">{patient.name}</div>
                        <div className="text-xs text-slate-450 font-medium mt-0.5">{patient.email}</div>
                      </td>
                      <td className="py-3.5 font-bold text-slate-700">
                        {patient.adherence.monthly}%
                      </td>
                      <td className="py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          patient.status === 'On Track' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="!py-1 !px-2.5 text-xs font-bold"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 text-right border-t border-slate-50 pt-4">
              <Link to="/patients" className="text-xs font-bold text-caregiver-600 hover:text-caregiver-700 inline-flex items-center gap-1 transition-colors">
                Manage Patient Roster <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Caregiver actions and alarms summary */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card title="Caregiver Actions">
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                onClick={() => alert('Adding new patients is a future Django API integration feature.')}
                className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors text-center focus:outline-none"
              >
                <UserPlus className="h-5 w-5 text-caregiver-600 mb-2" />
                <span className="text-xs font-bold text-slate-700">Add Patient</span>
              </button>
              <button
                onClick={() => alert('Sending custom dosage alerts is scheduled for future releases.')}
                className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors text-center focus:outline-none"
              >
                <Send className="h-5 w-5 text-caregiver-600 mb-2" />
                <span className="text-xs font-bold text-slate-700">Send Alert</span>
              </button>
            </div>
          </Card>

          {/* Active Critical Alerts */}
          <Card title="Critical Alerts" subtitle="Missed doses or compliance drops">
            <div className="mt-4 space-y-3">
              {MOCK_ALERTS.map((alertItem) => (
                <div
                  key={alertItem.id}
                  className={`p-3 rounded-xl border flex gap-3 text-xs ${
                    alertItem.severity === 'high' ? 'bg-red-50/30 border-red-100' : 'bg-amber-50/30 border-amber-100'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 h-fit ${
                    alertItem.severity === 'high' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-slate-800">{alertItem.patientName}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        alertItem.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {alertItem.severity}
                      </span>
                    </div>
                    <p className="text-slate-500 font-semibold leading-tight">
                      {alertItem.type}: <span className="font-bold text-slate-600">{alertItem.medication}</span>
                    </p>
                    <span className="text-[9px] text-slate-400 font-medium block pt-0.5">{alertItem.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 text-right border-t border-slate-50 pt-4">
              <Link to="/alerts" className="text-xs font-bold text-caregiver-600 hover:text-caregiver-700 inline-flex items-center gap-1 transition-colors">
                View All Alerts <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CaregiverDashboard;
