import type { Request, Response, NextFunction } from "express";
import { AdminAuthService } from "../services/admin-auth.service.js";
import { extractTokenFromHeader } from "../utils/jwt.js";

const adminAuthService = new AdminAuthService();

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    const result = await adminAuthService.login(
      { username, password },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (token) {
      await adminAuthService.logout(token, req.ip, req.get('User-Agent'));
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        error: { code: "NO_TOKEN" },
      });
    }

    const result = await adminAuthService.getSession(token);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    const result = await adminAuthService.refreshToken(
      refreshToken,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requiredPermissions } = req.body;
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        error: { code: "NO_TOKEN" },
      });
    }

    const result = await adminAuthService.verifyPermissions(token, requiredPermissions);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminData = req.body;

    const result = await adminAuthService.createAdmin(adminData);

    res.status(201).json({
      success: true,
      data: result,
      message: "Admin created successfully",
    });
  } catch (error) {
    next(error);
  }
};
