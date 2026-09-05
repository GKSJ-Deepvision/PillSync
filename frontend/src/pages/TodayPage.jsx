import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import remindersApi from '../api/reminders.js';
import Alert from '../components/common/Alert.jsx';
import Spinner from '../components/common/Spinner.jsx';
import TodaysDoses from '../features/reminders/TodaysDoses.jsx';
import { useApi } from '../hooks/useApi.js';
import { selectRole } from '../store/authSlice.js';

export default function TodayPage() {
  const role = useSelector(selectRole);
  const fetchToday = useCallback(() => remindersApi.today(), []);
  const today = useApi(fetchToday);

  if (today.loading) return <Spinner label="Loading today's medicines" className="p-6" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Today&rsquo;s medicines</h1>
        <p className="mt-1 text-sm text-slate-600">
          Mark each dose as you take it. Anything left unrecorded four hours after its time is
          logged as missed.
        </p>
      </div>

      {today.error && <Alert tone="error">{today.error.message}</Alert>}

      <TodaysDoses data={today.data} onChanged={today.reload} readOnly={role === 'CAREGIVER'} />
    </div>
  );
}
