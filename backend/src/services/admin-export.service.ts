import { AppDataSource } from "../config/database.js";
import { Product } from "../entities/Product.js";
import { Subscription } from "../entities/Subscription.js";
import { SupportCase } from "../entities/SupportCase.js";
import { User } from "../entities/User.js";
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

  private get subscriptionRepository() {
    return AppDataSource.getRepository(Subscription);
  }

  async exportUsers(options: ExportOptions) {
    const { format, filters, fields } = options;

    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .where("user.deleted = :deleted", { deleted: false });

    if (filters?.search) {
      queryBuilder.andWhere(
        "(user.email ILIKE :search OR user.name ILIKE :search OR user.phone ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    if (filters?.status) {
      queryBuilder.andWhere("user.verificationStatus = :status", {
        status: filters.status,
      });
    }

    if (filters?.level) {
      queryBuilder.andWhere("user.level = :level", { level: filters.level });
    }

    if (filters?.role) {
      queryBuilder.andWhere("user.level = :role", { role: filters.role });
    }

    if (filters?.dateRange) {
      queryBuilder.andWhere("user.createdAt >= :from", {
        from: filters.dateRange.from,
      });
      queryBuilder.andWhere("user.createdAt <= :to", {
        to: filters.dateRange.to,
      });
    }

    const users = await queryBuilder.getMany();

    const csvData = this.generateUsersCSV(users);

    return {
      data: csvData,
      recordCount: users.length,
      contentType: "text/csv",
      filename: `users_export_${Date.now()}.csv`,
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

    const csvData = this.generateAdsCSV(ads);

    return {
      data: csvData,
      recordCount: ads.length,
      contentType: "text/csv",
      filename: `ads_export_${Date.now()}.csv`,
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

    const csvData = this.generateSupportCSV(cases);

    return {
      data: csvData,
      recordCount: cases.length,
      contentType: "text/csv",
      filename: `support_export_${Date.now()}.csv`,
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

    const csvData = this.generateReportsCSV(reports);

    return {
      data: csvData,
      recordCount: reports.length,
      contentType: "text/csv",
      filename: `reports_export_${Date.now()}.csv`,
    };
  }

  private generateUsersCSV(users: User[]): string {
    const headers = [
      "ID",
      "Email",
      "Name",
      "Phone",
      "Level",
      "Verification Status",
      "Active",
      "Created At",
    ];
    const rows = users.map((user) => [
      user.id,
      user.email,
      user.name,
      user.phone || "",
      user.level,
      user.verificationStatus,
      user.isActive ? "Yes" : "No",
      user.createdAt.toISOString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }

  private generateAdsCSV(products: Product[]): string {
    const headers = [
      "ID",
      "PID",
      "Name",
      "Price",
      "Status",
      "User Email",
      "User Name",
      "Created At",
    ];
    const rows = products.map((product) => [
      product.id,
      product.pid || "",
      product.name,
      product.price.toString(),
      product.status,
      product.user?.email || "",
      product.user?.name || "",
      product.createdAt.toISOString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }

  private generateSupportCSV(cases: SupportCase[]): string {
    const headers = [
      "ID",
      "Subject",
      "Status",
      "Priority",
      "User Email",
      "User Name",
      "Created At",
    ];
    const rows = cases.map((case_) => [
      case_.id,
      case_.subject,
      case_.status,
      case_.priority,
      case_.user?.email || "",
      case_.user?.name || "",
      case_.createdAt.toISOString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }

  async exportSubscriptions(options: ExportOptions) {
    const { format, filters } = options;

    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder("subscription")
      .leftJoinAndSelect("subscription.user", "user");

    if (filters?.planType) {
      queryBuilder.andWhere("subscription.planType = :planType", {
        planType: filters.planType,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere("subscription.status = :status", {
        status: filters.status,
      });
    }

    if (filters?.userId) {
      queryBuilder.andWhere("subscription.userId = :userId", {
        userId: filters.userId,
      });
    }

    if (filters?.dateRange) {
      queryBuilder.andWhere("subscription.createdAt >= :from", {
        from: filters.dateRange.from,
      });
      queryBuilder.andWhere("subscription.createdAt <= :to", {
        to: filters.dateRange.to,
      });
    }

    const subscriptions = await queryBuilder.getMany();

    const csvData = this.generateSubscriptionsCSV(subscriptions);

    return {
      data: csvData,
      recordCount: subscriptions.length,
      contentType: "text/csv",
      filename: `subscriptions_export_${Date.now()}.csv`,
    };
  }

  private generateReportsCSV(reports: UserReport[]): string {
    const headers = [
      "ID",
      "Reason",
      "Description",
      "Status",
      "Reporter Email",
      "Reported Email",
      "Created At",
    ];
    const rows = reports.map((report) => [
      report.id,
      report.reason,
      report.description || "",
      report.status,
      report.reporterUser?.email || "",
      report.reportedUser?.email || "",
      report.createdAt.toISOString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }

  private generateSubscriptionsCSV(subscriptions: Subscription[]): string {
    const headers = [
      "ID",
      "User Email",
      "User Name",
      "Plan Type",
      "Status",
      "Price",
      "Start Date",
      "End Date",
      "Payment Method",
      "Created At",
    ];
    const rows = subscriptions.map((subscription) => [
      subscription.id,
      subscription.user?.email || "",
      subscription.user?.name || "",
      subscription.planType,
      subscription.status,
      subscription.price.toString(),
      subscription.startDate.toISOString(),
      subscription.endDate.toISOString(),
      subscription.paymentMethod || "",
      subscription.createdAt.toISOString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }
}
