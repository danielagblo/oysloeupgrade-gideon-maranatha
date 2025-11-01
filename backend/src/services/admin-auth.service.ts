import type { EntityManager } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { AdminUser, AdminRole } from "../entities/AdminUser.js";
import { AdminSession } from "../entities/AdminSession.js";
import { AdminAuditLog } from "../entities/AdminAuditLog.js";
import {
  BadRequestError,
  ConflictError,
  TooManyRequestsError,
  UnauthorizedError,
  NotFoundError,
} from "../utils/errors.js";
import { issueJwt, verifyToken, getTokenExpiry } from "../utils/jwt.js";
import { logInfo, logError } from "../utils/logger.js";
import { comparePassword, hashPassword } from "../utils/password.js";

export interface AdminLoginInput {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  admin: AdminUser;
  token: string;
  refreshToken: string;
  permissions: string[];
  expiresIn: number;
}

export interface AdminSessionInput {
  adminUserId: number;
  tokenHash: string;
  refreshTokenHash?: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AdminJWTPayload {
  adminId: number;
  username: string;
  role: AdminRole;
  permissions: string[];
}

export class AdminAuthService {
  private get adminUserRepository() {
    return AppDataSource.getRepository(AdminUser);
  }

  private get adminSessionRepository() {
    return AppDataSource.getRepository(AdminSession);
  }

  private get adminAuditLogRepository() {
    return AppDataSource.getRepository(AdminAuditLog);
  }

