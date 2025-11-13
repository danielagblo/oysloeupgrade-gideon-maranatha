import type { NextFunction, Request, Response } from 'express';
import {
  GetSubscriptionsQuerySchema,
  UpdateSubscriptionStatusSchema,
} from '../schemas/admin.js';
import { AdminSubscriptionsService } from '../services/admin-subscriptions.service.js';
import { requireAdminId } from '../utils/guards.js';

const subscriptionsService = new AdminSubscriptionsService();

export const getSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = GetSubscriptionsQuerySchema.parse(req.query);
    const result = await subscriptionsService.getSubscriptions(query);

    res.json({
      success: true,
      data: {
        subscriptions: result.subscriptions,
        pagination: result.pagination,
        filters: result.filters,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionsService.getSubscription(id);

    res.json({
      success: true,
      data: { subscription },
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await subscriptionsService.getSubscriptionStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscriptionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const body = UpdateSubscriptionStatusSchema.parse(req.body);
    const adminId = requireAdminId(req);

    req.oldValues = {
      status: (await subscriptionsService.getSubscription(id)).status,
    };

    const subscription = await subscriptionsService.updateSubscriptionStatus(
      id,
      body
    );

    req.newValues = {
      status: subscription.status,
    };

    res.json({
      success: true,
      data: { subscription },
      message: `Subscription status updated to ${body.status}`,
    });
  } catch (error) {
    next(error);
  }
};


