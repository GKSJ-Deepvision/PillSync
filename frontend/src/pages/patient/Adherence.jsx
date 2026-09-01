import EmptyState from '../../components/EmptyState';
import { Activity } from 'lucide-react';

const Adherence = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="adherence-page">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Adherence Analytics</h1>
        <p className="text-xs text-slate-455 mt-0.5 font-medium">Compliance tracker metrics.</p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-primary-50 border border-purple-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl shrink-0 h-fit">
          <Activity className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-purple-950 font-sans">Intelligent Adherence Analysis</h3>
          <p className="text-[11px] leading-relaxed text-purple-855">
            Analytics engines in future phases will generate **weekly graphs summaries**, **missed-dosage warnings**, and **PDF report downloads** for doctors.
          </p>
        </div>
      </div>

      <EmptyState
        title="Compliance Analytics Unavailable"
        description="Detailed analytics summaries will connect in the next phase."
        actionText="Export PDF (Disabled)"
        onAction={() => alert('Analytics export is scheduled for the next phase.')}
      />
    </div>
  );
};

export default Adherence;
