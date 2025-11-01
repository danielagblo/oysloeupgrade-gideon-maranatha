import type { Request, Response } from "express";
import { SignBody, ConfirmBody } from "./schemas.js";
import { signUpload } from "./service.js";
import { AppDataSource } from "../../config/database.js";
import { Product } from "../../entities/Product.js";
import { ProductImage } from "../../entities/ProductImage.js";
import { User } from "../../entities/User.js";
import { AdminUser } from "../../entities/AdminUser.js";
import { Category } from "../../entities/Category.js";
import { SupportMessage } from "../../entities/SupportMessage.js";
import { ApplicationDocument } from "../../entities/ApplicationDocument.js";
import { cloudinary } from "../../config/cloudinary.js";

export async function sign(req: Request, res: Response) {
  const parsed = SignBody.parse(req.body);
  
  // Admin upload types require admin authentication
  const adminUploadTypes = ["admin_profile", "business_logo", "support_file", "category_image", "application_doc"];
  if (adminUploadTypes.includes(parsed.kind)) {
    if (!req.admin?.id) return res.status(401).json({ error: "Unauthorized - Admin access required" });
    // Admin can upload for any entity
  } else {
    // Regular user uploads
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
  }
  
  const payload = signUpload(
    parsed.kind,
    parsed.entityId,
    parsed.resourceType as "image",
    parsed.publicIdHint
  );
  return res.json(payload);
}

export async function confirm(req: Request, res: Response) {
  const parsed = ConfirmBody.parse(req.body);
  
  // Admin upload types require admin authentication
  const adminUploadTypes = ["admin_profile", "business_logo", "support_file", "category_image", "application_doc"];
  const isAdminUpload = adminUploadTypes.includes(parsed.kind);
  
  if (isAdminUpload) {
    if (!req.admin?.id) return res.status(401).json({ error: "Unauthorized - Admin access required" });
  } else {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  }

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
  } else if (parsed.kind === "admin_profile") {
    const adminUserRepo = AppDataSource.getRepository(AdminUser);
    const adminUser = await adminUserRepo.findOne({ where: { id: parseInt(parsed.entityId) } });
    if (!adminUser) return res.status(404).json({ error: "Admin user not found" });
    adminUser.profileImageUrl = parsed.secure_url;
    await adminUserRepo.save(adminUser);
  } else if (parsed.kind === "business_logo") {
    const adminUserRepo = AppDataSource.getRepository(AdminUser);
    const adminUser = await adminUserRepo.findOne({ where: { id: parseInt(parsed.entityId) } });
    if (!adminUser) return res.status(404).json({ error: "Admin user not found" });
    adminUser.businessLogoUrl = parsed.secure_url;
    await adminUserRepo.save(adminUser);
  } else if (parsed.kind === "category_image") {
    const categoryRepo = AppDataSource.getRepository(Category);
    const category = await categoryRepo.findOne({ where: { id: parsed.entityId } });
    if (!category) return res.status(404).json({ error: "Category not found" });
    category.iconUrl = parsed.secure_url;
    await categoryRepo.save(category);
  } else if (parsed.kind === "support_file") {
    // For support files, entityId should be the caseId (as string representation of number)
    const caseId = parseInt(parsed.entityId);
    if (isNaN(caseId)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid case ID",
        error: { code: "INVALID_CASE_ID" }
      });
    }
    
    // Verify the case exists
    const supportCaseRepo = AppDataSource.getRepository(SupportCase);
    const supportCase = await supportCaseRepo.findOne({ where: { id: caseId } });
    if (!supportCase) {
      return res.status(404).json({ 
        success: false,
        message: "Support case not found",
        error: { code: "SUPPORT_CASE_NOT_FOUND" }
      });
    }
    
    // Verify the admin has access to this case (simplified check)
    // In production, you might want to verify the admin is assigned to this case
    
    const supportMessageRepo = AppDataSource.getRepository(SupportMessage);
    // Extract filename from secure_url or use a default
    const fileName = parsed.context?.filename || `support_file_${Date.now()}.${parsed.format}`;
    
    const supportMessage = supportMessageRepo.create({
      caseId,
      senderId: req.admin!.id.toString(),
      senderType: "admin",
      messageType: "file",
      fileUrl: parsed.secure_url,
      fileName,
      fileSize: parsed.bytes,
      content: parsed.context?.description || null,
    });
    
    await supportMessageRepo.save(supportMessage);
    
    // Update lastMessageAt on the support case
    supportCase.lastMessageAt = new Date();
    await supportCaseRepo.save(supportCase);
  } else if (parsed.kind === "application_doc") {
    // For application docs, entityId should be the applicationId (as string representation of number)
    const applicationId = parseInt(parsed.entityId);
    if (isNaN(applicationId)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid application ID",
        error: { code: "INVALID_APPLICATION_ID" }
      });
    }
    
    // Verify the application exists
    const jobApplicationRepo = AppDataSource.getRepository(JobApplication);
    const jobApplication = await jobApplicationRepo.findOne({ where: { id: applicationId } });
    if (!jobApplication) {
      return res.status(404).json({ 
        success: false,
        message: "Job application not found",
        error: { code: "JOB_APPLICATION_NOT_FOUND" }
      });
    }
    
    const applicationDocRepo = AppDataSource.getRepository(ApplicationDocument);
    // Extract document type from context or default to "other"
    const documentType = (parsed.context?.documentType as ApplicationDocument["documentType"]) || "other";
    const fileName = parsed.context?.filename || `application_doc_${Date.now()}.${parsed.format}`;
    
    const applicationDoc = applicationDocRepo.create({
      applicationId,
      documentType,
      fileUrl: parsed.secure_url,
      fileName,
      fileSize: parsed.bytes,
      mimeType: parsed.context?.mimeType || `${parsed.resource_type}/${parsed.format}`,
    });
    
    await applicationDocRepo.save(applicationDoc);
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
  } else if (kind === "admin_profile" || kind === "business_logo") {
    const adminUserRepo = AppDataSource.getRepository(AdminUser);
    const adminUser = await adminUserRepo.findOne({ where: { id: parseInt(entityId) } });
    if (!adminUser) return res.status(404).json({ error: "Admin user not found" });
    
    if (kind === "admin_profile" && adminUser.profileImageUrl?.includes(publicId)) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      adminUser.profileImageUrl = undefined;
      await adminUserRepo.save(adminUser);
    } else if (kind === "business_logo" && adminUser.businessLogoUrl?.includes(publicId)) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      adminUser.businessLogoUrl = undefined;
      await adminUserRepo.save(adminUser);
    }
  } else if (kind === "category_image") {
    const categoryRepo = AppDataSource.getRepository(Category);
    const category = await categoryRepo.findOne({ where: { id: entityId } });
    if (!category) return res.status(404).json({ error: "Category not found" });
    if (category.iconUrl?.includes(publicId)) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      category.iconUrl = undefined;
      await categoryRepo.save(category);
    }
  }

  return res.status(204).end();
}
