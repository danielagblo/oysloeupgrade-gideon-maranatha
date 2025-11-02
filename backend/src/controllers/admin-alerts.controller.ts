import type { NextFunction, Request, Response } from "express";
import {
  CreateCouponSchema,
  GetAlertsHistoryQuerySchema,
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
