import type { NextFunction, Request, Response } from "express";
import { AdminRole, type AdminUser } from "../entities/AdminUser.js";
import { AdminAuthService } from "../services/admin-auth.service.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";
import { extractTokenFromHeader } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      admin?: AdminUser;
      adminPermissions?: string[];
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
    }
  }
}

const adminAuthService = new AdminAuthService();

export const authenticateAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    const session = await adminAuthService.getSession(token);
    req.admin = session.admin;
    req.adminPermissions = session.permissions;

    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdminPermissions = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin) {
      return next(new UnauthorizedError("Admin authentication required"));
    }

    if (!req.adminPermissions) {
      return next(new ForbiddenError("No permissions found"));
    }

    const hasPermission = requiredPermissions.every((permission) =>
      req.adminPermissions!.includes(permission)
    );

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Required: ${requiredPermissions.join(
            ", "
          )}`
        )
      );
    }

    next();
  };
};

export const requireAdminRole = (...roles: AdminRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin) {
      return next(new UnauthorizedError("Admin authentication required"));
    }

    if (!roles.includes(req.admin.role)) {
      return next(
        new ForbiddenError(
          `Insufficient role. Required: ${roles.join(", ")}, Current: ${
            req.admin.role
          }`
        )
      );
    }

    next();
  };
};

export const requireSuperAdmin = requireAdminRole(AdminRole.SUPER_ADMIN);

export const requireAdminOrSuperAdmin = requireAdminRole(
  AdminRole.ADMIN,
  AdminRole.SUPER_ADMIN
);

export const auditLog = (action: string, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const startTime = Date.now();

    res.send = function (data) {
      const duration = Date.now() - startTime;

      if (req.admin) {
        adminAuthService["logAuditAction"]({
          adminUserId: req.admin.id,
          action,
          resourceType,
          resourceId: req.params.id ? parseInt(req.params.id) : undefined,
          oldValues: (req as any).oldValues,
          newValues: (req as any).newValues,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        }).catch((err) => {
          console.error("Failed to log audit action:", err);
        });
      }

      originalSend.call(this, data);
    };

    next();
  };
};
