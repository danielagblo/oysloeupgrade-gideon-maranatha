import type { NextFunction, Request, Response } from 'express';
import { ExportRequestSchema } from '../schemas/admin.js';
import { AdminExportService } from '../services/admin-export.service.js';

type ExportRequest = Zod.infer<typeof ExportRequestSchema>;

const exportService = new AdminExportService();

export const exportUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: ExportRequest = ExportRequestSchema.parse(req.body);
    const result = await exportService.exportUsers(body);

    res.json({
      success: true,
      data: {
        downloadUrl: result.downloadUrl,
        expiresAt: result.expiresAt,
        fileSize: result.fileSize,
        recordCount: result.recordCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportAds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: ExportRequest = ExportRequestSchema.parse(req.body);
    const result = await exportService.exportAds(body);

    res.json({
      success: true,
      data: {
        downloadUrl: result.downloadUrl,
        expiresAt: result.expiresAt,
        fileSize: result.fileSize,
        recordCount: result.recordCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportSupport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: ExportRequest = ExportRequestSchema.parse(req.body);
    const result = await exportService.exportSupport(body);

    res.json({
      success: true,
      data: {
        downloadUrl: result.downloadUrl,
        expiresAt: result.expiresAt,
        fileSize: result.fileSize,
        recordCount: result.recordCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: ExportRequest = ExportRequestSchema.parse(req.body);
    const result = await exportService.exportReports(body);

    res.json({
      success: true,
      data: {
        downloadUrl: result.downloadUrl,
        expiresAt: result.expiresAt,
        fileSize: result.fileSize,
        recordCount: result.recordCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
