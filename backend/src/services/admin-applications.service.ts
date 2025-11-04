import { AppDataSource } from '../config/database.js';
import { ApplicationDocument } from '../entities/ApplicationDocument.js';
import { ApplicationReview } from '../entities/ApplicationReview.js';
import { JobApplication } from '../entities/JobApplication.js';
import { NotFoundError } from '../utils/errors.js';

export interface GetApplicationsOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  timePeriod?: string;
  sortBy?: string;
  sortOrder?: string;
}

export class AdminApplicationsService {
  private get applicationRepository() {
    return AppDataSource.getRepository(JobApplication);
  }

  private get documentRepository() {
    return AppDataSource.getRepository(ApplicationDocument);
  }

  private get reviewRepository() {
    return AppDataSource.getRepository(ApplicationReview);
  }

  async getApplications(options: GetApplicationsOptions = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      timePeriod,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const queryBuilder = this.applicationRepository
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.user', 'user')
      .leftJoinAndSelect('app.reviewer', 'reviewer')
      .orderBy(`app.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    if (status) {
      queryBuilder.andWhere('app.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(app.position ILIKE :search OR user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (timePeriod) {
      const now = new Date();
      let dateFrom: Date;

      switch (timePeriod) {
        case 'today':
          dateFrom = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          dateFrom = new Date(now.setDate(now.getDate() - 1));
          dateFrom.setHours(0, 0, 0, 0);
          break;
        case '7days':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '1month':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(0);
      }

      queryBuilder.andWhere('app.createdAt >= :dateFrom', { dateFrom });
    }

    const [applications, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getApplication(applicationId: number) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['user', 'reviewer'],
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const documents = await this.documentRepository.find({
      where: { applicationId },
      order: { createdAt: 'ASC' },
    });

    const reviewHistory = await this.reviewRepository.find({
      where: { applicationId },
      relations: ['adminUser'],
      order: { createdAt: 'DESC' },
    });

    return {
      ...application,
      documents,
      reviewHistory,
    };
  }

  async downloadDocument(applicationId: number, documentType: 'cv' | 'cover_letter' | 'portfolio') {
    const document = await this.documentRepository.findOne({
      where: { applicationId, documentType },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Generate signed URL (implementation depends on storage solution)
    // For now, return the file URL directly
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    return {
      downloadUrl: document.fileUrl,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async updateStatus(
    applicationId: number,
    status: string,
    adminUserId: number,
    notes?: string,
    feedback?: string
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const oldStatus = application.status;
    application.status = status as any;
    application.notes = notes;
    application.feedback = feedback;
    application.reviewedBy = adminUserId;
    application.reviewedAt = new Date();

    await this.applicationRepository.save(application);

    // Create review history entry
    const review = this.reviewRepository.create({
      applicationId,
      adminUserId,
      action: `status_changed_to_${status}`,
      notes,
      feedback,
      oldStatus,
      newStatus: status,
    });

    await this.reviewRepository.save(review);

    return application;
  }
}

