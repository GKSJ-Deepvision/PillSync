import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function CaregiverDashboard() {
  const { user } = useAuth();
  const [linkedPatients, setLinkedPatients] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("caregiver_links")
      .select("patient_id, status, profiles:patient_id(full_name)")
      .eq("caregiver_id", user.id)
      .eq("status", "accepted")
      .then(({ data }) => setLinkedPatients(data ?? []));
  }, [user]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Linked patients</h1>
      {linkedPatients.length === 0 ? (
        <p className="text-sm text-gray-600">
          No linked patients yet. An admin needs to create the link.
        </p>
      ) : (
        <ul className="space-y-2">
          {linkedPatients.map((l) => (
            <li key={l.patient_id} className="border rounded px-3 py-2">
              {l.profiles?.full_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
