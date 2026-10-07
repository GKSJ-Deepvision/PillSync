import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/ocr/admin-monitoring/`;

function isSuccessfulOCR(scan) {
  const medicine = String(scan.medicine_name ?? "").trim().toLowerCase();
  const dosage = String(scan.dosage ?? "").trim().toLowerCase();
  const frequency = String(scan.frequency ?? "").trim().toLowerCase();
  const quantity = String(scan.quantity ?? "").trim().toLowerCase();

  const unknownValues = ["", "unknown", "null", "none", "n/a", "na"];

  const hasUnknownMedicine =
    unknownValues.includes(medicine) || medicine.includes("?");

  const hasUnknownDosage =
    unknownValues.includes(dosage) || dosage.includes("?");

  const hasUsefulValue =
    medicine !== "" ||
    dosage !== "" ||
    frequency !== "" ||
    quantity !== "";

  return !hasUnknownMedicine && !hasUnknownDosage && hasUsefulValue;
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SourceBadge({ source }) {
  const value = String(source || "unknown").toLowerCase();

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      {value}
    </span>
  );
}

function OCRTable({ scans, emptyMessage }) {
  if (!scans.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Patient ID</th>
            <th className="px-4 py-3">Medicine</th>
            <th className="px-4 py-3">Dosage</th>
            <th className="px-4 py-3">Quantity</th>
            <th className="px-4 py-3">Frequency</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Medicines</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {scans.map((scan) => (
            <tr key={scan.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(scan.created_at)}
              </td>

              <td className="max-w-[180px] truncate px-4 py-3 font-mono text-xs text-slate-600">
                {scan.patient_id || "-"}
              </td>

              <td className="px-4 py-3 font-medium text-slate-900">
                {scan.medicine_name || "unknown"}
              </td>

              <td className="px-4 py-3 text-slate-700">
                {scan.dosage || "unknown"}
              </td>

              <td className="px-4 py-3 text-slate-700">
                {scan.quantity || "unknown"}
              </td>

              <td className="px-4 py-3 text-slate-700">
                {scan.frequency || "unknown"}
              </td>

              <td className="px-4 py-3">
                <SourceBadge source={scan.source} />
              </td>

              <td className="px-4 py-3 text-slate-700">
                {scan.medicine_count ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminOCRMonitoringPage() {
  const { session } = useAuth();

  const [data, setData] = useState({
    total: 0,
    tesseract: 0,
    vision: 0,
    recent_scans: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOCRMonitoring() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          const errorBody = await response.text();

          console.error(
            "OCR monitoring response:",
            response.status,
            errorBody
          );

          throw new Error(
            `Failed to load OCR monitoring data (${response.status}): ${errorBody}`
          );
        }

        const result = await response.json();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("OCR monitoring error:", err);
          setError(err.message || "Failed to load OCR monitoring data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (session?.access_token) {
      loadOCRMonitoring();
    } else {
      setLoading(false);
      setError("You must be logged in to view OCR monitoring.");
    }

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  const successfulScans = useMemo(
    () => data.recent_scans.filter(isSuccessfulOCR),
    [data.recent_scans]
  );

  const unknownScans = useMemo(
    () => data.recent_scans.filter((scan) => !isSuccessfulOCR(scan)),
    [data.recent_scans]
  );

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading OCR monitoring...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-sky-600">
          Admin Monitoring
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          OCR Monitoring
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Read-only overview of prescription OCR activity.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Scans</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {data.total}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Successful OCRs</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {successfulScans.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Needs Review</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {unknownScans.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Vision Scans</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {data.vision}
          </p>
        </div>
      </div>

      {/* Successful OCRs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Successful OCR Scans
            </h2>

            <p className="text-sm text-slate-500">
              Scans where medicine and dosage information were successfully
              identified.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {successfulScans.length}
          </span>
        </div>

        <OCRTable
          scans={successfulScans}
          emptyMessage="No successful OCR scans found."
        />
      </section>

      {/* Unknown / needs review */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Unknown / Needs Review
          </h2>

          <p className="text-sm text-slate-500">
            Scans containing unknown, missing, or unclear OCR fields.
          </p>
        </div>

        <OCRTable
          scans={unknownScans}
          emptyMessage="No unknown or incomplete OCR scans found."
        />
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        This page is read-only. OCR records are displayed for monitoring and
        review; no prescription or OCR data is modified here.
      </div>
    </div>
  );
}


