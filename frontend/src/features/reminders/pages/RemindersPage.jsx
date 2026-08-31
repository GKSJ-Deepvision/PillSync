import { useEffect, useState } from 'react';
import { reminderApi } from '../../../api/reminders';
import { Layout } from '../../../components/layout';
import { Card, CardBody } from '../../../components/common/Card';
import { Button, Badge, EmptyState, CardSkeleton, Alert } from '../../../components/common';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadReminders = async () => {
      try {
        const data = await reminderApi.getReminders();

        if (!cancelled) {
          setReminders(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to fetch reminders');
        }
        console.error(err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReminders();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleMarkTaken = async (id) => {
    try {
      setActioningId(id);
      await reminderApi.markTaken(id);

      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === id ? { ...reminder, status: 'taken' } : reminder
        )
      );
    } catch (err) {
      setError('Failed to mark as taken');
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkMissed = async (id) => {
    try {
      setActioningId(id);
      await reminderApi.markMissed(id);

      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === id ? { ...reminder, status: 'missed' } : reminder
        )
      );
    } catch (err) {
      setError('Failed to mark as missed');
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleSnooze = async (id) => {
    try {
      setActioningId(id);
      await reminderApi.snoozeReminder(id, 30);

      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === id ? { ...reminder, status: 'snoozed' } : reminder
        )
      );
    } catch (err) {
      setError('Failed to snooze reminder');
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const groupedReminders = {
    upcoming: reminders.filter((r) => r.status === 'upcoming'),
    taken: reminders.filter((r) => r.status === 'taken'),
    missed: reminders.filter((r) => r.status === 'missed'),
    snoozed: reminders.filter((r) => r.status === 'snoozed'),
  };

  const totalReminders = reminders.length;

  const completionRate =
    totalReminders > 0 ? Math.round((groupedReminders.taken.length / totalReminders) * 100) : 0;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reminders</h1>
        <p className="text-gray-600 mt-1">Manage your medication reminders</p>
      </div>

      {error && (
        <Alert type="danger" message={error} onClose={() => setError('')} className="mb-6" />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <p className="text-gray-600 text-sm">Today's Reminders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalReminders}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-gray-600 text-sm">Taken</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {groupedReminders.taken.length}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-gray-600 text-sm">Missed</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{groupedReminders.missed.length}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-gray-600 text-sm">Completion Rate</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{completionRate}%</p>
          </CardBody>
        </Card>
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : totalReminders === 0 ? (
        <EmptyState
          icon={Clock}
          title="No reminders"
          message="You don't have any reminders set up yet"
        />
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          {groupedReminders.upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Reminders</h2>

              <div className="space-y-3">
                {groupedReminders.upcoming.map((reminder) => (
                  <Card key={reminder.id} hoverable>
                    <CardBody>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {reminder.medicationName}
                          </h3>

                          <p className="text-gray-600 text-sm mt-1">
                            {reminder.time} · {reminder.schedule} · {reminder.dosage}
                          </p>
                        </div>

                        <Badge variant="primary">{reminder.schedule}</Badge>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleMarkTaken(reminder.id)}
                          loading={actioningId === reminder.id}
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Taken
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSnooze(reminder.id)}
                          loading={actioningId === reminder.id}
                          className="flex-1"
                        >
                          Snooze (30m)
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleMarkMissed(reminder.id)}
                          loading={actioningId === reminder.id}
                          className="flex-1"
                        >
                          Missed
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Taken */}
          {groupedReminders.taken.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Taken ({groupedReminders.taken.length})
              </h2>

              <div className="space-y-2">
                {groupedReminders.taken.map((reminder) => (
                  <Card key={reminder.id}>
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{reminder.medicationName}</p>

                          <p className="text-sm text-gray-600">
                            {reminder.time} · {reminder.dosage}
                          </p>
                        </div>

                        <Badge variant="success">Taken</Badge>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Missed */}
          {groupedReminders.missed.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Missed ({groupedReminders.missed.length})
              </h2>

              <div className="space-y-2">
                {groupedReminders.missed.map((reminder) => (
                  <Card key={reminder.id}>
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{reminder.medicationName}</p>

                          <p className="text-sm text-gray-600">
                            {reminder.time} · {reminder.dosage}
                          </p>
                        </div>

                        <Badge variant="danger">Missed</Badge>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
