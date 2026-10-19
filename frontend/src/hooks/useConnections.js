/**
 * useConnections
 *
 * A hook that fetches the bidirectional caregiver↔patient relationships
 * for the currently logged-in user.
 *
 * - If the user is a CAREGIVER → fetches the list of assigned patients
 * - If the user is a PATIENT  → fetches the list of assigned caregivers
 *
 * Returns: { connections, loading, error, reload }
 */
import { useState, useEffect, useCallback } from "react";
import { fetchCaregiverPatients, fetchPatientCaregivers } from "../services/api";

export function useConnections(user, overrideRole = null) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const role = overrideRole || user?.role || "patient";
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      let data = [];
      if (role === "caregiver") {
        // Caregiver sees their patients
        data = await fetchCaregiverPatients(userId);
      } else {
        // Patient (or admin in patient view) sees their caregivers
        data = await fetchPatientCaregivers(userId);
      }
      setConnections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("useConnections fetch error:", err.message);
      setError(err.message);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    load();
  }, [load]);

  return { connections, loading, error, reload: load };
}
