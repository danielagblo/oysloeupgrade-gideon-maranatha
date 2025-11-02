import type { NextFunction, Request, Response } from 'express';
import {
  GetFeedbackQuerySchema,
  GetReportsQuerySchema,
  ResolveReportSchema,
} from '../schemas/admin.js';
import { AdminReportsService } from '../services/admin-reports.service.js';
import { requireAdminId } from '../utils/guards.js';

const reportsService = new AdminReportsService();

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = GetReportsQuerySchema.parse(req.query);
    const result = await reportsService.getReports(query);

    res.json({
      success: true,
      data: {
        reports: result.reports,
        pagination: result.pagination,
        stats: result.stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    const report = await reportsService.getReport(reportId);

    res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

export const resolveReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    const body = ResolveReportSchema.parse(req.body);
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: { code: 'UNAUTHORIZED' },
      });
    }
    const adminUserId = requireAdminId(req);

    const report = await reportsService.resolveReport(reportId, body, adminUserId);

    res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = GetFeedbackQuerySchema.parse(req.query);
    const result = await reportsService.getFeedback(query);

    res.json({
      success: true,
      data: {
        feedback: result.feedback,
        pagination: result.pagination,
        stats: result.stats,
      },
    });
  } catch (error) {
    next(error);
  }
};
