import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { uploadPrescriptionImage } from "./api";

export default function PrescriptionUploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ocr, setOcr] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setOcr(null);
    if (!file) return setError("Choose a prescription image first.");
    if (!file.type.startsWith("image/")) return setError("Only image files are supported.");
    if (file.size > 10 * 1024 * 1024) return setError("The image must be smaller than 10 MB.");

    setBusy(true);
    const { data, error: uploadError } = await uploadPrescriptionImage(user.id, file);
    setBusy(false);
    if (uploadError) return setError(uploadError.message);
    setFile(null);
    event.target.reset();
    setOcr(data?.ocr || null);
    const medicineCount = data?.medicinesCreated || 0;
    setMessage(
      medicineCount
        ? `Prescription uploaded and ${medicineCount} medicine${medicineCount === 1 ? "" : "s"} added to Medicines.`
        : "Prescription uploaded. Your caregiver can now view it."
    );
  };

  return (
    <DashboardLayout eyebrow="Prescriptions" title="Share a prescription">
      <div className="card max-w-xl">
        <p className="font-body text-sm text-ink-fog">
          Upload a clear photo of your prescription for your linked caregiver.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="field-label" htmlFor="prescription-image">
            Prescription image
          </label>
          <input
            id="prescription-image"
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="field-input"
          />
          {error && <p className="font-body text-sm text-rose">{error}</p>}
          {message && <p className="font-body text-sm text-mint-deep">{message}</p>}
          {ocr && (
            <div
              className="rounded-lg border border-indigo-soft bg-indigo-soft/30 p-4"
              aria-live="polite"
            >
              <h2 className="font-display text-base font-semibold text-ink">
                Recognized medicine details
              </h2>
              <p className="mt-1 whitespace-pre-wrap font-body text-sm text-ink-fog">
                {ocr.text || "No text was recognized."}
              </p>
              {ocr.medicines.length > 0 && (
                <ul className="mt-3 space-y-2 font-body text-sm text-ink">
                  {ocr.medicines.map((medicine, index) => (
                    <li key={`${medicine.name}-${index}`}>
                      <strong>{medicine.name}</strong>
                      {medicine.dosage ? ` · ${medicine.dosage}` : ""}
                      {medicine.frequency ? ` · ${medicine.frequency}` : ""}
                      {medicine.quantity ? ` · Qty ${medicine.quantity}` : ""}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 font-body text-xs text-ink-fog">
                OCR confidence: {Math.round(ocr.confidence * 100)}%. Please verify handwritten
                details.
              </p>
            </div>
          )}
          <button type="submit" disabled={busy} className="btn-brand">
            {busy ? "Uploading..." : "Upload prescription"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
