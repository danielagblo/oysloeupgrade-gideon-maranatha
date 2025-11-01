import { AppDataSource } from "../config/database.js";
import { User } from "../entities/User.js";
import { Product } from "../entities/Product.js";
import { SupportCase } from "../entities/SupportCase.js";
import { UserReport } from "../entities/UserReport.js";
import { NotFoundError } from "../utils/errors.js";

export interface ExportOptions {
  format: "csv" | "xlsx" | "pdf";
  filters?: any;
  fields?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
}

export class AdminExportService {
  private get userRepository() {
    return AppDataSource.getRepository(User);
  }

  private get productRepository() {
    return AppDataSource.getRepository(Product);
  }

  private get supportCaseRepository() {
    return AppDataSource.getRepository(SupportCase);
  }

  private get userReportRepository() {
    return AppDataSource.getRepository(UserReport);
  }

  async exportUsers(options: ExportOptions) {
    const { format, filters, fields } = options;

    // Build query based on filters (matching getUsers logic)
    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .where("user.deleted = :deleted", { deleted: false });

    // Apply search filter
    if (filters?.search) {
      queryBuilder.andWhere(
        "(user.email ILIKE :search OR user.name ILIKE :search OR user.phone ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    // Apply status filter
    if (filters?.status) {
      queryBuilder.andWhere("user.verificationStatus = :status", {
        status: filters.status,
      });
    }

    // Apply level filter
    if (filters?.level) {
      queryBuilder.andWhere("user.level = :level", { level: filters.level });
    }

    // Apply role filter (using level as role for now)
    if (filters?.role) {
      queryBuilder.andWhere("user.level = :role", { role: filters.role });
    }

    // Apply date range filter
    if (filters?.dateRange) {
      queryBuilder.andWhere("user.createdAt >= :from", {
        from: filters.dateRange.from,
      });
      queryBuilder.andWhere("user.createdAt <= :to", {
        to: filters.dateRange.to,
      });
    }

    const users = await queryBuilder.getMany();

    // Generate export file (simplified - actual implementation would use library like exceljs or pdfkit)
    const fileName = `users_export_${Date.now()}.${format}`;
    const downloadUrl = `/exports/${fileName}`;

    // In a real implementation, you would:
    // 1. Generate the file based on format
    // 2. Upload to cloud storage (S3, Cloudinary, etc.)
    // 3. Return signed URL with expiration

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      fileSize: 0, // Would be calculated from actual file
      recordCount: users.length,
    };
  }

  async exportAds(options: ExportOptions) {
    const { format, filters, fields } = options;

    const queryBuilder = this.productRepository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.user", "user")
      .where("product.deleted = :deleted", { deleted: false });

    if (filters?.dateRange) {
      queryBuilder.andWhere("product.createdAt >= :from", {
        from: filters.dateRange.from,
      });
      queryBuilder.andWhere("product.createdAt <= :to", {
        to: filters.dateRange.to,
      });
    }

    const ads = await queryBuilder.getMany();

    const fileName = `ads_export_${Date.now()}.${format}`;
    const downloadUrl = `/exports/${fileName}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      fileSize: 0,
      recordCount: ads.length,
    };
  }

  async exportSupport(options: ExportOptions) {
    const { format, filters } = options;

    const queryBuilder = this.supportCaseRepository
      .createQueryBuilder("case")
      .leftJoinAndSelect("case.user", "user");

    if (filters?.dateRange) {
      queryBuilder.andWhere("case.createdAt >= :from", {
        from: filters.dateRange.from,
      });
      queryBuilder.andWhere("case.createdAt <= :to", {
        to: filters.dateRange.to,
      });
    }

    const cases = await queryBuilder.getMany();

    const fileName = `support_export_${Date.now()}.${format}`;
    const downloadUrl = `/exports/${fileName}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      fileSize: 0,
      recordCount: cases.length,
    };
  }

  async exportReports(options: ExportOptions) {
    const { format, filters } = options;

    const queryBuilder = this.userReportRepository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.reporterUser", "reporter")
      .leftJoinAndSelect("report.reportedUser", "reported");

    if (filters?.dateRange) {
      queryBuilder.andWhere("report.createdAt >= :from", {
        from: filters.dateRange.from,
      });
      queryBuilder.andWhere("report.createdAt <= :to", {
        to: filters.dateRange.to,
      });
    }

    const reports = await queryBuilder.getMany();

    const fileName = `reports_export_${Date.now()}.${format}`;
    const downloadUrl = `/exports/${fileName}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      fileSize: 0,
      recordCount: reports.length,
    };
  }
}

