import type { NextFunction, Request, Response } from "express";
import { cloudinary } from "../config/cloudinary.js";
import { AppDataSource } from "../config/database.js";
import { AdModerationHistory } from "../entities/AdModerationHistory.js";
import { Product } from "../entities/Product.js";
import { ProductImage } from "../entities/ProductImage.js";
import { NotFoundError } from "../utils/errors.js";

export const getAds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      category,
      sellerId,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const productRepository = AppDataSource.getRepository(Product);
    const queryBuilder = productRepository
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.user", "u")
      .leftJoinAndSelect("p.category", "c")
      .where("p.deleted = :deleted", { deleted: false });

    if (status) {
      queryBuilder.andWhere("p.moderationStatus = :status", { status });
    }

    if (search) {
      queryBuilder.andWhere(
        "(p.name ILIKE :search OR p.description ILIKE :search OR u.name ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere("p.categoryId = :category", { category });
    }

    if (sellerId) {
      queryBuilder.andWhere("p.userId = :sellerId", { sellerId });
    }

    if (dateFrom) {
      queryBuilder.andWhere("p.createdAt >= :dateFrom", { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere("p.createdAt <= :dateTo", { dateTo });
    }

    const order = sortOrder === "asc" ? "ASC" : "DESC";
    queryBuilder.orderBy(`p.${sortBy}`, order);

    const offset = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(offset).take(Number(limit));

    const [ads, total] = await queryBuilder.getManyAndCount();

    const statusFilters = await productRepository
      .createQueryBuilder("p")
      .select("p.moderationStatus", "status")
      .addSelect("COUNT(*)", "count")
      .where("p.deleted = :deleted", { deleted: false })
      .groupBy("p.moderationStatus")
      .getRawMany();

    const categoryFilters = await productRepository
      .createQueryBuilder("p")
      .leftJoin("p.category", "c")
      .select("c.id", "id")
      .addSelect("c.name", "name")
      .addSelect("COUNT(*)", "count")
      .where("p.deleted = :deleted", { deleted: false })
      .groupBy("c.id")
      .addGroupBy("c.name")
      .getRawMany();

    res.json({
      success: true,
      data: {
        ads,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
          hasNext: offset + Number(limit) < total,
          hasPrev: Number(page) > 1,
        },
        filters: {
          status: statusFilters.map((f) => ({
            value: f.status,
            count: parseInt(f.count, 10),
          })),
          categories: categoryFilters.map((f) => ({
            id: f.id,
            name: f.name,
            count: parseInt(f.count, 10),
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, reason, notes } = req.body;
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const adminId = req.admin.id;

    const productRepository = AppDataSource.getRepository(Product);
    const product = await productRepository.findOne({
      where: { id, deleted: false },
      relations: ["user"],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
        error: { code: "AD_NOT_FOUND" },
      });
    }

    req.oldValues = {
      moderationStatus: product.moderationStatus,
      moderatedBy: product.moderatedBy,
      moderatedAt: product.moderatedAt,
    };

    const oldStatus = product.moderationStatus;
    product.moderationStatus = status;
    product.moderatedBy = adminId;
    product.moderatedAt = new Date();

    if (status === "suspended" && reason) {
      product.suspensionReason = reason;
    } else if (status === "rejected" && reason) {
      product.rejectionReason = reason;
    } else if (status === "active") {
      product.approvedBy = adminId;
      product.approvedAt = new Date();
    }

    if (notes) {
      product.adminNotes = product.adminNotes
        ? `${
            product.adminNotes
          }\n[${new Date().toISOString()}] Status changed to ${status}: ${notes}`
        : `[${new Date().toISOString()}] Status changed to ${status}: ${notes}`;
    }

    await productRepository.save(product);

    const moderationHistory = await AppDataSource.getRepository(
      AdModerationHistory
    ).save({
      adId: product.id,
      adminUserId: adminId,
      action:
        status === "active"
          ? "approve"
          : status === "suspended"
          ? "suspend"
          : status === "rejected"
          ? "reject"
          : "moderate",
      reason,
      oldStatus,
      newStatus: status,
    });

    req.newValues = {
      moderationStatus: product.moderationStatus,
      moderatedBy: product.moderatedBy,
      moderatedAt: product.moderatedAt,
    };

    res.json({
      success: true,
      data: {
        ad: product,
        moderationHistory,
      },
      message: `Ad ${status} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateAds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { adIds, status, reason, notes } = req.body;
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const adminId = req.admin.id;

    const productRepository = AppDataSource.getRepository(Product);
    const moderationHistoryRepository =
      AppDataSource.getRepository(AdModerationHistory);

    const results = [];
    let updated = 0;
    let failed = 0;

    for (const adId of adIds) {
      try {
        const product = await productRepository.findOne({
          where: { id: adId, deleted: false },
        });

        if (!product) {
          results.push({ adId, success: false, error: "Ad not found" });
          failed++;
          continue;
        }

        const oldStatus = product.moderationStatus;
        product.moderationStatus = status;
        product.moderatedBy = adminId;
        product.moderatedAt = new Date();

        if (status === "suspended" && reason) {
          product.suspensionReason = reason;
        } else if (status === "rejected" && reason) {
          product.rejectionReason = reason;
        } else if (status === "active") {
          product.approvedBy = adminId;
          product.approvedAt = new Date();
        }

        if (notes) {
          product.adminNotes = product.adminNotes
            ? `${
                product.adminNotes
              }\n[${new Date().toISOString()}] Bulk status change to ${status}: ${notes}`
            : `[${new Date().toISOString()}] Bulk status change to ${status}: ${notes}`;
        }

        await productRepository.save(product);

        await moderationHistoryRepository.save({
          adId: product.id,
          adminUserId: adminId,
          action:
            status === "active"
              ? "approve"
              : status === "suspended"
              ? "suspend"
              : status === "rejected"
              ? "reject"
              : "moderate",
          reason,
          oldStatus,
          newStatus: status,
        });

        results.push({ adId, success: true });
        updated++;
      } catch (error) {
        results.push({ adId, success: false, error: (error as Error).message });
        failed++;
      }
    }

    res.json({
      success: true,
      data: {
        updated,
        failed,
        results,
      },
      message: `Bulk update completed: ${updated} updated, ${failed} failed`,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, imageId } = req.params;
    const { reason: _reason } = req.body;
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const _adminId = req.admin.id;

    const productRepository = AppDataSource.getRepository(Product);
    const productImageRepository = AppDataSource.getRepository(ProductImage);

    const product = await productRepository.findOne({
      where: { id, deleted: false },
    });

    if (!product) {
      throw new NotFoundError("Ad not found");
    }

    const image = await productImageRepository.findOne({
      where: { id: imageId, productId: id },
    });

    if (!image) {
      throw new NotFoundError("Image not found");
    }

    try {
      const publicId = image.publicId;
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error("Failed to delete image from Cloudinary:", error);
    }

    await productImageRepository.remove(image);

    if (_reason) {
      product.adminNotes = product.adminNotes
        ? `${
            product.adminNotes
          }\n[${new Date().toISOString()}] Image deleted (${imageId}): ${_reason}`
        : `[${new Date().toISOString()}] Image deleted (${imageId}): ${_reason}`;
      await productRepository.save(product);
    }

    res.json({
      success: true,
      data: {
        ad: product,
        deletedImageUrl: image.url,
      },
      message: "Image deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAdsStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const productRepository = AppDataSource.getRepository(Product);

    const total = await productRepository.count({ where: { deleted: false } });
    const active = await productRepository.count({
      where: { moderationStatus: "active", deleted: false },
    });
    const pending = await productRepository.count({
      where: { moderationStatus: "pending", deleted: false },
    });
    const suspended = await productRepository.count({
      where: { moderationStatus: "suspended", deleted: false },
    });
    const rejected = await productRepository.count({
      where: { moderationStatus: "rejected", deleted: false },
    });

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayPosted = await productRepository
      .createQueryBuilder("p")
      .where("p.createdAt >= :dayAgo", { dayAgo })
      .andWhere("p.deleted = :deleted", { deleted: false })
      .getCount();

    const weekPosted = await productRepository
      .createQueryBuilder("p")
      .where("p.createdAt >= :weekAgo", { weekAgo })
      .andWhere("p.deleted = :deleted", { deleted: false })
      .getCount();

    const monthPosted = await productRepository
      .createQueryBuilder("p")
      .where("p.createdAt >= :monthAgo", { monthAgo })
      .andWhere("p.deleted = :deleted", { deleted: false })
      .getCount();

    const topCategories = await productRepository
      .createQueryBuilder("p")
      .leftJoin("p.category", "c")
      .select("c.name", "category")
      .addSelect("COUNT(*)", "count")
      .where("p.deleted = :deleted", { deleted: false })
      .andWhere("p.moderationStatus = :status", { status: "active" })
      .groupBy("c.name")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    const topSellers = await productRepository
      .createQueryBuilder("p")
      .leftJoin("p.user", "u")
      .select("u.id", "sellerId")
      .addSelect("u.name", "sellerName")
      .addSelect("COUNT(*)", "adcount")
      .where("p.deleted = :deleted", { deleted: false })
      .andWhere("p.moderationStatus = :status", { status: "active" })
      .groupBy("u.id")
      .addGroupBy("u.name")
      .orderBy("adcount", "DESC")
      .limit(10)
      .getRawMany();

    const avgResponseTime = 0;
    const pendingCount = pending;
    const resolvedToday = await AppDataSource.getRepository(AdModerationHistory)
      .createQueryBuilder("amh")
      .where("amh.createdAt >= :dayAgo", { dayAgo })
      .getCount();

    res.json({
      success: true,
      data: {
        total,
        active,
        pending,
        suspended,
        rejected,
        todayPosted,
        weekPosted,
        monthPosted,
        byCategory: topCategories.reduce((acc, curr) => {
          acc[curr.category] = parseInt(curr.count, 10);
          return acc;
        }, {} as Record<string, number>),
        topSellers: topSellers.map((s) => ({
          sellerId: s.sellerId,
          sellerName: s.sellerName,
          adCount: parseInt(s.adCount, 10),
        })),
        moderation: {
          avgResponseTime,
          pendingCount,
          resolvedToday,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
