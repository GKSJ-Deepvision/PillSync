import EmptyState from '../../components/EmptyState';
import { Calendar } from 'lucide-react';

const Schedule = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="schedule-page">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Medication Schedule</h1>
        <p className="text-xs text-slate-455 mt-0.5 font-medium">Calendar tracking compliance timelines.</p>
      </div>

      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <div className="bg-teal-100 text-teal-600 p-2.5 rounded-xl shrink-0 h-fit">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-teal-950 font-sans">Daily Doses Integration</h3>
          <p className="text-[11px] leading-relaxed text-teal-850">
            Future milestones will support **recurring calendars**, **SMS reminders**, and **caregiver alert loops** to keep you in sync with your prescriptions lists.
          </p>
        </div>
      </div>

      <EmptyState
        title="Schedule Calendar Empty"
        description="Daily dosage tracking schedules will connect in the next phase."
        actionText="Configure Doses (Disabled)"
        onAction={() => alert('Dosage schedule planning is scheduled for the next phase.')}
      />
    </div>
  );
};

export default Schedule;
