import { supabase } from "../../lib/supabaseClient";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dhc3fnbl2";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || "assets";

export async function uploadPrescriptionImage(patientId, file) {
  if (!UPLOAD_PRESET) {
    return { error: new Error("Cloudinary upload preset is missing. Set VITE_CLOUDINARY_UPLOAD_PRESET in frontend/.env.") };
  }
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", UPLOAD_PRESET);
  body.append("folder", FOLDER);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body,
  });
  const result = await response.json();
  if (!response.ok) return { error: new Error(result.error?.message || "Cloudinary upload failed.") };

  const { data, error } = await supabase
    .from("prescriptions")
    .insert({
    patient_id: patientId,
    image_url: result.secure_url,
    cloudinary_public_id: result.public_id,
    original_filename: file.name,
    mime_type: file.type,
    file_size: file.size,
    status: "uploaded",
    })
    .select()
    .single();
  if (error) return { data, error };

  const { data: links, error: linksError } = await supabase
    .from("caregiver_links")
    .select("caregiver_id")
    .eq("patient_id", patientId)
    .eq("status", "accepted");
  if (linksError) return { data, error: linksError };

  if (links?.length) {
    const { error: messageError } = await supabase.from("notifications").insert(
      links.map((link) => ({
        recipient_id: link.caregiver_id,
        patient_id: patientId,
        sender_id: patientId,
        title: "New prescription uploaded",
        body: `${file.name} is ready to review.`,
        image_url: result.secure_url,
      }))
    );
    if (messageError) return { data, error: messageError };
  }

  return { data, error: null };
}

export async function listPrescriptions(patientId) {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}