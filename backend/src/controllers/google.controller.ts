import type { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import type { User } from '../entities/User.js';
import { Wallet } from '../entities/Wallet.js';
import { generateToken } from '../utils/jwt.js';

export async function initiateGoogleAuth(_req: Request, res: Response): Promise<void> {
  try {

    res.json({
      success: true,
      message: 'Redirect to Google OAuth',
      url: '/api-v1/auth/google',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Google OAuth',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function handleGoogleCallback(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as User;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Google authentication failed',
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      level: user.level,
    });

    const walletRepository = AppDataSource.getRepository(Wallet);
    const wallet = await walletRepository.findOne({
      where: { userId: user.id },
    });

    res.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatarUrl,
          referralCode: user.referralCode,
          referralPoints: user.referralPoints,
          level: user.level,
          isActive: user.isActive,
          isStaff: user.isStaff,
          isSuperuser: user.isSuperuser,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        wallet: {
          balance: wallet?.balance || '0.00',
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process Google authentication',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function handleGoogleFailure(_req: Request, res: Response): Promise<void> {
  res.status(401).json({
    success: false,
    message: 'Google authentication failed',
    error: 'User denied access or authentication failed',
  });
}
