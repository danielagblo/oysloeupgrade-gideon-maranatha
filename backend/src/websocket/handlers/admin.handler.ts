import type { Server as SocketIOServer } from 'socket.io';
import { AppDataSource } from '../../config/database.js';
import type { AdminUser } from '../../entities/AdminUser.js';
import { Product } from '../../entities/Product.js';
import { SupportCase } from '../../entities/SupportCase.js';
import { User } from '../../entities/User.js';
import { UserReport } from '../../entities/UserReport.js';
import { AdminAuthService } from '../../services/admin-auth.service.js';
import { extractTokenFromHeader } from '../../utils/jwt.js';
import { logError, logInfo } from '../../utils/logger.js';

interface AdminSocket extends any {
  adminId?: number;
  admin?: AdminUser;
}

export class AdminHandler {
  private adminAuthService = new AdminAuthService();
  private io?: SocketIOServer;

  initializeHandlers(io: SocketIOServer): void {
    this.io = io;

    io.of('/admin').on('connection', async (socket: AdminSocket) => {
      try {
        // Authenticate admin
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
          socket.disconnect();
          return;
        }

        const session = await this.adminAuthService.getSession(token);
        socket.adminId = session.admin.id;
        socket.admin = session.admin;

        logInfo(`Admin ${session.admin.username} connected to WebSocket`);

        // Join admin room
        socket.join('admin_dashboard');
        socket.join(`admin_${session.admin.id}`);

        // Register event handlers
        this.registerSupportHandlers(socket);
        this.registerDashboardHandlers(socket);

        socket.on('disconnect', () => {
          logInfo(`Admin ${session.admin.username} disconnected`);
        });
      } catch (error) {
        logError(`Admin WebSocket connection error: ${error}`);
        socket.disconnect();
      }
    });
  }

  private registerSupportHandlers(socket: AdminSocket): void {
    // Admin joins support case
    socket.on('admin-join-case', async (data: { caseId: number }) => {
      try {
        const supportCaseRepository = AppDataSource.getRepository(SupportCase);
        const case_ = await supportCaseRepository.findOne({
          where: { id: data.caseId },
          relations: ['user'],
        });

        if (!case_) {
          socket.emit('error', { message: 'Support case not found' });
          return;
        }

        socket.join(`support_case_${data.caseId}`);
        socket.emit('case-joined', { caseId: data.caseId });
      } catch (error) {
        logError(`Error joining support case: ${error}`);
        socket.emit('error', { message: 'Failed to join case' });
      }
    });

    // Admin sends message in support case
    socket.on('admin-send-message', async (data: { caseId: number; message: string }) => {
      try {
        // This would typically call the support service
        socket.to(`support_case_${data.caseId}`).emit('support-message', {
          caseId: data.caseId,
          message: data.message,
          senderType: 'admin',
          senderId: socket.adminId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logError(`Error sending admin message: ${error}`);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
  }

  private registerDashboardHandlers(socket: AdminSocket): void {
    // Request dashboard update
    socket.on('request-dashboard-update', async () => {
      try {
        await this.sendDashboardUpdate(socket);
      } catch (error) {
        logError(`Error sending dashboard update: ${error}`);
      }
    });
  }

  private async sendDashboardUpdate(socket: AdminSocket): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const productRepository = AppDataSource.getRepository(Product);
      const supportCaseRepository = AppDataSource.getRepository(SupportCase);
      const userReportRepository = AppDataSource.getRepository(UserReport);

      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const newUsersToday = await userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :dayAgo', { dayAgo })
        .andWhere('user.deleted = :deleted', { deleted: false })
        .getCount();

      const pendingAds = await productRepository.count({
        where: { moderationStatus: 'pending', deleted: false },
      });

      const openCases = await supportCaseRepository.count({
        where: { status: 'open' },
      });

      const pendingReports = await userReportRepository.count({
        where: { status: 'pending' },
      });

      socket.emit('dashboard-update', {
        users: { newToday: newUsersToday },
        ads: { pending: pendingAds },
        support: { openCases },
        reports: { pending: pendingReports },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logError(`Error sending dashboard update: ${error}`);
    }
  }

  // Public methods to emit admin notifications
  async notifyNewAdPending(ad: Product): Promise<void> {
    if (!this.io) return;
    this.io
      .of('/admin')
      .to('admin_dashboard')
      .emit('new-ad-pending', {
        ad: {
          id: ad.id,
          name: ad.name,
          userId: ad.userId,
          createdAt: ad.createdAt.toISOString(),
        },
      });
  }

  async notifyNewSupportCase(case_: SupportCase): Promise<void> {
    if (!this.io) return;
    this.io
      .of('/admin')
      .to('admin_dashboard')
      .emit('new-support-case', {
        case: {
          id: case_.id,
          subject: case_.subject,
          userId: case_.userId,
          priority: case_.priority,
          createdAt: case_.createdAt.toISOString(),
        },
      });
  }

  async notifyNewReport(report: UserReport): Promise<void> {
    if (!this.io) return;
    this.io
      .of('/admin')
      .to('admin_dashboard')
      .emit('new-report', {
        report: {
          id: report.id,
          reportType: report.reportType,
          reporterUserId: report.reporterUserId,
          reportedUserId: report.reportedUserId,
          createdAt: report.createdAt.toISOString(),
        },
      });
  }

  async notifyUserVerificationRequest(user: User): Promise<void> {
    if (!this.io) return;
    this.io
      .of('/admin')
      .to('admin_dashboard')
      .emit('user-verification-request', {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          verificationStatus: user.verificationStatus,
          createdAt: user.createdAt.toISOString(),
        },
      });
  }

  async notifyUserOnline(userId: string): Promise<void> {
    if (!this.io) return;
    this.io.of('/admin').to('admin_dashboard').emit('user-online', { userId });
  }

  async notifyUserOffline(userId: string): Promise<void> {
    if (!this.io) return;
    this.io.of('/admin').to('admin_dashboard').emit('user-offline', { userId });
  }
}

