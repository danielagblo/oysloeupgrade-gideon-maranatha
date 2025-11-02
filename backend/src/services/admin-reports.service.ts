import { AppDataSource } from "../config/database.js";
import { UserReport } from "../entities/UserReport.js";
import { Review } from "../entities/Review.js";
import { NotFoundError } from "../utils/errors.js";

export interface GetReportsOptions {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ResolveReportInput {
  resolution: string;
  notes?: string;
  action?: string;
}

export class AdminReportsService {
  private get userReportRepository() {
    return AppDataSource.getRepository(UserReport);
  }

  private get reviewRepository() {
    return AppDataSource.getRepository(Review);
  }

  async getReports(options: GetReportsOptions = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      dateFrom,
      dateTo,
    } = options;

    const queryBuilder = this.userReportRepository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.reporterUser", "reporter")
      .leftJoinAndSelect("report.reportedUser", "reported")
      .leftJoinAndSelect("report.adminUser", "admin")
      .orderBy("report.createdAt", "DESC");

    if (status) {
      queryBuilder.andWhere("report.status = :status", { status });
    }

    if (type) {
      queryBuilder.andWhere("report.reportType = :type", { type });
    }

    if (dateFrom) {
      queryBuilder.andWhere("report.createdAt >= :dateFrom", { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere("report.createdAt <= :dateTo", { dateTo });
    }

    const [reports, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Calculate stats
    const stats = {
      total: await this.userReportRepository.count(),
      pending: await this.userReportRepository.count({
        where: { status: "pending" },
      }),
      resolved: await this.userReportRepository.count({
        where: { status: "resolved" },
      }),
      byType: {} as Record<string, number>,
    };

    // Get counts by type
    const typeCounts = await this.userReportRepository
      .createQueryBuilder("report")
      .select("report.reportType", "type")
      .addSelect("COUNT(*)", "count")
      .groupBy("report.reportType")
      .getRawMany();

    typeCounts.forEach((item) => {
      stats.byType[item.type] = parseInt(item.count, 10);
    });

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    };
  }

  async getReport(reportId: number) {
    const report = await this.userReportRepository.findOne({
      where: { id: reportId },
      relations: ["reporterUser", "reportedUser", "adminUser"],
    });

    if (!report) {
      throw new NotFoundError("Report not found");
    }

    return report;
  }

  async resolveReport(
    reportId: number,
    input: ResolveReportInput,
    adminUserId: number
  ) {
    const report = await this.userReportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundError("Report not found");
    }

    report.status = "resolved";
    report.resolution = input.resolution;
    report.resolvedAt = new Date();
    report.adminUserId = adminUserId;

    await this.userReportRepository.save(report);

    return report;
  }

  async getFeedback(options: {
    page?: number;
    limit?: number;
    rating?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  } = {}) {
    const {
      page = 1,
      limit = 10,
      rating,
      dateFrom,
      dateTo,
      search,
    } = options;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder("review")
      .leftJoinAndSelect("review.user", "user")
      .leftJoinAndSelect("review.product", "product")
      .orderBy("review.createdAt", "DESC");

    if (rating) {
      queryBuilder.andWhere("review.rating = :rating", { rating });
    }

    if (dateFrom) {
      queryBuilder.andWhere("review.createdAt >= :dateFrom", { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere("review.createdAt <= :dateTo", { dateTo });
    }

    if (search) {
      queryBuilder.andWhere(
        "(review.comment ILIKE :search OR user.name ILIKE :search OR product.name ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    const [feedback, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Calculate stats
    const allReviews = await this.reviewRepository.find();
    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach((review) => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    return {
      feedback,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: allReviews.length,
        averageRating: Math.round(averageRating * 100) / 100,
        distribution,
      },
    };
  }
}


