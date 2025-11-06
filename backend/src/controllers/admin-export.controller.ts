import type { NextFunction, Request, Response } from "express";
import { ExportRequestSchema } from "../schemas/admin.js";
import { AdminExportService } from "../services/admin-export.service.js";

type ExportRequest = Zod.infer<typeof ExportRequestSchema>;

const exportService = new AdminExportService();

export const exportUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: ExportRequest = ExportRequestSchema.parse(req.query);
    const result = await exportService.exportUsers(query);

    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );
    res.send(result.data);
  } catch (error) {
    next(error);
  }
};

export const exportAds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: ExportRequest = ExportRequestSchema.parse(req.query);
    const result = await exportService.exportAds(query);

    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );
    res.send(result.data);
  } catch (error) {
    next(error);
  }
};

export const exportSupport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: ExportRequest = ExportRequestSchema.parse(req.query);
    const result = await exportService.exportSupport(query);

    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );
    res.send(result.data);
  } catch (error) {
    next(error);
  }
};

export const exportReports = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: ExportRequest = ExportRequestSchema.parse(req.query);
    const result = await exportService.exportReports(query);

    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );
    res.send(result.data);
  } catch (error) {
    next(error);
  }
};
