import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(50),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .max(15),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2).max(255),
  address: z.string().max(500).optional(),
  referralCode: z.string().max(20).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const otpSendSchema = z.object({
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .max(10),
});

export type OTPSendInput = z.infer<typeof otpSendSchema>;

export const otpVerifySchema = z.object({
  phone: z.string().max(10),
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

export type OTPVerifyInput = z.infer<typeof otpVerifySchema>;

export const passwordResetSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
