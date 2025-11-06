import { z } from 'zod';

export const UserLevel = z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']);

export const User = z
  .object({
    id: z.string().uuid().describe('User UUID'),
    email: z.string().email().max(50).describe('User email address'),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .describe('User phone number in E.164 format'),
    name: z.string().min(1).max(255).describe('User full name'),
    address: z.string().max(500).optional().describe('User address'),
    avatar: z.string().url().optional().describe('User avatar URL'),
    referralCode: z.string().min(6).max(20).optional().describe('User referral code'),
    referralPoints: z.number().int().min(0).default(0).describe('User referral points'),
    level: UserLevel.default('SILVER').describe('User level'),
    isActive: z.boolean().default(true).describe('Whether user account is active'),
    isStaff: z.boolean().default(false).describe('Whether user is staff'),
    isSuperuser: z.boolean().default(false).describe('Whether user is superuser'),
    phoneVerified: z.boolean().default(false).describe('Whether phone is verified'),
    emailVerified: z.boolean().default(false).describe('Whether email is verified'),
    preferredNotificationEmail: z
      .string()
      .email()
      .max(50)
      .optional()
      .describe('Preferred notification email'),
    preferredNotificationPhone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .describe('Preferred notification phone'),
    createdFromApp: z.boolean().default(true).describe('Whether user was created from app'),
    lastLogin: z.string().datetime().optional().describe('Last login timestamp'),
    createdAt: z.string().datetime().describe('User creation timestamp'),
    updatedAt: z.string().datetime().describe('User last update timestamp'),
  })
  .openapi('User', {
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'john.doe@example.com',
      phone: '+233123456789',
      name: 'John Doe',
      address: '123 Main St, Accra, Ghana',
      avatar: 'https://example.com/avatars/john.jpg',
      referralCode: 'JOHN123',
      referralPoints: 150,
      level: 'SILVER',
      isActive: true,
      isStaff: false,
      isSuperuser: false,
      phoneVerified: true,
      emailVerified: true,
      createdFromApp: true,
      lastLogin: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
  });

export const CreateUserBody = z
  .object({
    email: z.string().email().max(50).describe('User email address'),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .describe('User phone number in E.164 format'),
    name: z.string().min(1).max(255).describe('User full name'),
    password: z.string().min(8).max(128).describe('User password'),
    address: z.string().max(500).optional().describe('User address'),
    referralCode: z
      .string()
      .min(6)
      .max(20)
      .optional()
      .describe('Referral code used during registration'),
  })
  .openapi('CreateUserBody', {
    example: {
      email: 'john.doe@example.com',
      phone: '+233123456789',
      name: 'John Doe',
      password: 'SecurePassword123!',
      address: '123 Main St, Accra, Ghana',
      referralCode: 'FRIEND123',
    },
  });

export const UpdateUserBody = z
  .object({
    name: z.string().min(1).max(255).optional().describe('User full name'),
    address: z.string().max(500).optional().describe('User address'),
    avatar: z.string().url().optional().describe('User avatar URL'),
    preferredNotificationEmail: z
      .string()
      .email()
      .max(50)
      .optional()
      .describe('Preferred notification email'),
    preferredNotificationPhone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .describe('Preferred notification phone'),
  })
  .openapi('UpdateUserBody', {
    example: {
      name: 'John Doe',
      address: '456 New St, Accra, Ghana',
      avatar: 'https://example.com/avatars/john-new.jpg',
      preferredNotificationEmail: 'john.new@example.com',
    },
  });

export const LoginBody = z
  .object({
    email: z.string().email().describe('User email address'),
    password: z.string().min(1).describe('User password'),
  })
  .openapi('LoginBody', {
    example: {
      email: 'john.doe@example.com',
      password: 'SecurePassword123!',
    },
  });

export const UserWithWallet = User.extend({
  wallet: z
    .object({
      id: z.string().uuid().describe('Wallet UUID'),
      balance: z.number().nonnegative().describe('Wallet balance'),
      currency: z.string().default('GHS').describe('Wallet currency'),
    })
    .optional()
    .describe('User wallet information'),
}).openapi('UserWithWallet', {
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'john.doe@example.com',
    phone: '+233123456789',
    name: 'John Doe',
    address: '123 Main St, Accra, Ghana',
    avatar: 'https://example.com/avatars/john.jpg',
    referralCode: 'JOHN123',
    referralPoints: 150,
    level: 'SILVER',
    isActive: true,
    isStaff: false,
    isSuperuser: false,
    phoneVerified: true,
    emailVerified: true,
    createdFromApp: true,
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    wallet: {
      id: '456e7890-e89b-12d3-a456-426614174001',
      balance: 250.5,
      currency: 'GHS',
    },
  },
});
