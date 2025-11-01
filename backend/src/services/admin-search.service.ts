import { AppDataSource } from "../config/database.js";
import { User } from "../entities/User.js";
import { Product } from "../entities/Product.js";
import { SupportCase } from "../entities/SupportCase.js";
import { JobApplication } from "../entities/JobApplication.js";

export interface GlobalSearchOptions {
  query: string;
  types?: ("users" | "ads" | "support" | "applications")[];
  limit?: number;
  page?: number;
}

export interface AdvancedFilter {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "contains"
    | "regex";
  value: any;
}

export class AdminSearchService {
  private get userRepository() {
    return AppDataSource.getRepository(User);
  }

  private get productRepository() {
    return AppDataSource.getRepository(Product);
  }

  private get supportCaseRepository() {
    return AppDataSource.getRepository(SupportCase);
  }

  private get applicationRepository() {
    return AppDataSource.getRepository(JobApplication);
  }

  async globalSearch(options: GlobalSearchOptions) {
    const {
      query,
      types = ["users", "ads", "support", "applications"],
      limit = 20,
      page = 1,
    } = options;

    const searchTerm = `%${query}%`;
    const results: {
      users: any[];
      ads: any[];
      supportCases: any[];
      applications: any[];
    } = {
      users: [],
      ads: [],
      supportCases: [],
      applications: [],
    };

    let total = 0;

    if (types.includes("users")) {
      const users = await this.userRepository
        .createQueryBuilder("user")
        .where(
          "(user.name ILIKE :query OR user.email ILIKE :query OR user.phone ILIKE :query)",
          { query: searchTerm }
        )
        .andWhere("user.deleted = :deleted", { deleted: false })
        .take(limit)
        .getMany();
      results.users = users;
      total += users.length;
    }

    if (types.includes("ads")) {
      const ads = await this.productRepository
        .createQueryBuilder("product")
        .leftJoinAndSelect("product.user", "user")
        .where(
          "(product.name ILIKE :query OR product.description ILIKE :query)",
          { query: searchTerm }
        )
        .andWhere("product.deleted = :deleted", { deleted: false })
        .take(limit)
        .getMany();
      results.ads = ads;
      total += ads.length;
    }

    if (types.includes("support")) {
      const cases = await this.supportCaseRepository
        .createQueryBuilder("case")
        .leftJoinAndSelect("case.user", "user")
        .where("case.subject ILIKE :query", { query: searchTerm })
        .take(limit)
        .getMany();
      results.supportCases = cases;
      total += cases.length;
    }

    if (types.includes("applications")) {
      const applications = await this.applicationRepository
        .createQueryBuilder("app")
        .leftJoinAndSelect("app.user", "user")
        .where("app.position ILIKE :query", { query: searchTerm })
        .take(limit)
        .getMany();
      results.applications = applications;
      total += applications.length;
    }

    return {
      results,
      total,
      query,
    };
  }

  async advancedFilter(
    filters: AdvancedFilter[],
    sort?: { field: string; order: "asc" | "desc" }[],
    page: number = 1,
    limit: number = 10
  ) {
    // This is a simplified implementation
    // A full implementation would need to handle different entity types
    // and apply filters dynamically based on field names

    const queryBuilder = this.userRepository.createQueryBuilder("user");

    filters.forEach((filter) => {
      const { field, operator, value } = filter;

      switch (operator) {
        case "eq":
          queryBuilder.andWhere(`user.${field} = :${field}`, {
            [field]: value,
          });
          break;
        case "ne":
          queryBuilder.andWhere(`user.${field} != :${field}`, {
            [field]: value,
          });
          break;
        case "gt":
          queryBuilder.andWhere(`user.${field} > :${field}`, {
            [field]: value,
          });
          break;
        case "gte":
          queryBuilder.andWhere(`user.${field} >= :${field}`, {
            [field]: value,
          });
          break;
        case "lt":
          queryBuilder.andWhere(`user.${field} < :${field}`, {
            [field]: value,
          });
          break;
        case "lte":
          queryBuilder.andWhere(`user.${field} <= :${field}`, {
            [field]: value,
          });
          break;
        case "in":
          queryBuilder.andWhere(`user.${field} IN (:...${field})`, {
            [field]: Array.isArray(value) ? value : [value],
          });
          break;
        case "contains":
          queryBuilder.andWhere(`user.${field} ILIKE :${field}`, {
            [field]: `%${value}%`,
          });
          break;
      }
    });

    if (sort && sort.length > 0) {
      sort.forEach((s, index) => {
        if (index === 0) {
          queryBuilder.orderBy(`user.${s.field}`, s.order.toUpperCase() as "ASC" | "DESC");
        } else {
          queryBuilder.addOrderBy(`user.${s.field}`, s.order.toUpperCase() as "ASC" | "DESC");
        }
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      filters,
      appliedFilters: filters.length,
    };
  }
}

