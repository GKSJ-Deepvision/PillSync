/**
 * Thin client for the Django backend (OCR scanning + the refill what-if calculator).
 * Every request carries the signed-in user's Supabase access token; the backend verifies it and
 * uses the token's user id as the patient, so no patient id is sent from here.
 */
import { supabase } from "./supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("You are signed out. Please log in again.");
  return { Authorization: `Bearer ${token}` };
}

async function request(path, options, fallbackMessage) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...(await authHeaders()), ...(options.headers || {}) },
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Can't reach the server. Is the backend running?");
    }
    throw err;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || fallbackMessage);
  }
  return res.json();
}

/** Returns { medicines: [...], source, handwriting_suspected, warnings, needs_review, ... } */
export function scanPrescription({ imageFile }) {
  const formData = new FormData();
  formData.append("image", imageFile);
  return request("/api/ocr/scan/", { method: "POST", body: formData }, "Failed to scan the image.");
}

export function checkRefill({
  medicationId,
  medicineName,
  quantityOnHand,
  dailyConsumption,
  leadTimeDays = 5,
  lowStockThresholdDays = 5,
}) {
  return request(
    "/api/refills/check/",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medication_id: medicationId,
        medicine_name: medicineName,
        quantity_on_hand: quantityOnHand,
        daily_consumption: dailyConsumption,
        lead_time_days: leadTimeDays,
        low_stock_threshold_days: lowStockThresholdDays,
      }),
    },
    "Failed to check refill status."
  );
}