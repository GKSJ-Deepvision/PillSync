import Alert from '../../components/common/Alert.jsx';
import Badge, { STATUS_TONES } from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatDate, titleCase } from '../../utils/format.js';

/** A caregiver's view: who has granted them access, and what they can see. */
export default function AssignedPatients({ assignments, profiles }) {
  const active = assignments.filter((row) => row.status === 'ACTIVE');
  const pending = assignments.filter((row) => row.status === 'PENDING');

  return (
    <>
      {pending.length > 0 && (
        <Alert tone="info" title="Waiting for approval">
          {pending.length} request{pending.length === 1 ? '' : 's'} still{' '}
          {pending.length === 1 ? 'needs' : 'need'} the patient to accept.
        </Alert>
      )}

      <Card title={`Active patients (${active.length})`}>
        {active.length === 0 ? (
          <EmptyState
            title="No patients yet"
            description="A patient invites you from their Caregivers page, using the email on your account."
          />
        ) : (
          <ul className="space-y-2">
            {active.map((assignment) => (
              <li key={assignment.id} className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="font-medium text-slate-900">
                  {assignment.patient_name}{' '}
                  <Badge tone={STATUS_TONES[assignment.status]}>
                    {titleCase(assignment.status)}
                  </Badge>
                </p>
                <p className="text-sm text-slate-500">{assignment.patient_email}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {titleCase(assignment.relationship)} · linked{' '}
                  {formatDate(assignment.responded_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title={`Profiles you can see (${profiles.length})`}
        subtitle="Including the family profiles your patients manage"
      >
        {profiles.length === 0 ? (
          <EmptyState title="Nothing shared with you yet" />
        ) : (
          <ul className="space-y-2">
            {profiles.map((profile) => (
              <li key={profile.id} className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-800">{profile.full_name}</p>
                <p className="text-sm text-slate-500">
                  {profile.age != null ? `${profile.age} years` : 'Age not recorded'}
                  {profile.patient_conditions?.length > 0 &&
                    ` · ${profile.patient_conditions.map((c) => c.condition_name).join(', ')}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
