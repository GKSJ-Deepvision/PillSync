const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
import { supabase } from "../../lib/supabaseClient";

export async function extractPrescriptionText(file) {
  const body = new FormData();
  body.append("file", file);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/v1/ocr/extract`, { method: "POST", body });
  } catch {
    return { error: new Error("OCR service is unavailable. Start the backend and try again.") };
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) return { error: new Error(result.detail || "The image could not be read. Check that the OCR backend is running.") };
  return {
    text: result.text || "No text was recognized.",
    medicines: result.medicines || [],
    confidence: result.confidence,
    engine: result.engine,
  };
}

export async function addOcrMedicines(patientId, medicines) {
  const recognized = (medicines || []).filter((medicine) => medicine?.name?.trim());
  if (!recognized.length) return { created: 0 };

  const { data: existing, error: existingError } = await supabase
    .from("medications")
    .select("name")
    .eq("patient_id", patientId);
  if (existingError) return { error: existingError };

  const existingNames = new Set((existing || []).map((medicine) => medicine.name.trim().toLowerCase()));
  const rows = recognized
    .filter((medicine) => !existingNames.has(medicine.name.trim().toLowerCase()))
    .map((medicine) => ({
      patient_id: patientId,
      name: medicine.name.trim(),
      strength: medicine.dosage || null,
      instructions: [medicine.frequency, medicine.instructions].filter(Boolean).join("; ") || null,
      stock_quantity: Number.parseInt(medicine.quantity, 10) || 0,
      low_stock_threshold: 5,
      refill_lead_days: 5,
    }));

  if (!rows.length) return { created: 0 };
  const { data, error } = await supabase.from("medications").insert(rows).select();
  return { created: data?.length || 0, error };
}