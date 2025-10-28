import type { EntityManager } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { checkRateLimit } from "../config/redis.js";
import { OTPCode } from "../entities/OTPCode.js";
import { Referral } from "../entities/Referral.js";
import { User } from "../entities/User.js";
import { Wallet } from "../entities/Wallet.js";
import {
  BadRequestError,
  ConflictError,
  TooManyRequestsError,
  UnauthorizedError,
} from "../utils/errors.js";
import { generateToken } from "../utils/jwt.js";
import { logInfo } from "../utils/logger.js";
import { notificationHelper } from "../utils/notification-helper.js";
import { generateReferralCode } from "../utils/otp.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import type {
  LoginInput,
  OTPSendInput,
  OTPVerifyInput,
  RegisterInput,
} from "../validators/auth.validator.js";
import type { INotification } from "./notification.port.js";

export interface AuthServiceDependencies {
  notification: INotification;
}

export class AuthService {
  constructor(private deps: AuthServiceDependencies) {}

  private get userRepository() {
    return AppDataSource.getRepository(User);
  }

  private get otpRepository() {
    return AppDataSource.getRepository(OTPCode);
  }

  async register(input: RegisterInput) {
    await this.validateUserUniqueness(input.email, input.phone);

    return await AppDataSource.transaction(async (manager) => {
      const passwordHash = await hashPassword(input.password);
      const referralCode = await this.generateUniqueReferralCode(manager);
      const user = await this.createUser(
        manager,
        input,
        passwordHash,
        referralCode
      );
      const wallet = await this.createUserWallet(manager, user.id);

      await this.processReferralIfProvided(
        manager,
        input.referralCode,
        user.id
      );

      const token = this.generateUserToken(user);
      logInfo(`User registered: ${user.email}`);

      try {
        await notificationHelper.notifyWelcome(
          user.id,
          user.name,
          referralCode
        );
      } catch (error) {
        logInfo(`Failed to send welcome notification: ${error}`);
      }

      return {
        user: this.sanitizeUser(user),
        wallet: { balance: wallet.balance },
        token,
      };
    });
  }

