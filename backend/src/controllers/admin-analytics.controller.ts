import type { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { AdModerationHistory } from "../entities/AdModerationHistory.js";
import { Product } from "../entities/Product.js";
import { Subscription } from "../entities/Subscription.js";
import { SupportCase } from "../entities/SupportCase.js";
import { SupportCaseAssignment } from "../entities/SupportCaseAssignment.js";
import { User } from "../entities/User.js";
import { WalletLedger } from "../entities/WalletLedger.js";
import {
  AdsAnalyticsQuerySchema,
  RevenueAnalyticsQuerySchema,
  UserAnalyticsQuerySchema,
} from "../schemas/admin.js";

export const getDashboardOverview = async (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const productRepository = AppDataSource.getRepository(Product);
    const walletLedgerRepository = AppDataSource.getRepository(WalletLedger);
    const subscriptionRepository = AppDataSource.getRepository(Subscription);

    const totalUsers = await userRepository.count({
      where: { deleted: false },
    });
    const verifiedUsers = await userRepository.count({
      where: { verificationStatus: "verified", deleted: false },
    });
    const activeUsers = await userRepository.count({
      where: { isActive: true, deleted: false },
    });

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yesterdayStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const newUsersToday = await userRepository
      .createQueryBuilder("u")
      .where("u.createdAt >= :dayAgo", { dayAgo })
      .andWhere("u.deleted = :deleted", { deleted: false })
      .getCount();

    const newUsersYesterday = await userRepository
      .createQueryBuilder("u")
      .where("u.createdAt >= :yesterdayStart", { yesterdayStart })
      .andWhere("u.createdAt < :dayAgo", { dayAgo })
      .andWhere("u.deleted = :deleted", { deleted: false })
      .getCount();

    const newUsersWeek = await userRepository
      .createQueryBuilder("u")
      .where("u.createdAt >= :weekAgo", { weekAgo })
      .andWhere("u.deleted = :deleted", { deleted: false })
      .getCount();

    const newUsersMonth = await userRepository
      .createQueryBuilder("u")
      .where("u.createdAt >= :monthAgo", { monthAgo })
      .andWhere("u.deleted = :deleted", { deleted: false })
      .getCount();

    const totalAds = await productRepository.count({
      where: { deleted: false },
    });
    const activeAds = await productRepository.count({
      where: { moderationStatus: "active", deleted: false },
    });
    const pendingAds = await productRepository.count({
      where: { moderationStatus: "pending", deleted: false },
    });
    const suspendedAds = await productRepository.count({
      where: { moderationStatus: "suspended", deleted: false },
    });
    const takenAds = await productRepository.count({
      where: { status: "sold", deleted: false },
    });

    const newAdsToday = await productRepository
      .createQueryBuilder("p")
      .where("p.createdAt >= :dayAgo", { dayAgo })
      .andWhere("p.deleted = :deleted", { deleted: false })
      .getCount();

    const newAdsWeek = await productRepository
      .createQueryBuilder("p")
      .where("p.createdAt >= :weekAgo", { weekAgo })
      .andWhere("p.deleted = :deleted", { deleted: false })
      .getCount();

    // Revenue Summary - count transactions (orders/payments)
    const ordersToday = await walletLedgerRepository
      .createQueryBuilder("wl")
      .where("wl.createdAt >= :dayAgo", { dayAgo })
      .andWhere("wl.transactionType = :type", { type: "credit" })
      .getCount();

    const ordersYesterday = await walletLedgerRepository
      .createQueryBuilder("wl")
      .where("wl.createdAt >= :yesterdayStart", { yesterdayStart })
      .andWhere("wl.createdAt < :dayAgo", { dayAgo })
      .andWhere("wl.transactionType = :type", { type: "credit" })
      .getCount();

    const ordersWeekAgo = await walletLedgerRepository
      .createQueryBuilder("wl")
      .where("wl.createdAt >= :weekAgo", { weekAgo })
      .andWhere("wl.transactionType = :type", { type: "credit" })
      .getCount();

    const supportCaseRepository = AppDataSource.getRepository(SupportCase);
    const openCases = await supportCaseRepository.count({
      where: { status: "open" },
    });
    const resolvedToday = await supportCaseRepository
      .createQueryBuilder("case")
      .where("case.status = :status", { status: "resolved" })
      .andWhere("case.resolvedAt >= :dayAgo", { dayAgo })
      .getCount();
    const avgResponseTime = 0;

    // Subscription statistics
    const totalSubscriptions = await subscriptionRepository.count();
    const activeSubscriptions = await subscriptionRepository.count({
      where: { status: "active" },
    });
    const subscriptionsByPlan = await subscriptionRepository
      .createQueryBuilder("s")
      .select("s.planType", "planType")
      .addSelect("COUNT(*)", "count")
      .where("s.status = :status", { status: "active" })
      .groupBy("s.planType")
      .getRawMany();

    const subscriptions = {
      total: totalSubscriptions,
      active: activeSubscriptions,
      byPlan: subscriptionsByPlan.reduce(
        (acc, curr: { planType: string; count: string }) => {
          acc[curr.planType] = parseInt(curr.count, 10);
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newYesterday: newUsersYesterday,
          newWeek: newUsersWeek,
          newMonth: newUsersMonth,
          verified: verifiedUsers,
          active: activeUsers,
        },
        ads: {
          total: totalAds,
          active: activeAds,
          pending: pendingAds,
          suspended: suspendedAds,
          taken: takenAds,
          newToday: newAdsToday,
          newWeek: newAdsWeek,
        },
        subscriptions,
        revenue: {
          summary: {
            todayOrders: ordersToday,
            yesterday: ordersYesterday,
            weekAgo: ordersWeekAgo,
          },
        },
        support: {
          openCases,
          resolvedToday,
          avgResponseTime,
        },
      },
    });
  } catch (error) {
    _next(error);
  }
};

