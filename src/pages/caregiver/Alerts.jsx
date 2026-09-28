import { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { MOCK_ALERTS } from '../../data/mockData';
import { AlertTriangle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Alerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  const handleResolve = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleResolveAll = () => {
    setAlerts([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="alerts-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Assigned Patient Alerts</h1>
          <p className="text-xs text-slate-450 mt-0.5 font-medium">Review missed dosages, adherence drops, and refill warnings.</p>
        </div>
        {alerts.length > 0 && (
          <Button variant="outline" onClick={handleResolveAll} className="!py-1.5 !px-3 text-xs self-start sm:self-auto">
            <Check className="h-4 w-4 mr-1.5 text-emerald-600" />
            Resolve All Alerts
          </Button>
        )}
      </div>

      {/* Preview Card showing future milestones */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl shrink-0 h-fit">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-amber-950 font-sans">Patient Alert Engine</h3>
          <p className="text-[11px] leading-relaxed text-amber-850">
            These are mock alerts representing patients. In the next milestone, our **Django Notification Engine** will broadcast high-priority WebSocket alerts, Wearables vitals warnings, and WhatsApp message logs directly to caregivers.
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          title="All Alerts Resolved!"
          description="Your patient roster has no active flags or warning indicators."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alertItem) => (
            <Card
              key={alertItem.id}
              className={`p-4 border-l-4 transition-all ${
                alertItem.severity === 'high' ? 'border-l-red-500' : 'border-l-amber-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg shrink-0 h-fit ${
                    alertItem.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{alertItem.patientName}</h3>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        alertItem.severity === 'high' ? 'bg-red-55/75 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {alertItem.severity} priority
                      </span>
                    </div>
                    <p className="text-slate-500 font-semibold leading-relaxed mt-1">
                      {alertItem.type}: <span className="font-bold text-slate-705">{alertItem.medication}</span>
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold block pt-1">
                      Reported: {alertItem.time}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    className="!py-1 !px-2.5 text-xs font-semibold"
                    onClick={() => navigate(`/patients/${alertItem.patientId}`)}
                  >
                    Details
                  </Button>
                  <Button
                    variant="secondary"
                    className="!py-1 !px-2.5 text-xs text-emerald-700 font-bold hover:bg-emerald-50 border border-transparent hover:border-emerald-100"
                    onClick={() => handleResolve(alertItem.id)}
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
