import type { Request, Response } from "express";
import { SignBody, ConfirmBody } from "./schemas.js";
import { signUpload } from "./service.js";
import { AppDataSource } from "../../config/database.js";
import { Product } from "../../entities/Product.js";
import { ProductImage } from "../../entities/ProductImage.js";
import { User } from "../../entities/User.js";
import { cloudinary } from "../../config/cloudinary.js";

export async function sign(req: Request, res: Response) {
  const parsed = SignBody.parse(req.body);
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  if (parsed.kind === "avatar") {
    if (
      req.user.id !== parsed.entityId &&
      !req.user.isStaff &&
      !req.user.isSuperuser
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
  } else if (parsed.kind === "product_image") {
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: parsed.entityId, deleted: false },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (
      product.userId !== req.user.id &&
      !req.user.isStaff &&
      !req.user.isSuperuser
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }
  const payload = signUpload(
    parsed.kind,
    parsed.entityId,
    parsed.resourceType,
    parsed.publicIdHint
  );
  return res.json(payload);
}

export async function confirm(req: Request, res: Response) {
  const parsed = ConfirmBody.parse(req.body);
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

  if (parsed.kind === "avatar") {
    if (
      req.user.id !== parsed.entityId &&
      !req.user.isStaff &&
      !req.user.isSuperuser
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: parsed.entityId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    user.avatarPublicId = parsed.public_id;
    user.avatarUrl = parsed.secure_url;
    user.avatarFormat = parsed.format;
    user.avatarBytes = parsed.bytes;
    user.avatarWidth = parsed.width;
    user.avatarHeight = parsed.height;
    await userRepo.save(user);
  } else if (parsed.kind === "product_image") {
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: parsed.entityId, deleted: false },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (
      product.userId !== req.user.id &&
      !req.user.isStaff &&
      !req.user.isSuperuser
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const imageRepo = AppDataSource.getRepository(ProductImage);
    const image = imageRepo.create({
      productId: parsed.entityId,
      cdnPublicId: parsed.public_id,
      cdnUrl: parsed.secure_url,
      cdnResourceType: parsed.resource_type,
      cdnFormat: parsed.format,
      cdnBytes: parsed.bytes,
      cdnWidth: parsed.width,
      cdnHeight: parsed.height,
    });
    await imageRepo.save(image);
  }

  return res.json({
    publicId: parsed.public_id,
    url: parsed.secure_url,
    width: parsed.width ?? null,
    height: parsed.height ?? null,
    bytes: parsed.bytes,
    format: parsed.format,
  });
}

export async function destroy(req: Request, res: Response) {
  const wildcard = (req.params as unknown as Record<string, string>)[0];
  const { publicId: publicIdParam } = req.params as { publicId?: string };
  const publicId = publicIdParam || wildcard;
  const { kind, entityId } = (req.body ?? {}) as {
    kind: "product_image" | "avatar";
    entityId: string;
  };
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  if (!publicId || !kind || !entityId)
    return res.status(400).json({ error: "Missing parameters" });

  if (kind === "avatar") {
    if (
      req.user.id !== entityId &&
      !req.user.isStaff &&
      !req.user.isSuperuser
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: entityId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.avatarPublicId !== publicId)
      return res.status(404).json({ error: "Media not found" });
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    user.avatarPublicId = null as unknown as undefined;
    user.avatarUrl = null as unknown as undefined;
    user.avatarFormat = null as unknown as undefined;
    user.avatarBytes = null as unknown as undefined;
    user.avatarWidth = null as unknown as undefined;
    user.avatarHeight = null as unknown as undefined;
    await userRepo.save(user);
  } else if (kind === "product_image") {
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: entityId, deleted: false },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (
      product.userId !== req.user.id &&
      !req.user.isStaff &&
      !req.user.isSuperuser
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const imageRepo = AppDataSource.getRepository(ProductImage);
    const image = await imageRepo.findOne({
      where: { cdnPublicId: publicId, productId: entityId },
    });
    if (!image) return res.status(404).json({ error: "Media not found" });
    await cloudinary.uploader.destroy(publicId, {
      resource_type: image.cdnResourceType as "image",
    });
    await imageRepo.remove(image);
  }

  return res.status(204).end();
}
