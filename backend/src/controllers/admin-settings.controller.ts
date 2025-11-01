import type { Request, Response, NextFunction } from "express";
import { AdminSettingsService } from "../services/admin-settings.service.js";
import { UpdatePrivacyPolicySchema, UpdateTermsConditionsSchema } from "../schemas/admin.js";

const settingsService = new AdminSettingsService();

export const getPrivacyPolicy = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const content = await settingsService.getPrivacyPolicy();

    res.json({
      success: true,
      data: { content },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePrivacyPolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = UpdatePrivacyPolicySchema.parse(req.body);
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const adminUserId = req.admin.id;

    const setting = await settingsService.updatePrivacyPolicy(body, adminUserId);

    res.json({
      success: true,
      data: { content: setting.value },
    });
  } catch (error) {
    next(error);
  }
};

export const getTermsConditions = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const content = await settingsService.getTermsConditions();

    res.json({
      success: true,
      data: { content },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTermsConditions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = UpdateTermsConditionsSchema.parse(req.body);
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const adminUserId = req.admin.id;

    const setting = await settingsService.updateTermsConditions(body, adminUserId);

    res.json({
      success: true,
      data: { content: setting.value },
    });
  } catch (error) {
    next(error);
  }
};

