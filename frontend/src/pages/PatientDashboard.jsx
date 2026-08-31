import { useAuth } from "../context/AuthContext";
import DoseRing from "../features/dashboard/DoseRing";

export default function PatientDashboard() {
  const { profile } = useAuth();
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
      </h1>
      <DoseRing />
      <p className="text-sm text-gray-600">
        Medicine scheduling, reminders, and adherence tracking arrive in
        Milestone 2.
      </p>
    </div>
  );
}
