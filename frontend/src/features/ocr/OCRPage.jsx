import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { addOcrMedicines, extractPrescriptionText } from "./api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function OCRPage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [medicineMessage, setMedicineMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setText("");
    setConfidence(null);
    setMedicines([]);
    setMedicineMessage("");
    if (!file) return setError("Choose a prescription image first.");
    if (!file.type.startsWith("image/"))
      return setError("Please choose a JPG, PNG, WEBP, TIFF, or BMP image.");
    if (file.size > MAX_FILE_SIZE) return setError("The image must be smaller than 10 MB.");

    setBusy(true);
    const result = await extractPrescriptionText(file);
    setBusy(false);
    if (result.error) return setError(result.error.message);
    setText(result.text);
    setConfidence(result.confidence);
    setMedicines(result.medicines);
    const saveResult = await addOcrMedicines(user.id, result.medicines);
    if (saveResult.error)
      setMedicineMessage(
        `Text recognized, but medicines could not be saved: ${saveResult.error.message}`
      );
    else if (saveResult.created)
      setMedicineMessage(
        `${saveResult.created} medicine${saveResult.created === 1 ? "" : "s"} added to Medicines.`
      );
    else if (result.medicines.length)
      setMedicineMessage("Those medicines are already in your Medicines list.");
    else setMedicineMessage("No medicine names were recognized.");
  };

  return (
    <DashboardLayout eyebrow="OCR reader" title="Read a prescription">
      <div className="grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="card">
          <p className="font-body text-sm text-ink-fog">
            Upload a printed or handwritten prescription and generate text from the trained OCR
            models.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="field-label" htmlFor="ocr-image">
              Prescription image
            </label>
            <input
              id="ocr-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/tiff,image/bmp"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="field-input"
            />
            {file && <p className="font-body text-xs text-ink-fog">Selected: {file.name}</p>}
            {error && (
              <p className="font-body text-sm text-rose" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn-brand">
              {busy ? "Reading image..." : "Generate text"}
            </button>
          </form>
        </section>

        <section className="card" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">Generated text</h2>
            {confidence !== null && (
              <span className="badge bg-indigo-soft text-indigo-deep">
                {Math.round(confidence * 100)}% confidence
              </span>
            )}
          </div>
          <div className="mt-4 min-h-56 rounded-lg border border-ink/10 bg-porcelain-dim p-4">
            <p className="whitespace-pre-wrap font-mono text-sm leading-6 text-ink">
              {text || "The recognized prescription text will appear here."}
            </p>
          </div>
          {text && (
            <p className="mt-3 font-body text-xs text-ink-fog">
              Check the generated text with a healthcare professional before taking medicine.
            </p>
          )}
          {medicineMessage && (
            <p className="mt-3 font-body text-sm text-mint-deep" role="status">
              {medicineMessage}
            </p>
          )}
          {medicines.length > 0 && (
            <div className="mt-4 rounded-lg border border-indigo-soft bg-indigo-soft/30 p-4">
              <h3 className="font-display text-base font-semibold text-ink">
                Recognized medicines
              </h3>
              <ul className="mt-2 space-y-1 font-body text-sm text-ink">
                {medicines.map((medicine, index) => (
                  <li key={`${medicine.name}-${index}`}>
                    <strong>{medicine.name}</strong>
                    {medicine.dosage ? ` · ${medicine.dosage}` : ""}
                    {medicine.frequency ? ` · ${medicine.frequency}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
