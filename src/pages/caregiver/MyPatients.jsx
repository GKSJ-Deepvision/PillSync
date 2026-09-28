import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { MOCK_PATIENTS } from '../../data/mockData';
import { Search, Eye } from 'lucide-react';

const MyPatients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredPatients = MOCK_PATIENTS.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || patient.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in" data-testid="patients-list-page">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">My Patients</h1>
        <p className="text-xs text-slate-450 mt-0.5 font-medium">Monitor compliance schedules and alert logs for your patients.</p>
      </div>

      {/* Filter and search bar */}
      <Card className="!p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search patients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm transition-all focus:outline-none focus:border-caregiver-500 focus:ring focus:ring-caregiver-100 focus:ring-opacity-40"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-caregiver-500 focus:ring focus:ring-caregiver-100 focus:ring-opacity-40 bg-white text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="On Track">On Track</option>
            <option value="Needs Attention">Needs Attention</option>
          </select>
        </div>
      </Card>

      {/* Patient Table Display */}
      {filteredPatients.length === 0 ? (
        <EmptyState
          title="No Assigned Patients Found"
          description="Try modifying your search queries or filtering criteria."
        />
      ) : (
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">{patient.name}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{patient.email}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-650">
                      <div className="text-xs">{patient.age} years old</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{patient.phone}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        patient.status === 'On Track'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-500">
                      {patient.lastActivity}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        variant="primary"
                        className="!py-1.5 !px-3 text-xs bg-caregiver-600 hover:bg-caregiver-700 focus:ring-caregiver-500 flex items-center gap-1.5 ml-auto"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MyPatients;
