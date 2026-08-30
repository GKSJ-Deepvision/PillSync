import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { timeOfDayGreeting } from "../utils/greeting";

export default function CaregiverDashboard() {
  const { profile, user } = useAuth();
  const { label } = timeOfDayGreeting();
  const firstName = (profile?.full_name || "there").split(" ")[0];

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadLinks() {
      const { data, error } = await supabase
        .from("caregiver_links")
        .select("id, status, patient:patient_id(id, full_name)")
        .eq("caregiver_id", user.id);
      if (mounted) {
        if (!error) setLinks(data || []);
        setLoading(false);
      }
    }
    if (user?.id) loadLinks();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <DashboardLayout eyebrow="Caregiver" title={`${label}, ${firstName}`}>
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Linked patients</h2>
          <span className="badge bg-indigo-soft text-indigo-deep">{links.length} linked</span>
        </div>

        {loading ? (
          <p className="mt-4 font-body text-sm text-ink-fog">Loading…</p>
        ) : links.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-ink/15 bg-porcelain-dim px-5 py-8 text-center">
            <p className="font-body text-sm text-ink-fog">
              No patients linked yet. Ask the patient to share their PillSync email with
              an admin, who can connect your accounts from{" "}
              <span className="font-mono">caregiver_links</span>.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-ink/5">
            {links.map((link) => (
              <li key={link.id} className="flex items-center justify-between py-3">
                <span className="font-body text-sm font-medium text-ink">
                  {link.patient?.full_name || "Unnamed patient"}
                </span>
                <span className="badge bg-mint-soft text-mint-deep">{link.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      
    </DashboardLayout>
  );
}