  async login(input: AdminLoginInput, ipAddress?: string, userAgent?: string): Promise<AdminLoginResponse> {
    const admin = await this.findAdminByUsername(input.username);
    this.validateAdminStatus(admin);
    await this.verifyPassword(input.password, admin.passwordHash);

    // Update last login
    admin.lastLoginAt = new Date();
    await this.adminUserRepository.save(admin);

    // Generate tokens
    const token = this.generateAdminToken(admin);
    const refreshToken = this.generateRefreshToken(admin);

    // Create session
    const session = await this.createSession({
      adminUserId: admin.id,
      tokenHash: await hashPassword(token),
      refreshTokenHash: refreshToken ? await hashPassword(refreshToken) : undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      ipAddress,
      userAgent,
    });

    // Log successful login
    await this.logAuditAction({
      adminUserId: admin.id,
      action: 'admin_login',
      resourceType: 'admin_user',
      resourceId: admin.id,
      ipAddress,
      userAgent,
    });

    logInfo(`Admin logged in: ${admin.username}`);

    return {
      admin: this.sanitizeAdmin(admin),
      token,
      refreshToken: refreshToken!,
      permissions: admin.permissions,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  async logout(token: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const payload = verifyToken(token) as AdminJWTPayload;
      const admin = await this.adminUserRepository.findOne({
        where: { id: payload.adminId }
      });

      if (admin) {
        // Remove session
        await this.adminSessionRepository.delete({
          adminUserId: admin.id,
        });

        // Log logout
        await this.logAuditAction({
          adminUserId: admin.id,
          action: 'admin_logout',
          resourceType: 'admin_user',
          resourceId: admin.id,
          ipAddress,
          userAgent,
        });

        logInfo(`Admin logged out: ${admin.username}`);
      }
    } catch (error) {
      logError(`Error during admin logout: ${error}`);
    }
  }

  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<AdminLoginResponse> {
    try {
      const payload = verifyToken(refreshToken) as AdminJWTPayload;
      const admin = await this.adminUserRepository.findOne({
        where: { id: payload.adminId, isActive: true }
      });

      if (!admin) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      // Generate new tokens
      const newToken = this.generateAdminToken(admin);
      const newRefreshToken = this.generateRefreshToken(admin);

      // Update session
      const session = await this.adminSessionRepository.findOne({
        where: { adminUserId: admin.id }
      });

      if (session) {
        session.tokenHash = await hashPassword(newToken);
        session.refreshTokenHash = newRefreshToken ? await hashPassword(newRefreshToken) : undefined;
        session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        session.ipAddress = ipAddress;
        session.userAgent = userAgent;
        await this.adminSessionRepository.save(session);
      }

      return {
        admin: this.sanitizeAdmin(admin),
        token: newToken,
        refreshToken: newRefreshToken!,
        permissions: admin.permissions,
        expiresIn: 24 * 60 * 60,
      };
    } catch (error) {
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  async getSession(token: string): Promise<{ admin: AdminUser; permissions: string[] }> {
    const payload = verifyToken(token) as AdminJWTPayload;
    const admin = await this.adminUserRepository.findOne({
      where: { id: payload.adminId, isActive: true }
    });

    if (!admin) {
      throw new UnauthorizedError("Invalid session");
    }

    return {
      admin: this.sanitizeAdmin(admin),
      permissions: admin.permissions,
    };
  }

  async verifyPermissions(token: string, requiredPermissions: string[]): Promise<{ hasAccess: boolean; missingPermissions?: string[] }> {
    const payload = verifyToken(token) as AdminJWTPayload;
    const admin = await this.adminUserRepository.findOne({
      where: { id: payload.adminId, isActive: true }
    });

    if (!admin) {
      return { hasAccess: false };
    }

    const missingPermissions = requiredPermissions.filter(
      permission => !admin.permissions.includes(permission)
    );

    return {
      hasAccess: missingPermissions.length === 0,
      missingPermissions: missingPermissions.length > 0 ? missingPermissions : undefined,
    };
  }

  async createAdmin(adminData: {
    username: string;
    email?: string;
    password: string;
    role?: AdminRole;
    businessName?: string;
    permissions?: string[];
  }): Promise<AdminUser> {
    // Check uniqueness
    const existingAdmin = await this.adminUserRepository.findOne({
      where: [
        { username: adminData.username },
        ...(adminData.email ? [{ email: adminData.email }] : [])
      ].filter(Boolean)
    });

    if (existingAdmin) {
      throw new ConflictError("Admin with this username or email already exists");
    }

    const passwordHash = await hashPassword(adminData.password);

    const admin = this.adminUserRepository.create({
      username: adminData.username,
      email: adminData.email,
      passwordHash,
      role: adminData.role || AdminRole.STAFF,
      businessName: adminData.businessName,
      permissions: adminData.permissions || this.getDefaultPermissions(adminData.role || AdminRole.STAFF),
      isActive: true,
    });

    const savedAdmin = await this.adminUserRepository.save(admin);

    logInfo(`Admin created: ${savedAdmin.username}`);

    return this.sanitizeAdmin(savedAdmin);
  }

  private async findAdminByUsername(username: string): Promise<AdminUser> {
    const admin = await this.adminUserRepository.findOne({
      where: { username }
    });

    if (!admin) {
      throw new UnauthorizedError("Invalid credentials");
    }

    return admin;
  }

  private validateAdminStatus(admin: AdminUser): void {
    if (!admin.isActive) {
      throw new UnauthorizedError("Admin account is disabled");
    }
  }

  private async verifyPassword(password: string, hash: string): Promise<void> {
    const isValid = await comparePassword(password, hash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid credentials");
    }
  }

  private generateAdminToken(admin: AdminUser): string {
    const payload: AdminJWTPayload = {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions,
    };

    return issueJwt(payload, "24h");
  }

  private generateRefreshToken(admin: AdminUser): string {
    const payload: AdminJWTPayload = {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions,
    };

    return issueJwt(payload, "7d");
  }

  private async createSession(sessionData: AdminSessionInput): Promise<AdminSession> {
    const session = this.adminSessionRepository.create(sessionData);
    return await this.adminSessionRepository.save(session);
  }

  private sanitizeAdmin(admin: AdminUser): AdminUser {
    const { passwordHash, ...sanitized } = admin;
    return sanitized as AdminUser;
  }

  private getDefaultPermissions(role: AdminRole): string[] {
    switch (role) {
      case AdminRole.SUPER_ADMIN:
        return [
          'user:read', 'user:update', 'user:delete', 'user:verify', 'user:mute',
          'ads:read', 'ads:moderate', 'ads:delete',
          'support:read', 'support:manage',
          'content:manage',
          'system:config', 'system:reports'
        ];
      case AdminRole.ADMIN:
        return [
          'user:read', 'user:update', 'user:verify', 'user:mute',
          'ads:read', 'ads:moderate', 'ads:delete',
          'support:read', 'support:manage',
          'content:manage',
          'system:reports'
        ];
      case AdminRole.STAFF:
        return [
          'user:read',
          'ads:read', 'ads:moderate',
          'support:read', 'support:manage'
        ];
      case AdminRole.SUPPORT:
        return ['support:read', 'support:manage'];
      default:
        return [];
    }
  }

  private async logAuditAction(data: {
    adminUserId: number;
    action: string;
    resourceType: string;
    resourceId?: number;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const auditLog = this.adminAuditLogRepository.create({
        adminUserId: data.adminUserId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });

      await this.adminAuditLogRepository.save(auditLog);
    } catch (error) {
      logError(`Failed to log audit action: ${error}`);
    }
  }
}
