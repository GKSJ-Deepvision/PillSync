import Alert from '../../components/common/Alert.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import DoseCard from './DoseCard.jsx';

const SLOT_ORDER = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
const SLOT_LABELS = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  EVENING: 'Evening',
  NIGHT: 'Night',
};

function AdherenceBar({ summary }) {
  const { total, taken, missed, pending } = summary;
  if (!total) return null;

  const width = (count) => `${(count / total) * 100}%`;

  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-200" role="presentation">
        <div className="bg-emerald-500" style={{ width: width(taken) }} />
        <div className="bg-rose-500" style={{ width: width(missed) }} />
        <div className="bg-slate-300" style={{ width: width(pending) }} />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        <span className="font-medium text-slate-900">{taken}</span> of {total} taken
        {missed > 0 && <span className="text-rose-700"> · {missed} missed</span>}
        {pending > 0 && <span> · {pending} still due</span>}
      </p>
    </div>
  );
}

/**
 * The day's medication, in the four parts the specification names.
 *
 * Empty slots are hidden rather than shown as empty rows: a patient who takes
 * one tablet a morning should see one section, not four.
 */
export default function TodaysDoses({ data, onChanged, readOnly = false }) {
  const slots = data?.slots ?? {};
  const summary = data?.summary ?? { total: 0, taken: 0, missed: 0, pending: 0 };
  const populated = SLOT_ORDER.filter((slot) => (slots[slot] ?? []).length > 0);

  if (populated.length === 0) {
    return (
      <Card title="Today">
        <EmptyState
          title="Nothing scheduled today"
          description="Add a medicine and a dosage schedule, and its doses will appear here."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Today" subtitle={new Date(`${data.date}T00:00:00`).toDateString()}>
        <AdherenceBar summary={summary} />
      </Card>

      {summary.missed > 0 && (
        <Alert tone="warning" title="Missed doses today">
          {summary.missed} dose{summary.missed === 1 ? '' : 's'} went unrecorded. Any caregiver you
          have shared alerts with has been told.
        </Alert>
      )}

      {populated.map((slot) => (
        <Card key={slot} title={SLOT_LABELS[slot]}>
          <ul className="space-y-2">
            {slots[slot].map((dose) => (
              <DoseCard key={dose.id} dose={dose} onChanged={onChanged} readOnly={readOnly} />
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
