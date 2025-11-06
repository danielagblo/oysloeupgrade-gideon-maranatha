import type { NextFunction, Request, Response } from 'express';
import { addTokenToDenyList } from '../config/redis.js';
import type { User } from '../entities/User.js';
import type { AuthService } from '../services/auth.service.js';
import { UnauthorizedError } from '../utils/errors.js';
import { extractTokenFromHeader, getTokenExpiry } from '../utils/jwt.js';
import type {
  LoginInput,
  OTPSendInput,
  OTPVerifyInput,
  PasswordResetInput,
  RegisterInput,
} from '../validators/auth.validator.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input: RegisterInput = req.body;
      const result = await this.authService.register(input);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input: LoginInput = req.body;
      const result = await this.authService.login(input);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        throw new UnauthorizedError('No token provided');
      }

      const ttl = getTokenExpiry(token);
      if (ttl > 0) {
        await addTokenToDenyList(token, ttl);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('Not authenticated');
      }

      res.status(200).json({
        success: true,
        data: {
          user,
          wallet: (user as User & { wallet?: { balance: number } }).wallet || {
            balance: 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async sendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const input: OTPSendInput = req.body;
      const result = await this.authService.sendOTP(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const input: OTPVerifyInput = req.body;
      const result = await this.authService.verifyOTP(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const input: PasswordResetInput = req.body;
      const user = req.user as User;

      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await this.authService.resetPassword(user, input.newPassword);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
