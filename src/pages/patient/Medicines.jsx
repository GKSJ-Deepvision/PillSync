import EmptyState from '../../components/EmptyState';
import { Sparkles } from 'lucide-react';

const Medicines = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="medicines-page">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Prescriptions & Medicines</h1>
        <p className="text-xs text-slate-450 mt-0.5">Manage, scan, and inspect active medications.</p>
      </div>

      {/* Preview Card showing what Milestone 2 will hold */}
      <div className="bg-gradient-to-br from-indigo-50 to-primary-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl shrink-0 h-fit">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-indigo-950">Future Milestone Preview</h3>
          <p className="text-[11px] leading-relaxed text-indigo-850">
            Milestone 2 will launch **Medication Safety AI** and **OCR Pill Scanner**. You will be able to snap photos of pill bottles to automatically parse prescriptions, identify adverse interaction warnings, and forecast refills.
          </p>
        </div>
      </div>

      {/* Render Empty State */}
      <EmptyState
        title="No Medications Logged"
        description="Prescriptions management will connect in the next phase. You will be able to log drugs and monitor compliance."
        actionText="Scan Pill Bottle (Disabled)"
        onAction={() => alert('Pill bottle OCR scanning is a future milestone feature.')}
      />
    </div>
  );
};

export default Medicines;
