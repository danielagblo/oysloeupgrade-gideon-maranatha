import { z } from 'zod';

export const AdminLoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

export const CreateAdminSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  password: z.string().min(8),
  role: z.enum(['staff', 'admin']),
  businessName: z.string().optional(),
});

export const UpdateAdminSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(['staff', 'admin']).optional(),
  businessName: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const VerifyRoleSchema = z.object({
  requiredPermissions: z.array(z.string()),
});

export const GetUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  status: z.enum(['verified', 'unverified', 'muted']).optional(),
  level: z.enum(['high', 'middle', 'low']).optional(),
  role: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const VerifyUserSchema = z.object({
  status: z.enum(['verified', 'unverified']),
  notes: z.string().optional(),
});

export const UpdateUserLevelSchema = z.object({
  level: z.enum(['high', 'middle', 'low']),
  notes: z.string().optional(),
});

export const MuteUserSchema = z.object({
  action: z.enum(['mute', 'unmute']),
  reason: z.string().optional(),
  duration: z.number().int().positive().optional(), // hours
});

export const DeleteUserSchema = z.object({
  reason: z.string().min(1),
  permanent: z.boolean().optional().default(false),
});

export const ExportUsersSchema = z.object({
  format: z.enum(['csv', 'excel']),
  filters: GetUsersQuerySchema.optional(),
  fields: z.array(z.string()).optional(),
});

export const GetAdsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(['active', 'pending', 'suspended', 'rejected']).optional(),
  search: z.string().optional(),
  category: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const UpdateAdStatusSchema = z.object({
  status: z.enum(['active', 'pending', 'suspended', 'rejected']),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const BulkUpdateAdsSchema = z.object({
  adIds: z.array(z.string().uuid()),
  status: z.enum(['active', 'pending', 'suspended', 'rejected']),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const DeleteAdImageSchema = z.object({
  reason: z.string().optional(),
});

export const GetSupportCasesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(['open', 'in_progress', 'waiting', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
  userId: z.string().uuid().optional(),
  category: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
});

export const SendSupportMessageSchema = z.object({
  content: z.string().min(1),
  messageType: z.enum(['text', 'image', 'voice', 'file']).optional().default('text'),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
});

export const UpdateCaseStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting', 'resolved', 'closed']),
  notes: z.string().optional(),
});

export const AssignCaseSchema = z.object({
  adminUserId: z.number().int().positive().nullable().optional(),
  notes: z.string().optional(),
});

export const UpdatePrivacyPolicySchema = z.object({
  title: z.string().min(1),
  content: z.array(z.string()),
  version: z.string().min(1),
});

export const UpdateTermsConditionsSchema = z.object({
  title: z.string().min(1),
  content: z.array(z.string()),
  version: z.string().min(1),
});

export const GetReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(['pending', 'investigating', 'resolved', 'dismissed']).optional(),
  type: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const ResolveReportSchema = z.object({
  resolution: z.string().min(1),
  notes: z.string().optional(),
  action: z.enum(['warn', 'suspend', 'ban', 'dismiss']).optional(),
});

export const GetFeedbackQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(100).optional(),
  description: z.string().optional(),
  image: z.any().optional(), // File upload handled separately
  isActive: z.boolean().optional().default(true),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().max(100).optional(),
  description: z.string().optional(),
  image: z.any().optional(), // File upload handled separately
  isActive: z.boolean().optional(),
});

export const CreateSubcategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(100).optional(),
  description: z.string().optional(),
  parameters: z.array(z.any()).optional(), // ProductParameter[]
  image: z.any().optional(), // File upload handled separately
  isActive: z.boolean().optional().default(true),
});

export const UpdateSubcategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().max(100).optional(),
  description: z.string().optional(),
  parameters: z.array(z.any()).optional(), // ProductParameter[]
  image: z.any().optional(), // File upload handled separately
  isActive: z.boolean().optional(),
});

export const CreateRegionSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
  towns: z.array(z.string()).optional(),
});

export const AddTownSchema = z.object({
  name: z.string().min(1),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export const UpdateTownSchema = z.object({
  name: z.string().min(1).optional(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export const SendAlertSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.enum(['info', 'warning', 'success', 'error']),
  recipientIds: z.array(z.string().uuid()),
  linkedAdIds: z.array(z.string().uuid()).optional(),
  couponData: z
    .object({
      amount: z.number().positive(),
      code: z.string().optional(),
      expiresAt: z.string().datetime().optional(),
    })
    .optional(),
  sendImmediately: z.boolean().optional().default(true),
  scheduledFor: z.string().datetime().optional(),
});

export const CreateCouponSchema = z.object({
  amount: z.number().positive(),
  code: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  usageLimit: z.number().int().positive().optional(),
  recipientIds: z.array(z.string().uuid()),
  message: z.string().optional(),
  linkedAdIds: z.array(z.string().uuid()).optional(),
});

export const GetAlertsHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  type: z.string().optional(),
  status: z.enum(['active', 'expired', 'cancelled']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const GetSelectableUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  verificationStatus: z.enum(['verified', 'unverified', 'pending']).optional(),
  level: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'name', 'email', 'level']).optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

export const GetSelectableAdsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived', 'sold']).optional(),
  categoryId: z.string().uuid().optional(),
  moderationStatus: z.enum(['pending', 'active', 'suspended', 'rejected']).optional(),
  sortBy: z.enum(['createdAt', 'name', 'price', 'viewsCount']).optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

export const GetApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']).optional(),
  search: z.string().optional(),
  timePeriod: z.enum(['today', 'yesterday', '7days', '1month']).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const DownloadApplicationSchema = z.object({
  documentType: z.enum(['cv', 'cover_letter', 'portfolio']),
});

export const UpdateApplicationStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']),
  notes: z.string().optional(),
  feedback: z.string().optional(),
});

export const GlobalSearchQuerySchema = z.object({
  query: z.string().min(1),
  types: z.array(z.enum(['users', 'ads', 'support', 'applications'])).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  page: z.coerce.number().int().positive().optional().default(1),
});

export const AdvancedFilterSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'regex']),
  value: z.any(),
});

export const FilterRequestSchema = z.object({
  filters: z.array(AdvancedFilterSchema),
  sort: z
    .array(
      z.object({
        field: z.string(),
        order: z.enum(['asc', 'desc']),
      })
    )
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const ExportRequestSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf']),
  filters: FilterRequestSchema.optional(),
  fields: z.array(z.string()).optional(),
  dateRange: z
    .object({
      from: z.string().datetime(),
      to: z.string().datetime(),
    })
    .optional(),
});

export const UserAnalyticsQuerySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

export const AdsAnalyticsQuerySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  category: z.string().uuid().optional(),
});

export const RevenueAnalyticsQuerySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  type: z.enum(['subscription', 'commission', 'ads']).optional(),
});