export const getUserAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = UserAnalyticsQuerySchema.parse(req.query);
    const { dateFrom, dateTo, groupBy = "day" } = query;

    const userRepository = AppDataSource.getRepository(User);
    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    let dateTrunc: string;
    switch (groupBy) {
      case "week":
        dateTrunc = "week";
        break;
      case "month":
        dateTrunc = "month";
        break;
      default:
        dateTrunc = "day";
        break;
    }

    const registrationsRaw = await userRepository
      .createQueryBuilder("user")
      .select(`DATE_TRUNC('${dateTrunc}', user.createdAt)`, "date")
      .addSelect("COUNT(*)", "count")
      .where("user.createdAt >= :startDate", { startDate })
      .andWhere("user.createdAt <= :endDate", { endDate })
      .andWhere("user.deleted = :deleted", { deleted: false })
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    const registrations = registrationsRaw.map(
      (r: { date: Date; count: string }) => ({
        date: r.date.toISOString(),
        count: parseInt(r.count, 10),
      })
    );

    const verificationsRaw = await userRepository
      .createQueryBuilder("user")
      .select(`DATE_TRUNC('${dateTrunc}', user.verifiedAt)`, "date")
      .addSelect("COUNT(*)", "count")
      .where("user.verifiedAt >= :startDate", { startDate })
      .andWhere("user.verifiedAt <= :endDate", { endDate })
      .andWhere("user.verificationStatus = :status", { status: "verified" })
      .andWhere("user.verifiedAt IS NOT NULL")
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    const verifications = verificationsRaw.map(
      (r: { date: Date; count: string }) => ({
        date: r.date.toISOString(),
        count: parseInt(r.count, 10),
      })
    );

    const activeUsersRaw = await userRepository
      .createQueryBuilder("user")
      .select(`DATE_TRUNC('${dateTrunc}', user.lastLogin)`, "date")
      .addSelect("COUNT(DISTINCT user.id)", "count")
      .where("user.lastLogin >= :startDate", { startDate })
      .andWhere("user.lastLogin <= :endDate", { endDate })
      .andWhere("user.deleted = :deleted", { deleted: false })
      .andWhere("user.lastLogin IS NOT NULL")
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    const activeUsers = activeUsersRaw.map(
      (r: { date: Date; count: string }) => ({
        date: r.date.toISOString(),
        count: parseInt(r.count, 10),
      })
    );

    const topRegions: Array<{ region: string; count: number }> = [];

    const deviceTypes: Array<{ type: string; count: number }> = [];

    res.json({
      success: true,
      data: {
        registrations,
        verifications,
        activeUsers,
        topRegions,
        deviceTypes,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdsAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = AdsAnalyticsQuerySchema.parse(req.query);
    const { dateFrom, dateTo, category } = query;

    const productRepository = AppDataSource.getRepository(Product);
    const moderationHistoryRepository =
      AppDataSource.getRepository(AdModerationHistory);
    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    const postingsRaw = await productRepository
      .createQueryBuilder("product")
      .select("DATE_TRUNC('day', product.createdAt)", "date")
      .addSelect("COUNT(*)", "count")
      .where("product.createdAt >= :startDate", { startDate })
      .andWhere("product.createdAt <= :endDate", { endDate })
      .andWhere("product.deleted = :deleted", { deleted: false })
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    const postings = postingsRaw.map((r: { date: Date; count: string }) => ({
      date: r.date.toISOString(),
      count: parseInt(r.count, 10),
    }));

    const approvalsRaw = await moderationHistoryRepository
      .createQueryBuilder("amh")
      .select("DATE_TRUNC('day', amh.createdAt)", "date")
      .addSelect("COUNT(*)", "count")
      .where("amh.createdAt >= :startDate", { startDate })
      .andWhere("amh.createdAt <= :endDate", { endDate })
      .andWhere("amh.action = :action", { action: "approve" })
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    const approvals = approvalsRaw.map((r: { date: Date; count: string }) => ({
      date: r.date.toISOString(),
      count: parseInt(r.count, 10),
    }));

    const suspensionsRaw = await moderationHistoryRepository
      .createQueryBuilder("amh")
      .select("DATE_TRUNC('day', amh.createdAt)", "date")
      .addSelect("COUNT(*)", "count")
      .where("amh.createdAt >= :startDate", { startDate })
      .andWhere("amh.createdAt <= :endDate", { endDate })
      .andWhere("amh.action = :action", { action: "suspend" })
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    const suspensions = suspensionsRaw.map(
      (r: { date: Date; count: string }) => ({
        date: r.date.toISOString(),
        count: parseInt(r.count, 10),
      })
    );

    const topCategoriesQuery = productRepository
      .createQueryBuilder("product")
      .leftJoin("product.category", "category")
      .select("category.name", "categoryName")
      .addSelect("category.id", "categoryId")
      .addSelect("COUNT(*)", "count")
      .where("product.createdAt >= :startDate", { startDate })
      .andWhere("product.createdAt <= :endDate", { endDate })
      .andWhere("product.deleted = :deleted", { deleted: false })
      .andWhere("product.moderationStatus = :status", { status: "active" });

    if (category) {
      topCategoriesQuery.andWhere("product.categoryId = :category", {
        category,
      });
    }

    const topCategoriesRaw = await topCategoriesQuery
      .groupBy("category.id")
      .addGroupBy("category.name")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    const topCategories = topCategoriesRaw.map(
      (r: { categoryId: string; categoryName: string; count: string }) => ({
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        count: parseInt(r.count, 10),
      })
    );

    const topSellersRaw = await productRepository
      .createQueryBuilder("product")
      .leftJoin("product.user", "user")
      .select("user.id", "sellerId")
      .addSelect("user.name", "sellerName")
      .addSelect("COUNT(*)", "adCount")
      .where("product.createdAt >= :startDate", { startDate })
      .andWhere("product.createdAt <= :endDate", { endDate })
      .andWhere("product.deleted = :deleted", { deleted: false })
      .andWhere("product.moderationStatus = :status", { status: "active" })
      .groupBy("user.id")
      .addGroupBy("user.name")
      .orderBy('"adCount"', "DESC")
      .limit(10)
      .getRawMany();

    const topSellers = topSellersRaw.map(
      (r: { sellerId: string; sellerName: string; adCount: string }) => ({
        sellerId: r.sellerId,
        sellerName: r.sellerName,
        adCount: parseInt(r.adCount, 10),
      })
    );

    const performanceRaw = await productRepository
      .createQueryBuilder("product")
      .select("DATE_TRUNC('day', product.createdAt)", "date")
      .addSelect("SUM(product.viewsCount)", "totalViews")
      .addSelect("SUM(product.favoritesCount)", "totalFavorites")
      .addSelect("AVG(product.viewsCount)", "avgViews")
      .where("product.createdAt >= :startDate", { startDate })
      .andWhere("product.createdAt <= :endDate", { endDate })
      .andWhere("product.deleted = :deleted", { deleted: false })
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    const performance = performanceRaw.map(
      (r: {
        date: Date;
        totalViews: string | null;
        totalFavorites: string | null;
        avgViews: string | null;
      }) => ({
        date: r.date.toISOString(),
        totalViews: parseInt(r.totalViews || "0", 10),
        totalFavorites: parseInt(r.totalFavorites || "0", 10),
        avgViews: parseFloat(r.avgViews || "0"),
      })
    );

    res.json({
      success: true,
      data: {
        postings,
        approvals,
        suspensions,
        topCategories,
        topSellers,
        performance,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = RevenueAnalyticsQuerySchema.parse(req.query);
    const { dateFrom, dateTo, type } = query;

    const walletLedgerRepository = AppDataSource.getRepository(WalletLedger);
    const subscriptionRepository = AppDataSource.getRepository(Subscription);

    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    // Revenue from WalletLedger (credit transactions)
    const walletRevenueQuery = walletLedgerRepository
      .createQueryBuilder("wl")
      .select("wl.reason", "source")
      .addSelect("SUM(wl.amount)", "total")
      .where("wl.transactionType = :type", { type: "credit" })
      .andWhere("wl.createdAt >= :startDate", { startDate })
      .andWhere("wl.createdAt <= :endDate", { endDate });

    if (type) {
      const reasonMap: Record<string, string> = {
        subscription: "subscription",
        commission: "commission",
        ads: "ad_promotion",
      };
      walletRevenueQuery.andWhere("wl.reason = :reason", {
        reason: reasonMap[type] || type,
      });
    }

    const walletRevenueRaw = await walletRevenueQuery
      .groupBy("wl.reason")
      .getRawMany();

    const walletRevenue = walletRevenueRaw.map(
      (r: { source: string; total: string }) => ({
        source: r.source,
        amount: parseFloat(r.total || "0"),
      })
    );

    // Revenue from Subscriptions
    const subscriptionRevenueQuery = subscriptionRepository
      .createQueryBuilder("s")
      .select("SUM(s.price)", "total")
      .where("s.status = :status", { status: "active" })
      .andWhere("s.createdAt >= :startDate", { startDate })
      .andWhere("s.createdAt <= :endDate", { endDate });

    if (type === "subscription" || !type) {
      const subscriptionRevenueRaw = await subscriptionRevenueQuery.getRawOne();
      const subscriptionTotal = parseFloat(
        subscriptionRevenueRaw?.total || "0"
      );
      if (subscriptionTotal > 0) {
        walletRevenue.push({
          source: "subscription",
          amount: subscriptionTotal,
        });
      }
    }

    // Revenue trends over time
    const trendsRaw = await walletLedgerRepository
      .createQueryBuilder("wl")
      .select("DATE_TRUNC('day', wl.createdAt)", "date")
      .addSelect("SUM(wl.amount)", "total")
      .where("wl.transactionType = :type", { type: "credit" })
      .andWhere("wl.createdAt >= :startDate", { startDate })
      .andWhere("wl.createdAt <= :endDate", { endDate })
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    const trends = trendsRaw.map((r: { date: Date; total: string }) => ({
      date: r.date.toISOString(),
      amount: parseFloat(r.total || "0"),
    }));

    // Calculate total revenue
    const total = walletRevenue.reduce((sum, item) => sum + item.amount, 0);

    // Simple projection: average daily revenue * 30 days
    const avgDailyRevenue =
      trends.length > 0
        ? trends.reduce((sum, t) => sum + t.amount, 0) / trends.length
        : 0;
    const projectionDays = 30;
    const projections = Array.from({ length: projectionDays }, (_, i) => {
      const date = new Date(endDate);
      date.setDate(date.getDate() + i + 1);
      return {
        date: date.toISOString(),
        projectedAmount: avgDailyRevenue,
      };
    });

    // Breakdown by source
    const breakdown = walletRevenue.map((item) => ({
      source: item.source,
      amount: item.amount,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
    }));

    res.json({
      success: true,
      data: {
        total,
        breakdown,
        trends,
        projections,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSupportAnalytics = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const supportCaseRepository = AppDataSource.getRepository(SupportCase);
    const supportCaseAssignmentRepository = AppDataSource.getRepository(
      SupportCaseAssignment
    );

    const totalCases = await supportCaseRepository.count();
    const openCases = await supportCaseRepository.count({
      where: { status: "open" },
    });
    const resolvedCases = await supportCaseRepository.count({
      where: { status: "resolved" },
    });

    const resolvedCasesWithDates = await supportCaseRepository
      .createQueryBuilder("case")
      .select("case.createdAt", "createdAt")
      .addSelect("case.resolvedAt", "resolvedAt")
      .where("case.status = :status", { status: "resolved" })
      .andWhere("case.resolvedAt IS NOT NULL")
      .getRawMany();

    let totalResolutionTime = 0;
    let validResolutions = 0;

    resolvedCasesWithDates.forEach((c) => {
      if (c.resolvedAt && c.createdAt) {
        const resolutionTime =
          (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime()) /
          (1000 * 60 * 60); // hours
        totalResolutionTime += resolutionTime;
        validResolutions++;
      }
    });

    const avgResolutionTime =
      validResolutions > 0 ? totalResolutionTime / validResolutions : 0;

    const caseCategoriesRaw = await supportCaseRepository
      .createQueryBuilder("case")
      .select("case.category", "category")
      .addSelect("COUNT(*)", "count")
      .groupBy("case.category")
      .orderBy("count", "DESC")
      .getRawMany();

    const caseCategories = caseCategoriesRaw.map(
      (r: { category: string | null; count: string }) => ({
        category: r.category || "uncategorized",
        count: parseInt(r.count, 10),
      })
    );

    const agentPerformanceRaw = await supportCaseAssignmentRepository
      .createQueryBuilder("assignment")
      .leftJoin("assignment.adminUser", "admin")
      .select("admin.id", "adminId")
      .addSelect("admin.username", "adminUsername")
      .addSelect("COUNT(DISTINCT assignment.caseId)", "casesAssigned")
      .addSelect(
        "COUNT(CASE WHEN assignment.unassignedAt IS NOT NULL THEN 1 END)",
        "casesResolved"
      )
      .groupBy("admin.id")
      .addGroupBy("admin.username")
      .orderBy('"casesAssigned"', "DESC")
      .getRawMany();

    const agentPerformance = agentPerformanceRaw.map(
      (r: {
        adminId: number;
        adminUsername: string;
        casesAssigned: string;
        casesResolved: string | null;
      }) => ({
        adminId: r.adminId,
        adminUsername: r.adminUsername,
        casesAssigned: parseInt(r.casesAssigned, 10),
        casesResolved: parseInt(r.casesResolved || "0", 10),
      })
    );

    const responseTimesRaw = await supportCaseAssignmentRepository
      .createQueryBuilder("assignment")
      .leftJoin(SupportCase, "case", "case.id = assignment.caseId")
      .select("DATE_TRUNC('day', assignment.assignedAt)", "date")
      .addSelect(
        "AVG(EXTRACT(EPOCH FROM (assignment.assignedAt - case.createdAt)) / 3600)",
        "avgHours"
      )
      .where("assignment.assignedAt IS NOT NULL")
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    const responseTimes = responseTimesRaw.map(
      (r: { date: Date; avgHours: string | null }) => ({
        date: r.date.toISOString(),
        avgHours: parseFloat(r.avgHours || "0"),
      })
    );

    res.json({
      success: true,
      data: {
        totalCases,
        openCases,
        resolvedCases,
        avgResolutionTime: Math.round(avgResolutionTime * 100) / 100, // Round to 2 decimal places
        caseCategories,
        agentPerformance,
        responseTimes,
      },
    });
  } catch (error) {
    next(error);
  }
};
