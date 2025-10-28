import type { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { isTokenDenied } from "../config/redis.js";
import { User } from "../entities/User.js";
import {
  ForbiddenError,
  ServiceUnavailableError,
  UnauthorizedError,
} from "../utils/errors.js";
import { extractTokenFromHeader, verifyToken } from "../utils/jwt.js";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    const payload = verifyToken(token);

    const isDenied = await isTokenDenied(token);
    if (isDenied) {
      throw new UnauthorizedError("Token has been revoked");
    }

    if (!AppDataSource.isInitialized) {
      throw new ServiceUnavailableError("Service temporarily unavailable");
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: payload.userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is inactive");
    }

    if (user.deleted) {
      throw new UnauthorizedError("Account has been deleted");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return next();
    }

    const payload = verifyToken(token);
    const isDenied = await isTokenDenied(token);
    if (isDenied) {
      return next();
    }

    if (!AppDataSource.isInitialized) {
      return next();
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: payload.userId },
      relations: ["wallet"],
    });

    if (user?.isActive && !user.deleted) {
      req.user = user;
    }

    next();
  } catch {
    next();
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const hasRole =
      (req.user.level && roles.includes(req.user.level)) ||
      req.user.isStaff ||
      req.user.isSuperuser;

    if (!hasRole) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
};

export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  if (!req.user.isStaff && !req.user.isSuperuser) {
    return next(new ForbiddenError("Admin access required"));
  }

  next();
};
