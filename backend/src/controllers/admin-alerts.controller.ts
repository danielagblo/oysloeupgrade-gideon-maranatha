import type { NextFunction, Request, Response } from "express";
import {
  CreateCouponSchema,
  GetAlertsHistoryQuerySchema,
  GetSelectableAdsQuerySchema,
  GetSelectableUsersQuerySchema,
  SendAlertSchema,
} from "../schemas/admin.js";
import { AdminAlertsService } from "../services/admin-alerts.service.js";
import { requireAdminId } from "../utils/guards.js";

const alertsService = new AdminAlertsService();

export const sendAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = SendAlertSchema.parse(req.body);
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const result = await alertsService.sendAlert({
      ...body,
      createdBy: requireAdminId(req),
    });

    res.json({
      success: true,
      data: {
        alert: result.alert,
        coupon: result.coupon,
        recipients: result.recipients,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = CreateCouponSchema.parse(req.body);
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const createdBy = req.admin.id;

    const result = await alertsService.createCoupon({
      ...body,
      createdBy,
    });

    res.json({
      success: true,
      data: {
        coupon: result.coupon,
        alert: result.alert,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAlertsHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = GetAlertsHistoryQuerySchema.parse(req.query);
    const result = await alertsService.getAlertsHistory(query);

    res.json({
      success: true,
      data: {
        alerts: result.alerts,
        pagination: result.pagination,
        stats: result.stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSelectableUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = GetSelectableUsersQuerySchema.parse(req.query);
    const result = await alertsService.getSelectableUsers(query);

    res.json({
      success: true,
      data: {
        users: result.users,
        pagination: result.pagination,
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSelectableAds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = GetSelectableAdsQuerySchema.parse(req.query);
    const result = await alertsService.getSelectableAds(query);

    res.json({
      success: true,
      data: {
        ads: result.ads,
        pagination: result.pagination,
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSelectableTargets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get both users and ads in parallel
    const [usersResult, adsResult] = await Promise.all([
      alertsService.getSelectableUsers({
        page: 1,
        limit: 50,
        search: req.query.search as string,
      }),
      alertsService.getSelectableAds({
        page: 1,
        limit: 50,
        search: req.query.search as string,
      }),
    ]);

    res.json({
      success: true,
      data: {
        users: usersResult.users,
        ads: adsResult.ads,
        totalUsers: usersResult.total,
        totalAds: adsResult.total,
      },
    });
  } catch (error) {
    next(error);
  }
};
