import { useCallback, useEffect, useState } from "react";
import { listReminders } from "../api";

export function useReminders({ userId, medicineId }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setReminders([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listReminders({ userId, medicineId });
      setReminders(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId, medicineId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { reminders, loading, error, refetch };
}
