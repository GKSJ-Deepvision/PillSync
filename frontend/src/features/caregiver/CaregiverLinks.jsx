import { useCallback, useState } from 'react';

import { caregivingApi } from '../../api/profiles.js';
import Alert from '../../components/common/Alert.jsx';
import Badge, { STATUS_TONES } from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { useMutation } from '../../hooks/useApi.js';
import { formatDate, titleCase } from '../../utils/format.js';

function InviteForm({ relationships, onInvited }) {
  const [values, setValues] = useState({
    caregiver_email: '',
    relationship: 'FAMILY',
    can_view_adherence: true,
    can_receive_alerts: true,
    // Seeing a schedule and changing it are very different levels of trust.
    can_manage_medications: false,
  });
  const invite = useCallback((payload) => caregivingApi.invite(payload), []);
  const { submit, submitting, error } = useMutation(invite);

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await submit(values);
    if (result.ok) {
      setValues({ ...values, caregiver_email: '' });
      onInvited();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && <Alert tone="error">{error.message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Caregiver's email"
          type="email"
          required
          value={values.caregiver_email}
          onChange={(event) => setValues({ ...values, caregiver_email: event.target.value })}
          error={error?.details?.caregiver_email?.[0]}
          hint="They must already have a caregiver account."
        />
        <Select
          label="Relationship"
          options={relationships}
          value={values.relationship}
          onChange={(event) => setValues({ ...values, relationship: event.target.value })}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">What they may do</legend>
        {[
          ['can_view_adherence', 'See whether doses were taken'],
          ['can_receive_alerts', 'Receive missed-dose and refill alerts'],
          ['can_manage_medications', 'Add and change medicines'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={values[key]}
              onChange={(event) => setValues({ ...values, [key]: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <Button type="submit" loading={submitting}>
        Send request
      </Button>
    </form>
  );
}

function AssignmentRow({ assignment, viewerIsPatient, onChanged }) {
  const accept = useMutation(useCallback((id) => caregivingApi.accept(id), []));
  const decline = useMutation(useCallback((id) => caregivingApi.decline(id), []));
  const revoke = useMutation(useCallback((id) => caregivingApi.revoke(id), []));

  async function run(mutation) {
    const result = await mutation.submit(assignment.id);
    if (result.ok) onChanged();
  }

  const counterpartName = viewerIsPatient ? assignment.caregiver_name : assignment.patient_name;
  const counterpartEmail = viewerIsPatient ? assignment.caregiver_email : assignment.patient_email;

  const permissions = [
    assignment.can_view_adherence && 'adherence',
    assignment.can_receive_alerts && 'alerts',
    assignment.can_manage_medications && 'medication changes',
  ].filter(Boolean);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium text-slate-900">
          {counterpartName}{' '}
          <Badge tone={STATUS_TONES[assignment.status]}>{titleCase(assignment.status)}</Badge>
        </p>
        <p className="truncate text-sm text-slate-500">{counterpartEmail}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {titleCase(assignment.relationship)} · requested {formatDate(assignment.created_at)}
          {permissions.length > 0 && ` · can see ${permissions.join(', ')}`}
        </p>
      </div>

      <div className="flex gap-2">
        {assignment.status === 'PENDING' && viewerIsPatient && (
          <>
            <Button size="sm" loading={accept.submitting} onClick={() => run(accept)}>
              Accept
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={decline.submitting}
              onClick={() => run(decline)}
            >
              Decline
            </Button>
          </>
        )}
        {assignment.status === 'ACTIVE' && (
          <Button
            size="sm"
            variant="danger"
            loading={revoke.submitting}
            onClick={() => run(revoke)}
          >
            Revoke
          </Button>
        )}
      </div>
    </li>
  );
}

export default function CaregiverLinks({ assignments, enums, viewerId, onChanged }) {
  return (
    <>
      <Card title={`Caregiver links (${assignments.length})`}>
        {assignments.length === 0 ? (
          <EmptyState
            title="No caregivers yet"
            description="Invite someone below to share your medication schedule with them."
          />
        ) : (
          <ul className="space-y-2">
            {assignments.map((assignment) => (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                viewerIsPatient={assignment.patient === viewerId}
                onChanged={onChanged}
              />
            ))}
          </ul>
        )}
      </Card>

      <Card title="Invite a caregiver">
        <InviteForm relationships={enums.caregiver_relationships ?? []} onInvited={onChanged} />
      </Card>
    </>
  );
}