  async login(input: LoginInput) {
    const user = await this.findUserByEmail(input.email);
    this.validateUserStatus(user);
    await this.verifyPassword(input.password, user.passwordHash);

    await this.updateLastLogin(user);
    const token = this.generateUserToken(user);

    logInfo(`User logged in: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      wallet: { balance: user.wallet?.balance || 0 },
      token,
    };
  }

  async sendOTP(input: OTPSendInput) {
    await this.checkOTPRateLimit(input.phone);

    const { code } = await this.generateAndSaveOTP(input);
    await this.sendOTPCode(input.phone, code);

    return {
      message: "OTP sent successfully",
    };
  }

  async verifyOTP(input: OTPVerifyInput) {
    const otpRecord = await this.otpRepository.findOne({
      where: {
        phone: input.phone,
        otp: input.code,
      },
    });

    if (!otpRecord) {
      throw new BadRequestError("Invalid or expired OTP");
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestError("OTP has expired");
    }

    let user = await this.userRepository.findOne({
      where: { phone: input.phone },
      relations: ["wallet"],
    });

    if (!user) {
      return await AppDataSource.transaction(async (manager) => {
        const referralCode = await this.generateUniqueReferralCode(manager);

        user = manager.create(User, {
          phone: input.phone,
          email: `${input.phone}@temp.oysloe.com`,
          name: `User ${input.phone}`,
          passwordHash: await hashPassword(Math.random().toString(36)),
          phoneVerified: true,
          referralCode,
          createdFromApp: true,
        });

        await manager.save(user);

        const wallet = manager.create(Wallet, {
          userId: user.id,
          balance: 0,
        });
        await manager.save(wallet);

        user.wallet = {
          id: wallet.userId,
          balance: wallet.balance,
          ledger: wallet.ledger,
        };

        logInfo(`New user created via OTP: ${user.phone}`);

        const token = generateToken({
          userId: user.id,
          email: user.email,
          level: user.level,
        });

        try {
          await notificationHelper.notifyAccountCreated(
            user.id,
            user.phone || ""
          );
        } catch (error) {
          logInfo(`Failed to send account created notification: ${error}`);
        }

        return {
          message: "OTP verified successfully",
          user: this.sanitizeUser(user),
          wallet: { balance: user.wallet?.balance || 0 },
          token,
        };
      });
    }

    if (user.deleted) {
      throw new UnauthorizedError("Account has been deleted");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is inactive");
    }

    if (!user.phoneVerified) {
      user.phoneVerified = true;
    }

    user.lastLogin = new Date();
    await this.userRepository.save(user);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      level: user.level,
    });

    logInfo(`User logged in via OTP: ${user.phone}`);

    return {
      message: "OTP verified successfully",
      user: this.sanitizeUser(user),
      wallet: { balance: user.wallet?.balance || 0 },
      token,
    };
  }

  async resetPassword(user: User, newPassword: string) {
    if (!user.phoneVerified) {
      throw new BadRequestError("Phone not verified");
    }

    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);

    logInfo(`Password reset for user: ${user.email}`);

    return {
      message: "Password reset successfully",
    };
  }

  private async validateUserUniqueness(
    email: string,
    phone: string
  ): Promise<void> {
    const [existingEmail, existingPhone] = await Promise.all([
      this.userRepository.findOne({ where: { email, deleted: false } }),
      this.userRepository.findOne({ where: { phone, deleted: false } }),
    ]);

    if (existingEmail) {
      throw new ConflictError("Email already exists");
    }
    if (existingPhone) {
      throw new ConflictError("Phone number already exists");
    }
  }

  private async generateUniqueReferralCode(
    manager: EntityManager
  ): Promise<string> {
    let referralCode: string = "";
    let isUnique = false;

    while (!isUnique) {
      referralCode = generateReferralCode();
      const existing = await manager.findOne(User, { where: { referralCode } });
      if (!existing) {
        isUnique = true;
      }
    }

    return referralCode;
  }

  private async createUser(
    manager: EntityManager,
    input: RegisterInput,
    passwordHash: string,
    referralCode: string
  ): Promise<User> {
    const user = manager.create(User, {
      email: input.email,
      phone: input.phone,
      passwordHash,
      name: input.name,
      address: input.address,
      referralCode,
      createdFromApp: true,
    });

    return await manager.save(user);
  }

  private async createUserWallet(
    manager: EntityManager,
    userId: string
  ): Promise<Wallet> {
    const wallet = manager.create(Wallet, {
      userId,
      balance: 0,
    });
    return await manager.save(wallet);
  }

  private async processReferralIfProvided(
    manager: EntityManager,
    referralCode: string | undefined,
    userId: string
  ): Promise<void> {
    if (!referralCode) return;

    const referrer = await manager.findOne(User, { where: { referralCode } });
    if (!referrer) return;

    referrer.referralPoints += 250;
    await manager.save(referrer);

    const referral = manager.create(Referral, {
      referrerId: referrer.id,
      referredUserId: userId,
      pointsEarned: 250,
    });
    await manager.save(referral);

    logInfo(`Referral points awarded to user ${referrer.id}`);
  }

  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["wallet"],
    });

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    return user;
  }

  private validateUserStatus(user: User): void {
    if (user.deleted) {
      throw new UnauthorizedError("Account has been deleted");
    }
    if (!user.isActive) {
      throw new UnauthorizedError("Account is inactive");
    }
  }

  private async verifyPassword(
    password: string,
    passwordHash: string | undefined
  ): Promise<void> {
    if (!passwordHash) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isValid = await comparePassword(password, passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid credentials");
    }
  }

  private async updateLastLogin(user: User): Promise<void> {
    user.lastLogin = new Date();
    await this.userRepository.save(user);
  }

  private async checkOTPRateLimit(phone: string): Promise<void> {
    const rateLimitKey = `otp_rate_limit:${phone}`;
    const { allowed, remaining } = await checkRateLimit(
      rateLimitKey,
      3,
      60 * 60 * 1000
    );

    if (!allowed) {
      throw new TooManyRequestsError(
        `Too many OTP requests. Try again later. Remaining: ${remaining}`
      );
    }
  }

  private async generateAndSaveOTP(input: OTPSendInput): Promise<{
    code: string;
    expiresAt: Date;
  }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await this.otpRepository.delete({ phone: input.phone });

    const otpCode = this.otpRepository.create({
      phone: input.phone,
      otp: code,
      expiresAt,
    });
    await this.otpRepository.save(otpCode);

    return { code, expiresAt };
  }

  private async sendOTPCode(phone: string, code: string): Promise<void> {
    try {
      await this.deps.notification.send(phone, {
        type: "otp",
        code: code,
        message: `Welcome to Oysloe Marketplace.\n\nYour OTP is ${code}\n\nRegards,\nOysloe Team`,
      });

      logInfo(`OTP notification sent successfully to ${phone}`);
    } catch (error) {
      logInfo(
        `OTP notification failed for ${phone}, falling back to console log: ${error}`
      );
      console.log(`\nOTP CODE: ${code}\n`);
    }
  }

  private generateUserToken(user: User): string {
    return generateToken({
      userId: user.id,
      email: user.email,
      level: user.level,
    });
  }

  private sanitizeUser(user: User) {
    const {
      passwordHash: _passwordHash,
      deleted: _deleted,
      deletedAt: _deletedAt,
      ...sanitized
    } = user;
    return sanitized;
  }
}
