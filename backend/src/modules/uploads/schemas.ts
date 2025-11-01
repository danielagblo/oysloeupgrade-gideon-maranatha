import { z } from "zod";

export const SignBody = z.object({
  kind: z.enum(["product_image", "avatar", "admin_profile", "business_logo", "support_file", "category_image", "application_doc"]),
  entityId: z.string().uuid(),
  resourceType: z.enum(["image", "raw"]).default("image"),
  publicIdHint: z.string().max(64).optional(),
});

export const ConfirmBody = z.object({
  kind: z.enum(["product_image", "avatar", "admin_profile", "business_logo", "support_file", "category_image", "application_doc"]),
  entityId: z.string().uuid(),
  public_id: z.string().min(1),
  secure_url: z.string().url(),
  resource_type: z.enum(["image", "raw"]),
  format: z.string().min(1),
  bytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  context: z.record(z.string()).optional(),
});
