import type { Request, Response, NextFunction } from "express";
import { AdminApplicationsService } from "../services/admin-applications.service.js";
import {
  GetApplicationsQuerySchema,
  DownloadApplicationSchema,
  UpdateApplicationStatusSchema,
} from "../schemas/admin.js";

const applicationsService = new AdminApplicationsService();

export const getApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = GetApplicationsQuerySchema.parse(req.query);
    const result = await applicationsService.getApplications(query);

    res.json({
      success: true,
      data: {
        applications: result.applications,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const applicationId = parseInt(req.params.id, 10);
    const application = await applicationsService.getApplication(applicationId);

    res.json({
      success: true,
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const applicationId = parseInt(req.params.id, 10);
    const body = DownloadApplicationSchema.parse(req.body);

    const result = await applicationsService.downloadDocument(
      applicationId,
      body.documentType
    );

    res.json({
      success: true,
      data: {
        downloadUrl: result.downloadUrl,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const applicationId = parseInt(req.params.id, 10);
    const body = UpdateApplicationStatusSchema.parse(req.body);
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const adminUserId = req.admin.id!;

    const application = await applicationsService.updateStatus(
      applicationId,
      body.status,
      adminUserId,
      body.notes,
      body.feedback
    );

    res.json({
      success: true,
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};
