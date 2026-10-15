const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dhc3fnbl2";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || "assets";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

export async function uploadCloudinaryImage(file) {
  if (!file?.type?.startsWith("image/")) {
    return { data: null, error: new Error("Choose a valid image file.") };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { data: null, error: new Error("Images must be 8 MB or smaller.") };
  }
  if (!UPLOAD_PRESET) {
    return {
      data: null,
      error: new Error("Cloudinary upload preset is missing from the frontend environment."),
    };
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", UPLOAD_PRESET);
  body.append("folder", FOLDER);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body,
    });
    const result = await response.json();
    if (!response.ok) {
      return {
        data: null,
        error: new Error(result.error?.message || "Cloudinary upload failed."),
      };
    }
    return {
      data: { secureUrl: result.secure_url, publicId: result.public_id },
      error: null,
    };
  } catch {
    return { data: null, error: new Error("Could not reach Cloudinary. Check your connection.") };
  }
}