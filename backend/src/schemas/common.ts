import { z } from 'zod';

export const ErrorSchema = z
  .object({
    code: z.string().describe('Error code'),
    message: z.string().describe('Error message'),
    details: z.any().optional().describe('Additional error details'),
    traceId: z.string().optional().describe('Request trace ID for debugging'),
  })
  .openapi('Error', {
    example: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: {
        field: 'email',
        reason: 'Invalid email format',
      },
      traceId: 'req_123456789',
    },
  });

export const TokenResponse = z
  .object({
    accessToken: z.string().describe('JWT access token'),
    refreshToken: z.string().describe('JWT refresh token'),
    expiresIn: z.number().int().positive().describe('Token expiration time in seconds'),
    tokenType: z.string().default('Bearer').describe('Token type'),
  })
  .openapi('TokenResponse', {
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresIn: 3600,
      tokenType: 'Bearer',
    },
  });

export const HealthCheckResponse = z
  .object({
    status: z.enum(['healthy', 'unhealthy']).describe('Service health status'),
    timestamp: z.string().datetime().describe('Health check timestamp'),
    uptime: z.number().positive().describe('Service uptime in seconds'),
    version: z.string().describe('Service version'),
    environment: z.string().describe('Environment name'),
    database: z
      .object({
        status: z.enum(['connected', 'disconnected']).describe('Database connection status'),
        responseTime: z.number().positive().optional().describe('Database response time in ms'),
      })
      .describe('Database health information'),
    redis: z
      .object({
        status: z.enum(['connected', 'disconnected']).describe('Redis connection status'),
        responseTime: z.number().positive().optional().describe('Redis response time in ms'),
      })
      .describe('Redis health information'),
  })
  .openapi('HealthCheckResponse', {
    example: {
      status: 'healthy',
      timestamp: '2024-01-15T10:30:00Z',
      uptime: 86400,
      version: '1.0.0',
      environment: 'production',
      database: {
        status: 'connected',
        responseTime: 15.5,
      },
      redis: {
        status: 'connected',
        responseTime: 2.1,
      },
    },
  });

export const PaginationMeta = z
  .object({
    page: z.number().int().min(1).describe('Current page number'),
    limit: z.number().int().min(1).describe('Items per page'),
    total: z.number().int().min(0).describe('Total number of items'),
    totalPages: z.number().int().min(0).describe('Total number of pages'),
    hasNext: z.boolean().describe('Whether there is a next page'),
    hasPrev: z.boolean().describe('Whether there is a previous page'),
  })
  .openapi('PaginationMeta', {
    example: {
      page: 1,
      limit: 20,
      total: 150,
      totalPages: 8,
      hasNext: true,
      hasPrev: false,
    },
  });

export const PaginatedResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z
    .object({
      data: z.array(dataSchema).describe('Array of items'),
      meta: PaginationMeta.describe('Pagination metadata'),
    })
    .openapi('PaginatedResponse', {
      description: 'Paginated response',
    });

export const SuccessResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z
    .object({
      success: z.boolean().default(true).describe('Success indicator'),
      data: dataSchema.describe('Response data'),
      message: z.string().optional().describe('Success message'),
    })
    .openapi('SuccessResponse', {
      description: 'Success response',
    });

export const ChangePasswordBody = z
  .object({
    currentPassword: z.string().min(1).describe('Current password'),
    newPassword: z.string().min(8).describe('New password'),
  })
  .openapi('ChangePasswordBody');

export const OTPVerificationBody = z
  .object({
    code: z.string().length(6).describe('6-digit OTP code'),
    phone: z.string().optional().describe('Phone number (if not provided in context)'),
  })
  .openapi('OTPVerificationBody');

export const PasswordResetRequestBody = z
  .object({
    email: z.string().email().describe('User email address'),
  })
  .openapi('PasswordResetRequestBody');

export const PasswordResetConfirmBody = z
  .object({
    token: z.string().describe('Password reset token'),
    newPassword: z.string().min(8).describe('New password'),
  })
  .openapi('PasswordResetConfirmBody');
