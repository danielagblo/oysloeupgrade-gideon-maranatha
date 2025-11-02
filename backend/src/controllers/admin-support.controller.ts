import type { NextFunction, Request, Response } from "express";
// biome-ignore lint/style/useImportType: z.infer requires runtime import
import { z } from "zod";
import {
  AssignCaseSchema,
  GetSupportCasesQuerySchema,
  SendSupportMessageSchema,
  UpdateCaseStatusSchema,
} from "../schemas/admin.js";
import { AdminSupportService } from "../services/admin-support.service.js";
import { requireAdminId } from "../utils/guards.js";

type GetSupportCasesQuery = z.infer<typeof GetSupportCasesQuerySchema>;
type SendSupportMessageRequest = z.infer<typeof SendSupportMessageSchema>;
type UpdateCaseStatusRequest = z.infer<typeof UpdateCaseStatusSchema>;
type AssignCaseRequest = z.infer<typeof AssignCaseSchema>;

type IdParam = { id: string };

const supportService = new AdminSupportService();

export const getCases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: GetSupportCasesQuery = GetSupportCasesQuerySchema.parse(
      req.query
    );
    const result = await supportService.getCases(query);

    res.json({
      success: true,
      data: {
        cases: result.cases,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCase = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction
) => {
  try {
    const caseId = Number.parseInt(req.params.id, 10);
    const result = await supportService.getCase(caseId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction
) => {
  try {
    const caseId = Number.parseInt(req.params.id, 10);
    const body: SendSupportMessageRequest = SendSupportMessageSchema.parse(
      req.body
    );
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const adminUserId = requireAdminId(req);

    const message = await supportService.sendMessage({
      caseId,
      adminUserId,
      content: body.content,
      messageType: body.messageType,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      fileSize: body.fileSize,
    });

    const updatedCase = await supportService.getCase(caseId);

    res.json({
      success: true,
      data: {
        message,
        case: updatedCase,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction
) => {
  try {
    const caseId = Number.parseInt(req.params.id, 10);
    const body: UpdateCaseStatusRequest = UpdateCaseStatusSchema.parse(
      req.body
    );

    const supportCase = await supportService.updateStatus(
      caseId,
      body.status,
      body.notes
    );

    res.json({
      success: true,
      data: {
        case: supportCase,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const assignCase = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction
) => {
  try {
    const caseId = Number.parseInt(req.params.id, 10);
    const body: AssignCaseRequest = AssignCaseSchema.parse(req.body);
    const adminUserId = body.adminUserId || null;

    const supportCase = await supportService.assignCase(
      caseId,
      adminUserId,
      body.notes
    );

    const updatedCase = await supportService.getCase(caseId);

    res.json({
      success: true,
      data: {
        case: updatedCase,
        assignment: supportCase,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOnlineUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const onlineUsers = await supportService.getOnlineUsers();

    res.json({
      success: true,
      data: {
        onlineUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};
