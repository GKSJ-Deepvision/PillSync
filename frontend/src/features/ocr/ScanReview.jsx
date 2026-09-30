import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import ocrApi from '../../api/ocr.js';
import Alert from '../../components/common/Alert.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import { useMutation } from '../../hooks/useApi.js';
import ItemEditor from './ItemEditor.jsx';

/** What the job is asking of the patient right now. */
export function pendingItems(job) {
  return (job?.items ?? []).filter((item) => item.status === 'PENDING');
}

/** Items with no unit count anywhere: confirming would leave them without stock. */
export function itemsMissingStock(job) {
  return pendingItems(job).filter(
    (item) => item.total_quantity == null || item.total_quantity === ''
  );
}

function SourceImage({ job }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!job.has_image) return undefined;
    let active = true;
    let created = null;
    ocrApi.imageUrl(job.id).then(
      (next) => {
        created = next;
        if (active) setUrl(next);
      },
      () => {}
    );
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [job.id, job.has_image]);

  if (!url) return null;
  return (
    <img
      src={url}
      alt="Your scanned prescription"
      className="max-h-64 rounded-lg border border-slate-200"
    />
  );
}

/**
 * Review what was read, fix it, and add it. Nothing reaches the medicine list
 * until the patient presses the final button.
 */
export default function ScanReview({ job, onJobChange, onConfirmed, onDiscard }) {
  const [text, setText] = useState(job.raw_text);
  const [dirtyIds, setDirtyIds] = useState(() => new Set());

  const reparse = useMutation(useCallback((value) => ocrApi.reparse(job.id, value), [job.id]));
  const confirm = useMutation(useCallback(() => ocrApi.confirm(job.id), [job.id]));
  const reject = useMutation(useCallback(() => ocrApi.reject(job.id), [job.id]));

  const items = pendingItems(job);
  const missing = itemsMissingStock(job);
  const canConfirm = items.length > 0 && missing.length === 0 && dirtyIds.size === 0;

  function onSaved(saved) {
    onJobChange({
      ...job,
      items: job.items.map((item) => (item.id === saved.id ? saved : item)),
    });
  }

  function onDirtyChange(id, dirty) {
    setDirtyIds((current) => {
      const next = new Set(current);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function reread() {
    const result = await reparse.submit(text);
    if (result.ok) {
      setDirtyIds(new Set());
      onJobChange(result.data);
    }
  }

  async function add() {
    const result = await confirm.submit();
    if (result.ok) onConfirmed(result.data);
  }

  async function discard() {
    const result = await reject.submit();
    if (result.ok) onDiscard();
  }

  if (job.status === 'FAILED') {
    return (
      <Card title="We could not read that">
        <div className="space-y-4">
          <Alert tone="error">{job.error}</Alert>
          <p className="text-sm text-slate-600">
            You can try another photo, or type the medicines in instead.
          </p>
          <Button variant="secondary" onClick={onDiscard}>
            Start again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          {items.length} medicine{items.length === 1 ? '' : 's'} found
        </h2>
        {job.header?.doctor_name && (
          <Badge>Dr. {job.header.doctor_name.replace(/^Dr\.?\s*/i, '')}</Badge>
        )}
        {job.header?.issued_on && <Badge>{job.header.issued_on}</Badge>}
      </div>

      {job.warnings?.map((warning) => (
        <Alert key={warning} tone="warning">
          {warning}
        </Alert>
      ))}

      <Alert tone="info">
        Nothing is added until you press <strong>Add to my medicines</strong> below. Check each one
        against your prescription — the reader can make mistakes, especially with handwriting.
      </Alert>

      {items.length === 0 ? (
        <Alert tone="warning" title="No medicines found">
          Correct the text below and read it again, or start over with a clearer photo.
        </Alert>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <ItemEditor key={item.id} item={item} onSaved={onSaved} onDirtyChange={onDirtyChange} />
          ))}
        </ul>
      )}

      <Card
        title="The text that was read"
        subtitle="Fix a misread word here and read it again, instead of editing every field"
      >
        <div className="space-y-3">
          {job.has_image && <SourceImage job={job} />}
          <textarea
            aria-label="Recognised text"
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
          {reparse.error && <Alert tone="error">{reparse.error.message}</Alert>}
          <Button
            variant="secondary"
            size="sm"
            onClick={reread}
            loading={reparse.submitting}
            disabled={text === job.raw_text}
          >
            Read this text again
          </Button>
        </div>
      </Card>

      {confirm.error && (
        <Alert tone="error">
          {confirm.error.message}
          {Object.values(confirm.error.details?.items ?? {}).map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </Alert>
      )}

      {items.length > 0 && missing.length > 0 && (
        <Alert tone="warning">
          Enter how many units you have for {missing.map((m) => m.name).join(', ')} — refill
          reminders depend on it.
        </Alert>
      )}
      {dirtyIds.size > 0 && <Alert tone="info">Save your changes before adding.</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={add} loading={confirm.submitting} disabled={!canConfirm}>
          Add to my medicines
        </Button>
        <Button variant="ghost" onClick={discard} loading={reject.submitting}>
          Discard this scan
        </Button>
      </div>
    </div>
  );
}

/** Shown after confirming. */
export function ScanDone({ result, onAnother }) {
  const count = result.medicines.length;
  return (
    <Card title={`${count} medicine${count === 1 ? '' : 's'} added`}>
      <div className="space-y-4">
        <ul className="list-inside list-disc text-sm text-slate-700">
          {result.medicines.map((medicine) => (
            <li key={medicine.id}>
              {medicine.display_name}
              {medicine.strength && ` ${medicine.strength} ${medicine.strength_unit}`} —{' '}
              {medicine.schedules.length > 0
                ? `${medicine.schedules.length} dose time${medicine.schedules.length === 1 ? '' : 's'} set`
                : 'no dose times (as needed)'}
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate-600">
          Reminders are scheduled and stock is being tracked, so you will be told before anything
          runs out.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/today">
            <Button>See today&rsquo;s medicines</Button>
          </Link>
          <Link to="/refills">
            <Button variant="secondary">See refill forecast</Button>
          </Link>
          <Button variant="ghost" onClick={onAnother}>
            Scan another
          </Button>
        </div>
      </div>
    </Card>
  );
}
