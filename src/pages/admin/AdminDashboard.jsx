import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { MOCK_SYSTEM_STATS, MOCK_ACTIVITY_LOGS } from '../../data/mockData';
import { Users, History, Cpu, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-dashboard">
      {/* Welcome Banner Card */}
      <div className="bg-gradient-to-r from-rose-600 to-red-655 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-soft">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Admin Console: {user?.name || 'Administrator'}</h1>
          <p className="text-xs text-red-150 mt-1">Audit logs, registry settings, and health compliance dashboards.</p>
        </div>
      </div>

      {/* Statistics deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Users" subtitle="Registered on system" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{MOCK_SYSTEM_STATS.totalUsers}</span>
            <span className="text-xs text-slate-400 font-medium">accounts</span>
          </div>
        </Card>
        <Card title="Patients Registry" subtitle="Active trackers" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 text-emerald-600">{MOCK_SYSTEM_STATS.totalPatients}</span>
            <span className="text-xs text-slate-400 font-medium">monitored</span>
          </div>
        </Card>
        <Card title="Caregivers Registry" subtitle="Assigned providers" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 text-violet-600">{MOCK_SYSTEM_STATS.totalCaregivers}</span>
            <span className="text-xs text-slate-400 font-medium">accounts</span>
          </div>
        </Card>
        <Card title="System Admins" subtitle="Security access keys" className="flex flex-col justify-between">
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 text-rose-650">{MOCK_SYSTEM_STATS.totalAdmins}</span>
            <span className="text-xs text-slate-400 font-medium">admins</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Security Audit Logs */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Recent Activity Audit Logs" subtitle="Security audit actions">
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                    <th className="pb-3 pl-2">User</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3 text-right pr-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {MOCK_ACTIVITY_LOGS.slice(0, 4).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors text-xs">
                      <td className="py-3 pl-2">
                        <div className="font-semibold text-slate-800">{log.user}</div>
                        <div className="text-[10px] text-slate-400 capitalize mt-0.5">{log.role}</div>
                      </td>
                      <td className="py-3 text-slate-655 font-semibold">
                        {log.action}
                      </td>
                      <td className="py-3 text-slate-400 font-medium">
                        {new Date(log.time).toLocaleTimeString()}
                      </td>
                      <td className="py-3 text-right pr-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          log.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 text-right border-t border-slate-50 pt-4">
              <Link to="/activity-log" className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors">
                View Security Audit Logs <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Platform stats summaries */}
        <div className="space-y-6">
          <Card title="System Performance Overview">
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-slate-705">Compliance Rate</span>
                </div>
                <span className="font-extrabold text-slate-800">{MOCK_SYSTEM_STATS.complianceRate}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-rose-650" />
                  <span className="font-bold text-slate-705">Platform Uptime</span>
                </div>
                <span className="font-extrabold text-slate-800">{MOCK_SYSTEM_STATS.systemUptime}</span>
              </div>
            </div>
          </Card>
          
          <Card title="Quick Actions">
            <div className="space-y-2.5 mt-2">
              <Link to="/users" className="block">
                <Button variant="outline" className="w-full text-xs font-bold justify-start gap-2.5">
                  <Users className="h-4 w-4 text-rose-500" />
                  Manage User Accounts
                </Button>
              </Link>
              <Link to="/activity-log" className="block">
                <Button variant="outline" className="w-full text-xs font-bold justify-start gap-2.5">
                  <History className="h-4 w-4 text-rose-500" />
                  Check System Audits
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
