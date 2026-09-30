import { useCallback, useState } from 'react';

import adherenceApi from '../../api/adherence.js';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { formatDate } from '../../utils/format.js';

const PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function Change({ value }) {
  if (value == null) return <span className="text-slate-500">no earlier period to compare</span>;
  if (value === 0) return <span className="text-slate-600">unchanged from the period before</span>;
  const better = value > 0;
  return (
    <span className={better ? 'text-emerald-700' : 'text-rose-700'}>
      {better ? 'up' : 'down'} {Math.abs(value)} points on the period before
    </span>
  );
}

/** A printable weekly or monthly summary, with a CSV download for the doctor. */
export default function ReportCard() {
  const [period, setPeriod] = useState('weekly');
  const fetchReport = useCallback(() => adherenceApi.report(period), [period]);
  const report = useApi(fetchReport);
  const download = useMutation(useCallback(() => adherenceApi.downloadReport(period), [period]));

  const data = report.data;

  return (
    <Card
      title="Report"
      subtitle="Share this with your doctor or caregiver"
      actions={
        <div role="group" aria-label="Report period" className="flex gap-1">
          {PERIODS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={period === option.value ? 'primary' : 'secondary'}
              aria-pressed={period === option.value}
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      }
    >
      {report.error && <Alert tone="error">{report.error.message}</Alert>}
      {download.error && <Alert tone="error">{download.error.message}</Alert>}

      {data && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {formatDate(data.start)} to {formatDate(data.end)}
          </p>
          {data.resolved === 0 ? (
            <p className="text-sm text-slate-500">No recorded doses in this period.</p>
          ) : (
            <>
              <p className="text-lg text-slate-900">
                You took <strong>{data.taken}</strong> of <strong>{data.resolved}</strong> doses (
                <strong>{Math.round(data.adherence_rate)}%</strong>),{' '}
                <Change value={data.change_from_previous} />.
              </p>
              <ul className="list-inside list-disc text-sm text-slate-600">
                {data.on_time_rate != null && (
                  <li>{Math.round(data.on_time_rate)}% of taken doses were on time.</li>
                )}
                <li>
                  Current streak: {data.streaks.current} perfect day
                  {data.streaks.current === 1 ? '' : 's'}.
                </li>
                {data.missed_analysis.insights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="mt-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => download.submit()}
          loading={download.submitting}
        >
          Download as CSV
        </Button>
      </div>
    </Card>
  );
}
