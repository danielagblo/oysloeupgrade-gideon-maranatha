import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppDataSource } from "../config/database.js";
import { User } from "../entities/User.js";
import { AdminAuditLog } from "../entities/AdminAuditLog.js";
import { AdminExportService } from "../services/admin-export.service.js";
import { ExportUsersSchema } from "../schemas/admin.js";

type ExportUsersRequest = z.infer<typeof ExportUsersSchema>;

const adminExportService = new AdminExportService();

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      level,
      role,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const userRepository = AppDataSource.getRepository(User);
    const queryBuilder = userRepository
      .createQueryBuilder("u")
      .leftJoinAndSelect("u.wallet", "w")
      .where("u.deleted = :deleted", { deleted: false });

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        "(u.email ILIKE :search OR u.name ILIKE :search OR u.phone ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere("u.verificationStatus = :status", { status });
    }

    if (level) {
      queryBuilder.andWhere("u.level = :level", { level });
    }

    if (role) {
      queryBuilder.andWhere("u.level = :role", { role });
    }

    // Sorting
    const order = sortOrder === "asc" ? "ASC" : "DESC";
    queryBuilder.orderBy(`u.${sortBy}`, order);

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(offset).take(Number(limit));

    const [users, total] = await queryBuilder.getManyAndCount();

    // Get filter options
    const statusFilters = await userRepository
      .createQueryBuilder("u")
      .select("u.verificationStatus", "status")
      .addSelect("COUNT(*)", "count")
      .where("u.deleted = :deleted", { deleted: false })
      .groupBy("u.verificationStatus")
      .getRawMany();

    const levelFilters = await userRepository
      .createQueryBuilder("u")
      .select("u.level", "level")
      .addSelect("COUNT(*)", "count")
      .where("u.deleted = :deleted", { deleted: false })
      .groupBy("u.level")
      .getRawMany();

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
          hasNext: offset + Number(limit) < total,
          hasPrev: Number(page) > 1,
        },
        filters: {
          status: statusFilters.map((f: { status: string; count: string }) => ({
            value: f.status,
            count: parseInt(f.count, 10),
          })),
          level: levelFilters.map((f: { level: string; count: string }) => ({
            value: f.level,
            count: parseInt(f.count, 10),
          })),
          role: levelFilters.map((f: { level: string; count: string }) => ({
            value: f.level,
            count: parseInt(f.count, 10),
          })), // Same as level for now
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id: id!, deleted: false },
      relations: ["wallet", "products", "reviews"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: { code: "USER_NOT_FOUND" },
      });
    }

    // Get verification history, moderation history, activity stats
    const verificationHistory = await AppDataSource.getRepository(
      AdminAuditLog
    ).find({
      where: {
        resourceType: "user",
        resourceId: id ? parseInt(id!, 10) : undefined,
        action: "verify_user",
      },
      relations: ["adminUser"],
      order: { createdAt: "DESC" },
      take: 10,
    });

    // Activity stats
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activityStats = {
      productsCount: user.products?.length || 0,
      reviewsCount: user.reviews?.length || 0,
      walletBalance: user.wallet?.balance || 0,
      joinedAt: user.createdAt,
      lastLogin: user.lastLogin,
      isActiveToday:
        user.lastLogin &&
        user.lastLogin >= new Date(now.getTime() - 24 * 60 * 60 * 1000),
      isActiveWeek: user.lastLogin && user.lastLogin >= weekAgo,
      isActiveMonth: user.lastLogin && user.lastLogin >= monthAgo,
    };

    res.json({
      success: true,
      data: {
        user,
        adminNotes: user.adminNotes,
        verificationHistory,
        moderationHistory: [], // TODO: implement
        activityStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const adminId = req.admin.id!;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: id!, deleted: false },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: { code: "USER_NOT_FOUND" },
      });
    }

    // Store old values for audit
    req.oldValues = {
      verificationStatus: user.verificationStatus,
      verifiedBy: user.verifiedBy,
      verifiedAt: user.verifiedAt,
    };

    // Update user
    user.verificationStatus = status;
    user.verifiedBy = adminId;
    user.verifiedAt = new Date();

    if (notes) {
      user.adminNotes = user.adminNotes
        ? `${
            user.adminNotes
          }\n[${new Date().toISOString()}] Verification ${status}: ${notes}`
        : `[${new Date().toISOString()}] Verification ${status}: ${notes}`;
    }

    await userRepository.save(user);

    // Audit log
    req.newValues = {
      verificationStatus: user.verificationStatus,
      verifiedBy: user.verifiedBy,
      verifiedAt: user.verifiedAt,
    };

    res.json({
      success: true,
      data: { user },
      message: `User ${status} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserLevel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { level, notes } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: id!, deleted: false },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: { code: "USER_NOT_FOUND" },
      });
    }

    // Store old values for audit
    req.oldValues = { level: user.level };

    // Update user
    user.level = level;

    if (notes) {
      user.adminNotes = user.adminNotes
        ? `${
            user.adminNotes
          }\n[${new Date().toISOString()}] Level changed to ${level}: ${notes}`
        : `[${new Date().toISOString()}] Level changed to ${level}: ${notes}`;
    }

    await userRepository.save(user);

    // Audit log
    req.newValues = { level: user.level };

    res.json({
      success: true,
      data: { user },
      message: `User level updated to ${level}`,
    });
  } catch (error) {
    next(error);
  }
};

export const muteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { action, reason, duration } = req.body;
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const adminId = req.admin.id!;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: id!, deleted: false },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: { code: "USER_NOT_FOUND" },
      });
    }

    // Store old values for audit
    req.oldValues = {
      isMuted: user.isMuted,
      mutedBy: user.mutedBy,
      mutedAt: user.mutedAt,
      muteReason: user.muteReason,
    };

    if (action === "mute") {
      user.isMuted = true;
      user.mutedBy = adminId;
      user.mutedAt = new Date();
      user.muteReason = reason;

      if (duration) {
        // Duration in hours
        // Note: We'll need to implement a job to automatically unmute users
      }
    } else if (action === "unmute") {
      user.isMuted = false;
      user.mutedBy = null;
      user.mutedAt = null;
      user.muteReason = null;
    }

    await userRepository.save(user);

    // Audit log
    req.newValues = {
      isMuted: user.isMuted,
      mutedBy: user.mutedBy,
      mutedAt: user.mutedAt,
      muteReason: user.muteReason,
    };

    const muteRecord = user.isMuted
      ? {
          id: Date.now(), // Temporary ID for response
          reason: user.muteReason,
          expiresAt: duration
            ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
            : null,
        }
      : null;

    res.json({
      success: true,
      data: {
        user,
        muteRecord,
      },
      message: `User ${action}d successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason, permanent = false } = req.body;

    // Store deletion reason for audit
    req.oldValues = { reason };

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: id!, deleted: false },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: { code: "USER_NOT_FOUND" },
      });
    }

    if (permanent) {
      await userRepository.remove(user);
    } else {
      user.deleted = true;
      user.deletedAt = new Date();
      await userRepository.save(user);
    }

    res.json({
      success: true,
      message: `User ${
        permanent ? "permanently deleted" : "soft deleted"
      } successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userRepository = AppDataSource.getRepository(User);

    // Basic counts
    const total = await userRepository.count({ where: { deleted: false } });
    const verified = await userRepository.count({
      where: { verificationStatus: "verified", deleted: false },
    });
    const unverified = await userRepository.count({
      where: { verificationStatus: "unverified", deleted: false },
    });
    const muted = await userRepository.count({
      where: { isMuted: true, deleted: false },
    });

    // Active users
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeToday = await userRepository
      .createQueryBuilder("u")
      .where("u.lastLogin >= :dayAgo", { dayAgo })
      .andWhere("u.deleted = :deleted", { deleted: false })
      .getCount();

    const activeWeek = await userRepository
      .createQueryBuilder("u")
      .where("u.lastLogin >= :weekAgo", { weekAgo })
      .andWhere("u.deleted = :deleted", { deleted: false })
      .getCount();

    // Growth stats
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newToday = await userRepository
      .createQueryBuilder("u")
      .where("u.createdAt >= :yesterday", { yesterday })
      .andWhere("u.deleted = :deleted", { deleted: false })
      .getCount();

    const newWeek = await userRepository
      .createQueryBuilder("u")
      .where("u.createdAt >= :lastWeek", { lastWeek })
      .andWhere("u.deleted = :deleted", { deleted: false })
      .getCount();

    const newMonth = await userRepository
      .createQueryBuilder("u")
      .where("u.createdAt >= :lastMonth", { lastMonth })
      .andWhere("u.deleted = :deleted", { deleted: false })
      .getCount();

    // By level
    const byLevel = await userRepository
      .createQueryBuilder("u")
      .select("u.level", "level")
      .addSelect("COUNT(*)", "count")
      .where("u.deleted = :deleted", { deleted: false })
      .groupBy("u.level")
      .getRawMany();

    const levelStats = byLevel.reduce(
      (acc, curr: { level: string; count: string }) => {
        acc[curr.level] = parseInt(curr.count, 10);
        return acc;
      },
      {} as Record<string, number>
    );

    // By role (using level as role for now)
    const byRole = { ...levelStats };

    res.json({
      success: true,
      data: {
        total,
        verified,
        unverified,
        muted,
        activeToday,
        activeWeek,
        byLevel: levelStats,
        byRole,
        growth: {
          today: newToday,
          week: newWeek,
          month: newMonth,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed: ExportUsersRequest = ExportUsersSchema.parse(req.body);
    const { format, filters, fields } = parsed;

    // Map format from schema to service format
    const exportFormat = format === "excel" ? "xlsx" : format;

    // Prepare filters for export service
    const exportOptions = {
      format: exportFormat as "csv" | "xlsx" | "pdf",
      filters: filters
        ? {
            search: filters.search,
            status: filters.status,
            level: filters.level,
            role: filters.role,
            // Note: dateFrom/dateTo are not in GetUsersQuerySchema, so dateRange would need to be passed separately
            // For now, we'll skip dateRange filtering in exports unless added to schema
          }
        : undefined,
      fields,
    };

    const result = await adminExportService.exportUsers(exportOptions);

    res.json({
      success: true,
      data: result,
      message: `Users export generated successfully. Available for 24 hours.`,
    });
  } catch (error) {
    next(error);
  }
};
