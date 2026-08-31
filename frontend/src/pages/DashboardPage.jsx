import { useAuth } from "../context/AuthContext";
import PatientDashboard from "./PatientDashboard";
import CaregiverDashboard from "./CaregiverDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardPage() {
  const { role } = useAuth();
  if (role === "admin") return <AdminDashboard />;
  if (role === "caregiver") return <CaregiverDashboard />;
  return <PatientDashboard />;
}
