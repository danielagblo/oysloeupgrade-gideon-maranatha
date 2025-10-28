import { cloudinary } from "../../config/cloudinary.js";
import crypto from "node:crypto";

type Kind = "product_image" | "avatar";

function folderFor(kind: Kind, entityId: string) {
  const root = process.env.CLOUDINARY_ROOT_FOLDER!;
  return kind === "avatar"
    ? `${root}/avatars/${entityId}`
    : `${root}/products/${entityId}`;
}

function presetFor(kind: Kind) {
  return kind === "avatar"
    ? process.env.CLOUDINARY_UPLOAD_PRESET_AVATARS!
    : process.env.CLOUDINARY_UPLOAD_PRESET_PRODUCTS!;
}

export function buildSignatureParams(params: Record<string, string | number>) {
  const entries = Object.entries(params)
    .filter(([k, v]) => v !== undefined && v !== "" && k !== "file")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const secret = process.env.CLOUDINARY_API_SECRET!;
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

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    signature,
    folder,
    uploadPreset,
    resourceType,
    ...(public_id ? { publicId: public_id } : {}),
  };
}
