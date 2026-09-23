/** Turns what OCR read (one entry per medicine) into editable cards and `medications` rows. */

export const DEFAULT_TIMES = {
  morning: "08:00",
  afternoon: "14:00",
  evening: "18:00",
  night: "21:00",
  bedtime: "22:00",
};

const CATEGORY_KEYWORDS = [
  ["Blood Pressure", ["amlodipine", "telmisartan", "losartan", "olmesartan", "enalapril", "ramipril", "hydrochlorothiazide"]],
  ["Diabetes", ["metformin", "glimepiride", "gliclazide", "sitagliptin", "insulin", "vildagliptin"]],
  ["Thyroid", ["levothyroxine", "thyroxine", "thyronorm", "carbimazole"]],
  ["Antibiotics", ["amoxicillin", "amoxycillin", "azithromycin", "cefixime", "ciprofloxacin", "doxycycline", "cefuroxime", "augmentin"]],
  ["Vitamins", ["vitamin", "calcium", "folic", "multivitamin", "b12", "zinc"]],
  ["Heart", ["atenolol", "metoprolol", "atorvastatin", "rosuvastatin", "clopidogrel", "aspirin", "bisoprolol"]],
];

/** Best-effort suggestion only - the user can change it on the review card. */
export function guessCategory(name = "") {
  const n = name.toLowerCase();
  const hit = CATEGORY_KEYWORDS.find(([, words]) => words.some((w) => n.includes(w)));
  return hit ? hit[0] : "";
}

function spreadTimes(n) {
  const table = { 1: ["08:00"], 2: ["08:00", "20:00"], 3: ["08:00", "14:00", "20:00"], 4: ["08:00", "12:00", "16:00", "20:00"] };
  if (table[n]) return table[n];
  return Array.from({ length: n }, (_, i) => {
    const h = 6 + Math.round((i * 16) / (n - 1));
    return `${String(h).padStart(2, "0")}:00`;
  });
}

/** Reminder clock times for one medicine ([] for "as needed"). */
export function reminderTimesFor(med) {
  if (med.as_needed || !med.doses_per_day) return [];
  const n = Math.max(1, Math.round(med.doses_per_day));
  const fromSlots = [...new Set((med.times_of_day || []).map((s) => DEFAULT_TIMES[s]).filter(Boolean))].sort();
  return fromSlots.length === n ? fromSlots : spreadTimes(n);
}

/** Scan result -> editable review cards. */
export function prepareCards(medicines = []) {
  return medicines.map((m, i) => ({
    ...m,
    id: `${i}-${m.name}`,
    include: true,
    times: reminderTimesFor(m),
    disease_category: guessCategory(m.name),
  }));
}

export function dosageText(med) {
  const units = Number(med.units_per_dose) || 1;
  const strength = (med.strength || "").trim();
  const unitWord = med.form === "cap" ? "capsule" : med.form === "tab" || !med.form ? "tablet" : med.form;
  if (!strength) return `${units} ${unitWord}${units === 1 ? "" : "s"} per dose`;
  return units === 1 ? strength : `${strength} (${units} ${unitWord}s per dose)`;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Human-readable problems that must be fixed before this card can be saved. */
export function validateCard(card) {
  const errors = [];
  if (!card.name || card.name.trim().length < 2) errors.push("Medicine name is required.");
  if (!card.as_needed && (!card.times || card.times.length === 0)) errors.push("Add at least one reminder time.");
  if ((card.times || []).some((t) => !TIME_RE.test(t))) errors.push("Reminder times must be HH:MM.");
  if (card.quantity !== null && card.quantity !== "" && card.quantity !== undefined && Number(card.quantity) < 0) {
    errors.push("Quantity cannot be negative.");
  }
  if (!(Number(card.units_per_dose) > 0)) errors.push("Units per dose must be more than 0.");
  return errors;
}

/** One reviewed card -> one row for the Supabase `medications` table. */
export function cardToRow(card, patientId) {
  const times = card.as_needed ? [] : [...card.times].sort();
  const qty = card.quantity === "" || card.quantity === null || card.quantity === undefined ? null : Math.round(Number(card.quantity));
  return {
    patient_id: patientId,
    name: card.name.trim(),
    dosage: dosageText(card),
    frequency_per_day: card.as_needed ? 0 : times.length,
    reminder_times: times,
    disease_category: card.disease_category || null,
    quantity_on_hand: qty,
    units_per_dose: Number(card.units_per_dose) || 1,
    duration_days: card.duration_days ?? null,
    food_instruction: card.food_instruction || null,
    notes: card.as_needed ? "As needed (SOS)" : null,
    source: "ocr",
    active: true,
  };
}