import { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { MOCK_ACTIVITY_LOGS } from '../../data/mockData';
import { History, Search, Download } from 'lucide-react';

const ActivityLog = () => {
  const [logs] = useState(MOCK_ACTIVITY_LOGS);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(
    (log) =>
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="activity-log-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-rose-500" />
            System Activity Log
          </h1>
          <p className="text-xs text-slate-450 mt-0.5 font-medium">Audit trail tracking all modifications and authentications.</p>
        </div>
        <Button
          variant="outline"
          className="!py-1.5 !px-3 text-xs self-start sm:self-auto"
          onClick={() => alert('Exporting log data to CSV is a Milestone 2 feature.')}
        >
          <Download className="h-4 w-4 mr-1.5" />
          Export Logs (CSV)
        </Button>
      </div>

      <Card className="!p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search activity logs by user or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 focus:ring focus:ring-rose-100 focus:ring-opacity-40"
          />
        </div>
      </Card>

      {/* Log list table */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          title="No Logs Recorded"
          description="There are no recent audit trials matching your search criteria."
        />
      ) : (
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Action Triggered</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{log.user}</div>
                      <div className="text-[10px] text-slate-400 capitalize mt-0.5">{log.role}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 leading-relaxed">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-450">
                      {new Date(log.time).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right pr-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        log.status === 'Success'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {log.status}
                      </span>
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

export default ActivityLog;
