import { z } from "zod";

export const SignBody = z.object({
  kind: z.enum(["product_image", "avatar"]),
  entityId: z.string().uuid(),
  resourceType: z.enum(["image"]).default("image"),
  publicIdHint: z.string().max(64).optional(),
});

export const ConfirmBody = z.object({
  kind: z.enum(["product_image", "avatar"]),
  entityId: z.string().uuid(),
  public_id: z.string().min(1),
  secure_url: z.string().url(),
  resource_type: z.enum(["image"]),
  format: z.string().min(1),
  bytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  context: z.record(z.string()).optional(),
});
