import type { Request, Response, NextFunction } from "express";
import { AdminSupportService } from "../services/admin-support.service.js";
import {
  GetSupportCasesQuerySchema,
  SendSupportMessageSchema,
  UpdateCaseStatusSchema,
  AssignCaseSchema,
} from "../schemas/admin.js";

type GetSupportCasesQuery = Zod.infer<typeof GetSupportCasesQuerySchema>;
type SendSupportMessageRequest = Zod.infer<typeof SendSupportMessageSchema>;
type UpdateCaseStatusRequest = Zod.infer<typeof UpdateCaseStatusSchema>;
type AssignCaseRequest = Zod.infer<typeof AssignCaseSchema>;

const supportService = new AdminSupportService();

export const getCases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: GetSupportCasesQuery = GetSupportCasesQuerySchema.parse(req.query);
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const caseId = parseInt(req.params.id, 10);
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    const body = SendSupportMessageSchema.parse(req.body);
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }
    const adminUserId = req.admin.id;

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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    const body = UpdateCaseStatusSchema.parse(req.body);

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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    const body = AssignCaseSchema.parse(req.body);
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
