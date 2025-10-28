import type { Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { User } from "../entities/User.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { logError, logInfo } from "../utils/logger.js";
import { comparePassword, hashPassword } from "../utils/password.js";

export class UserController {
  private get userRepository() {
    return AppDataSource.getRepository(User);
  }

  async getProfile(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("User not authenticated");
      }

      const user = await this.userRepository.findOne({
        where: { id: req.user.id },
        relations: ["wallet"],
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      const nameParts = user.name?.split(" ") || [];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName,
            lastName,
            name: user.name,
            address: user.address,
            avatar: user.avatarUrl,
            referralCode: user.referralCode,
            referralPoints: user.referralPoints,
            level: user.level,
            isActive: user.isActive,
            phoneVerified: user.phoneVerified,
            emailVerified: user.emailVerified,
            preferredNotificationEmail: user.preferredNotificationEmail,
            preferredNotificationPhone: user.preferredNotificationPhone,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
          },
          walletBalance: user.wallet?.balance || 0,
        },
      });
    } catch (error) {
      logError("Error getting user profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getPreferences(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("User not authenticated");
      }

      const user = await this.userRepository.findOne({
        where: { id: req.user.id },
        select: [
          "id",
          "email",
          "phone",
          "name",
          "address",
          "avatarUrl",
          "preferredNotificationEmail",
          "preferredNotificationPhone",
        ],
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      res.json({
        success: true,
        data: {
          preferences: {
            preferredNotificationEmail: user.preferredNotificationEmail,
            preferredNotificationPhone: user.preferredNotificationPhone,
          },
        },
      });
    } catch (error) {
      logError("Error getting user preferences:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user preferences",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updatePreferences(req: Request, res: Response) {
    try {
      const {
        email,
        phone,
        name,
        address,
        avatar,
        preferredNotificationEmail,
        preferredNotificationPhone,
      } = req.body;

      if (!req.user?.id) {
        throw new BadRequestError("User not authenticated");
      }

      const user = await this.userRepository.findOne({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (email !== undefined) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (name !== undefined) user.name = name;
      if (address !== undefined) user.address = address;
      if (avatar !== undefined) user.avatarUrl = avatar;
      if (preferredNotificationEmail !== undefined) {
        user.preferredNotificationEmail = preferredNotificationEmail;
      }
      if (preferredNotificationPhone !== undefined) {
        user.preferredNotificationPhone = preferredNotificationPhone;
      }

      await this.userRepository.save(user);

      logInfo(`User ${user.id} updated preferences`);

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          address: user.address,
          avatar: user.avatarUrl,
          preferredNotificationEmail: user.preferredNotificationEmail,
          preferredNotificationPhone: user.preferredNotificationPhone,
        },
      });
    } catch (error) {
      logError("Error updating user preferences:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update user preferences",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const {
        firstName,
        lastName,
        name,
        phone,
        address,
        preferredNotificationEmail,
        preferredNotificationPhone,
      } = req.body;

      if (!req.user?.id) {
        throw new BadRequestError("User not authenticated");
      }

      const user = await this.userRepository.findOne({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (firstName !== undefined || lastName !== undefined) {
        const nameParts = user.name?.split(" ") || [];
        const firstPart =
          firstName !== undefined ? firstName : nameParts[0] || "";
        const lastPart =
          lastName !== undefined
            ? lastName
            : nameParts.slice(1).join(" ") || "";
        const fullName = `${firstPart} ${lastPart}`.trim();
        if (!fullName) {
          throw new BadRequestError("Name cannot be empty");
        }
        user.name = fullName;
      } else if (name !== undefined) {
        if (!name.trim()) {
          throw new BadRequestError("Name cannot be empty");
        }
        user.name = name;
      }

      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
      if (preferredNotificationEmail !== undefined) {
        user.preferredNotificationEmail = preferredNotificationEmail;
      }
      if (preferredNotificationPhone !== undefined) {
        user.preferredNotificationPhone = preferredNotificationPhone;
      }

      await this.userRepository.save(user);

      logInfo(`User ${user.id} updated profile`);

      const nameParts = user.name?.split(" ") || [];
      const firstNamePart = nameParts[0] || "";
      const lastNamePart = nameParts.slice(1).join(" ") || "";

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: {
            id: user.id,
            firstName: firstNamePart,
            lastName: lastNamePart,
            name: user.name,
            address: user.address,
            preferredNotificationEmail: user.preferredNotificationEmail,
            preferredNotificationPhone: user.preferredNotificationPhone,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      logError("Error updating user profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new BadRequestError(
          "Current password and new password are required"
        );
      }

      if (newPassword.length < 8) {
        throw new BadRequestError(
          "New password must be at least 8 characters long"
        );
      }

      if (!req.user?.id) {
        throw new BadRequestError("User not authenticated");
      }

      const user = await this.userRepository.findOne({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (!user.passwordHash) {
        throw new BadRequestError("Password not set for this account");
      }

      const isCurrentPasswordValid = await comparePassword(
        currentPassword,
        user.passwordHash
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestError("Current password is incorrect");
      }

      const newPasswordHash = await hashPassword(newPassword);
      user.passwordHash = newPasswordHash;

      await this.userRepository.save(user);

      logInfo(`User ${user.id} changed password`);

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      logError("Error changing password:", error);
      res.status(500).json({
        success: false,
        message: "Failed to change password",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getUserProducts(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const queryBuilder = this.userRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.products", "product")
        .leftJoinAndSelect("product.images", "image")
        .where("user.id = :userId", { userId: req.user?.id || "" });

      if (status) {
        queryBuilder.andWhere("product.status = :status", { status });
      }

      const [products, total] = await queryBuilder
        .orderBy("product.createdAt", "DESC")
        .skip(offset)
        .take(Number(limit))
        .getManyAndCount();

      const userProducts = products[0]?.products || [];

      res.json({
        success: true,
        data: {
          products: userProducts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logError("Error getting user products:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user products",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getUserReviews(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const [reviews, total] = await this.userRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.reviews", "review")
        .leftJoinAndSelect("review.product", "product")
        .where("user.id = :userId", { userId: req.user?.id || "" })
        .orderBy("review.createdAt", "DESC")
        .skip(offset)
        .take(Number(limit))
        .getManyAndCount();

      const userReviews = reviews[0]?.reviews || [];

      res.json({
        success: true,
        data: {
          reviews: userReviews,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logError("Error getting user reviews:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user reviews",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getWalletTransactions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, type } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const queryBuilder = this.userRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.wallet", "wallet")
        .leftJoinAndSelect("wallet.ledger", "ledger")
        .where("user.id = :userId", { userId: req.user?.id || "" });

      if (type) {
        queryBuilder.andWhere("ledger.transactionType = :type", { type });
      }

      const [users, total] = await queryBuilder
        .orderBy("ledger.createdAt", "DESC")
        .skip(offset)
        .take(Number(limit))
        .getManyAndCount();

      const user = users[0];
      const transactions = user?.wallet?.ledger || [];

      res.json({
        success: true,
        data: {
          balance: user?.wallet?.balance || 0,
          transactions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logError("Error getting wallet transactions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get wallet transactions",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async deleteAccount(req: Request, res: Response) {
    try {
      const { password } = req.body;

      if (!password) {
        throw new BadRequestError("Password is required to delete account");
      }

      if (!req.user?.id) {
        throw new BadRequestError("User not authenticated");
      }

      const user = await this.userRepository.findOne({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (!user.passwordHash) {
        throw new BadRequestError("Password not set for this account");
      }

      const isPasswordValid = await comparePassword(
        password,
        user.passwordHash
      );
      if (!isPasswordValid) {
        throw new BadRequestError("Password is incorrect");
      }

      user.deleted = true;
      user.deletedAt = new Date();
      user.isActive = false;

      await this.userRepository.save(user);

      logInfo(`User ${user.id} deleted account`);

      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      logError("Error deleting account:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete account",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
