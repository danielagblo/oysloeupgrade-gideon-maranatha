import { AppDataSource } from '../config/database.js';
import { AdminUser } from '../entities/AdminUser.js';
import { SupportCase } from '../entities/SupportCase.js';
import { SupportCaseAssignment } from '../entities/SupportCaseAssignment.js';
import { SupportMessage } from '../entities/SupportMessage.js';
import { User } from '../entities/User.js';
import { NotFoundError } from '../utils/errors.js';

export interface GetCasesOptions {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assignedTo?: number;
  userId?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface SendMessageInput {
  caseId: number;
  adminUserId: number;
  content: string;
  messageType?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export class AdminSupportService {
  private get supportCaseRepository() {
    return AppDataSource.getRepository(SupportCase);
  }

  private get supportMessageRepository() {
    return AppDataSource.getRepository(SupportMessage);
  }

  private get supportCaseAssignmentRepository() {
    return AppDataSource.getRepository(SupportCaseAssignment);
  }

  private get userRepository() {
    return AppDataSource.getRepository(User);
  }

  async getCases(options: GetCasesOptions = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedTo,
      userId,
      category,
      dateFrom,
      dateTo,
      search,
    } = options;

    const queryBuilder = this.supportCaseRepository
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.user', 'user')
      .leftJoinAndSelect('case.assignedAdmin', 'assignedAdmin')
      .orderBy('case.lastMessageAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('case.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('case.priority = :priority', { priority });
    }

    if (assignedTo) {
      queryBuilder.andWhere('case.assignedAdminId = :assignedTo', {
        assignedTo,
      });
    }

    if (userId) {
      queryBuilder.andWhere('case.userId = :userId', { userId });
    }

    if (category) {
      queryBuilder.andWhere('case.category = :category', { category });
    }

    if (dateFrom) {
      queryBuilder.andWhere('case.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('case.createdAt <= :dateTo', { dateTo });
    }

    if (search) {
      queryBuilder.andWhere(
        '(case.subject ILIKE :search OR user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [cases, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      cases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCase(caseId: number) {
    const supportCase = await this.supportCaseRepository.findOne({
      where: { id: caseId },
      relations: ['user', 'assignedAdmin'],
    });

    if (!supportCase) {
      throw new NotFoundError('Support case not found');
    }

    // Get messages
    const messages = await this.supportMessageRepository.find({
      where: { caseId },
      order: { createdAt: 'ASC' },
    });

    // Get assignment history
    const assignments = await this.supportCaseAssignmentRepository.find({
      where: { caseId },
      relations: ['adminUser'],
      order: { assignedAt: 'DESC' },
    });

    return {
      ...supportCase,
      messages,
      assignments,
    };
  }

  async sendMessage(input: SendMessageInput) {
    const {
      caseId,
      adminUserId,
      content,
      messageType = 'text',
      fileUrl,
      fileName,
      fileSize,
    } = input;

    // Verify case exists
    const supportCase = await this.supportCaseRepository.findOne({
      where: { id: caseId },
    });

    if (!supportCase) {
      throw new NotFoundError('Support case not found');
    }

    // Create message
    const message = this.supportMessageRepository.create({
      caseId,
      senderId: adminUserId.toString(),
      senderType: 'admin',
      messageType,
      content,
      fileUrl,
      fileName,
      fileSize,
      isRead: false,
    });

    const savedMessage = await this.supportMessageRepository.save(message);

    // Update case last message time
    supportCase.lastMessageAt = new Date();
    await this.supportCaseRepository.save(supportCase);

    return savedMessage;
  }

  async updateStatus(caseId: number, status: string, notes?: string) {
    const supportCase = await this.supportCaseRepository.findOne({
      where: { id: caseId },
    });

    if (!supportCase) {
      throw new NotFoundError('Support case not found');
    }

    supportCase.status = status;
    if (status === 'resolved' || status === 'closed') {
      supportCase.resolvedAt = new Date();
    }
    await this.supportCaseRepository.save(supportCase);

    return supportCase;
  }

  async assignCase(caseId: number, adminUserId: number | null, notes?: string) {
    const supportCase = await this.supportCaseRepository.findOne({
      where: { id: caseId },
    });

    if (!supportCase) {
      throw new NotFoundError('Support case not found');
    }

    // Unassign previous assignment if exists
    const previousAssignment = await this.supportCaseAssignmentRepository.findOne({
      where: { caseId, unassignedAt: null },
    });

    if (previousAssignment) {
      previousAssignment.unassignedAt = new Date();
      await this.supportCaseAssignmentRepository.save(previousAssignment);
    }

    // Update case assignment
    supportCase.assignedAdminId = adminUserId || undefined;
    await this.supportCaseRepository.save(supportCase);

    // Create new assignment if adminUserId provided
    if (adminUserId) {
      const assignment = this.supportCaseAssignmentRepository.create({
        caseId,
        adminUserId,
        notes,
      });
      await this.supportCaseAssignmentRepository.save(assignment);
      return assignment;
    }

    return null;
  }

  async getOnlineUsers() {
    // This would typically integrate with WebSocket or Redis to track online users
    // For now, return users active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const onlineUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.lastLogin >= :fiveMinutesAgo', { fiveMinutesAgo })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .select(['user.id', 'user.name', 'user.avatarUrl', 'user.lastLogin'])
      .getMany();

    // Get active cases count for each user
    const usersWithCases = await Promise.all(
      onlineUsers.map(async (user) => {
        const activeCases = await this.supportCaseRepository.count({
          where: {
            userId: user.id,
            status: 'open',
          },
        });

        return {
          userId: user.id,
          name: user.name,
          avatar: user.avatarUrl,
          lastSeen: user.lastLogin?.toISOString() || new Date().toISOString(),
          activeCases,
        };
      })
    );

    return usersWithCases;
  }
}

