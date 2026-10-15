import { supabase } from "../../lib/supabaseClient";
import { uploadCloudinaryImage } from "../../lib/cloudinary";

export async function uploadPrescriptionImage(patientId, file) {
  const { data: uploadedImage, error: uploadError } = await uploadCloudinaryImage(file);
  if (uploadError) return { error: uploadError };

  const { data, error } = await supabase
    .from("prescriptions")
    .insert({
      patient_id: patientId,
      image_url: uploadedImage.secureUrl,
      cloudinary_public_id: uploadedImage.publicId,
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
        image_url: uploadedImage.secureUrl,
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
