import crypto from "node:crypto";

type Kind = "product_image" | "avatar";

function folderFor(kind: Kind, entityId: string) {
  const root = process.env.CLOUDINARY_ROOT_FOLDER;
  if (!root) {
    throw new Error("CLOUDINARY_ROOT_FOLDER environment variable is required");
  }
  return kind === "avatar"
    ? `${root}/avatars/${entityId}`
    : `${root}/products/${entityId}`;
}

function presetFor(kind: Kind) {
  const avatarPreset = process.env.CLOUDINARY_UPLOAD_PRESET_AVATARS;
  const productPreset = process.env.CLOUDINARY_UPLOAD_PRESET_PRODUCTS;

  if (kind === "avatar") {
    if (!avatarPreset) {
      throw new Error(
        "CLOUDINARY_UPLOAD_PRESET_AVATARS environment variable is required"
      );
    }
    return avatarPreset;
  } else {
    if (!productPreset) {
      throw new Error(
        "CLOUDINARY_UPLOAD_PRESET_PRODUCTS environment variable is required"
      );
    }
    return productPreset;
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
  resourceType: "image",
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
