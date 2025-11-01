import { AppDataSource } from "../config/database.js";
import { Alert } from "../entities/Alert.js";
import { Coupon } from "../entities/Coupon.js";
import { NotFoundError } from "../utils/errors.js";
import { v4 as uuidv4 } from "uuid";

export interface SendAlertInput {
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  recipientIds: string[];
  linkedAdIds?: string[];
  couponData?: {
    amount: number;
    code?: string;
    expiresAt?: string;
  };
  sendImmediately?: boolean;
  scheduledFor?: string;
  createdBy: number;
}

export interface CreateCouponInput {
  amount: number;
  code?: string;
  expiresAt?: string;
  usageLimit?: number;
  recipientIds: string[];
  message?: string;
  linkedAdIds?: string[];
  createdBy: number;
}

export class AdminAlertsService {
  private get alertRepository() {
    return AppDataSource.getRepository(Alert);
  }

  private get couponRepository() {
    return AppDataSource.getRepository(Coupon);
  }

  async sendAlert(input: SendAlertInput) {
    let coupon: Coupon | undefined;

    // Create coupon if couponData provided
    if (input.couponData) {
      const couponCode =
        input.couponData.code ||
        `ADMIN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      coupon = this.couponRepository.create({
        code: couponCode,
        discountType: "fixed",
        discountValue: input.couponData.amount,
        validUntil: input.couponData.expiresAt
          ? new Date(input.couponData.expiresAt)
          : undefined,
        isActive: true,
        createdBy: input.createdBy.toString(),
      });

      coupon = await this.couponRepository.save(coupon);
    }

    // Create alert
    const alert = this.alertRepository.create({
      title: input.title,
      message: input.message,
      type: input.type,
      recipientIds: input.recipientIds,
      linkedAdIds: input.linkedAdIds,
      couponId: coupon?.id,
      createdBy: input.createdBy,
      sendImmediately: input.sendImmediately ?? true,
      scheduledFor: input.scheduledFor
        ? new Date(input.scheduledFor)
        : undefined,
      status: "active",
    });

    const savedAlert = await this.alertRepository.save(alert);

    return {
      alert: savedAlert,
      coupon,
      recipients: input.recipientIds.length,
    };
  }

  async createCoupon(input: CreateCouponInput) {
    const couponCode =
      input.code ||
      `ADMIN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const coupon = this.couponRepository.create({
      code: couponCode,
      discountType: "fixed",
      discountValue: input.amount,
      validUntil: input.expiresAt ? new Date(input.expiresAt) : undefined,
      usageLimit: input.usageLimit,
      isActive: true,
      createdBy: input.createdBy.toString(),
    });

    const savedCoupon = await this.couponRepository.save(coupon);

    // Create alert for coupon
    const alert = this.alertRepository.create({
      title: "Special Offer",
      message: input.message || `You have received a coupon: ${couponCode}`,
      type: "success",
      recipientIds: input.recipientIds,
      linkedAdIds: input.linkedAdIds,
      couponId: savedCoupon.id,
      createdBy: input.createdBy,
      sendImmediately: true,
      status: "active",
    });

    const savedAlert = await this.alertRepository.save(alert);

    return {
      coupon: savedCoupon,
      alert: savedAlert,
    };
  }

  async getAlertsHistory(options: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      dateFrom,
      dateTo,
    } = options;

    const queryBuilder = this.alertRepository
      .createQueryBuilder("alert")
      .leftJoinAndSelect("alert.creator", "creator")
      .leftJoinAndSelect("alert.coupon", "coupon")
      .orderBy("alert.createdAt", "DESC");

    if (type) {
      queryBuilder.andWhere("alert.type = :type", { type });
    }

    if (status) {
      queryBuilder.andWhere("alert.status = :status", { status });
    }

    if (dateFrom) {
      queryBuilder.andWhere("alert.createdAt >= :dateFrom", { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere("alert.createdAt <= :dateTo", { dateTo });
    }

    const [alerts, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Calculate stats
    const allAlerts = await this.alertRepository.find();
    const stats = {
      total: allAlerts.length,
      active: allAlerts.filter((a) => a.status === "active").length,
      delivered: allAlerts.reduce((sum, a) => sum + a.deliveredCount, 0),
      clicked: allAlerts.reduce((sum, a) => sum + a.clickedCount, 0),
    };

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    };
  }
}

