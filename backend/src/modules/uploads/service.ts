import crypto from "node:crypto";

type Kind = "product_image" | "avatar" | "admin_profile" | "business_logo" | "support_file" | "category_image" | "application_doc";

function folderFor(kind: Kind, entityId: string) {
  const root = process.env.CLOUDINARY_ROOT_FOLDER;
  if (!root) {
    throw new Error("CLOUDINARY_ROOT_FOLDER environment variable is required");
  }
  
  switch (kind) {
    case "avatar":
      return `${root}/avatars/${entityId}`;
    case "product_image":
      return `${root}/products/${entityId}`;
    case "admin_profile":
      return `${root}/admin/profiles/${entityId}`;
    case "business_logo":
      return `${root}/admin/business/${entityId}`;
    case "support_file":
      return `${root}/support/${entityId}`;
    case "category_image":
      return `${root}/categories/${entityId}`;
    case "application_doc":
      return `${root}/applications/${entityId}`;
    default:
      throw new Error(`Unknown upload kind: ${kind}`);
  }
}

function presetFor(kind: Kind) {
  const avatarPreset = process.env.CLOUDINARY_UPLOAD_PRESET_AVATARS;
  const productPreset = process.env.CLOUDINARY_UPLOAD_PRESET_PRODUCTS;
  const adminPreset = process.env.CLOUDINARY_UPLOAD_PRESET_ADMIN || productPreset;
  const supportPreset = process.env.CLOUDINARY_UPLOAD_PRESET_SUPPORT || productPreset;
  const categoryPreset = process.env.CLOUDINARY_UPLOAD_PRESET_CATEGORIES || productPreset;
  const applicationPreset = process.env.CLOUDINARY_UPLOAD_PRESET_APPLICATIONS || productPreset;

  switch (kind) {
    case "avatar":
      if (!avatarPreset) {
        throw new Error(
          "CLOUDINARY_UPLOAD_PRESET_AVATARS environment variable is required"
        );
      }
      return avatarPreset;
    case "product_image":
      if (!productPreset) {
        throw new Error(
          "CLOUDINARY_UPLOAD_PRESET_PRODUCTS environment variable is required"
        );
      }
      return productPreset;
    case "admin_profile":
    case "business_logo":
      return adminPreset;
    case "support_file":
      return supportPreset;
    case "category_image":
      return categoryPreset;
    case "application_doc":
      return applicationPreset;
    default:
      throw new Error(`Unknown upload kind: ${kind}`);
  }
}

export function buildSignatureParams(params: Record<string, string | number>) {
  const entries = Object.entries(params)
    .filter(([k, v]) => v !== undefined && v !== "" && k !== "file")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    throw new Error("CLOUDINARY_API_SECRET environment variable is required");
  }
  const hash = crypto
    .createHash("sha1")
    .update(entries + secret)
    .digest("hex");
  return hash;
}

export function signUpload(
  kind: Kind,
  entityId: string,
  resourceType: "image" | "raw" = "image",
  publicIdHint?: string
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = folderFor(kind, entityId);
  const uploadPreset = presetFor(kind);

  const public_id = publicIdHint ? `${folder}/${publicIdHint}` : undefined;

  const toSign: Record<string, string | number> = {
    folder,
    timestamp,
    upload_preset: uploadPreset,
    ...(public_id ? { public_id } : {}),
  };

  const signature = buildSignatureParams(toSign);

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;

  if (!cloudName) {
    throw new Error("CLOUDINARY_CLOUD_NAME environment variable is required");
  }
  if (!apiKey) {
    throw new Error("CLOUDINARY_API_KEY environment variable is required");
  }

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    uploadPreset,
    resourceType,
    ...(public_id ? { publicId: public_id } : {}),
  };
}
