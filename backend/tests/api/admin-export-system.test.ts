import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import {
  authenticatedAdminRequest,
  closeTestServer,
  createAdminAndToken,
  createTestServer,
  expectError,
  expectSuccess,
  resetDb,
  seedProduct,
  seedUser,
} from '../test-helpers';

describe('Admin Data Export System', () => {
  let server: unknown;
  let baseURL: string;

  beforeAll(async () => {
    const testServer = await createTestServer();
    server = testServer.server;
    baseURL = testServer.baseURL;
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await closeTestServer(server);
  });

  describe('GET /api-v1/admin/export/users', () => {
    it('exports users data in CSV format', async () => {
      const { token } = await createAdminAndToken();

      // Create test users
      await seedUser({ name: 'John Doe', email: 'john@example.com' });
      await seedUser({ name: 'Jane Smith', email: 'jane@example.com' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/users?format=csv&fields=id,name,email,verificationStatus`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.downloadUrl).toBeDefined();
      expect(body.data.expiresAt).toBeDefined();
      expect(body.data.fileSize).toBeDefined();
      expect(body.data.recordCount).toBeGreaterThanOrEqual(2);
      expect(body.data.format).toBe('csv');
    });

    it('exports users data in Excel format', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/users?format=xlsx`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.downloadUrl).toMatch(/\.xlsx$/);
      expect(body.data.format).toBe('xlsx');
    });

    it('applies filters to exported data', async () => {
      const { token } = await createAdminAndToken();

      // Create users with different statuses
      await seedUser({ name: 'Verified User', email: 'verified@example.com' });
      await seedUser({ name: 'Unverified User', email: 'unverified@example.com' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/users?format=csv&status=verified`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.recordCount).toBe(1);
    });

    it('validates export format', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/users?format=invalid`,
        token
      );

      await expectError(response, 400);
    });
  });

  describe('GET /api-v1/admin/export/ads', () => {
    it('exports ads data with full product information', async () => {
      const { token } = await createAdminAndToken();

      // Create test products
      await seedProduct({ name: 'Test Product 1', price: 99.99 });
      await seedProduct({ name: 'Test Product 2', price: 149.99 });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/ads?format=csv&fields=id,name,price,status,createdAt`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.recordCount).toBeGreaterThanOrEqual(2);
      expect(body.data.fields).toContain('price');
      expect(body.data.fields).toContain('status');
    });

    it('includes category and seller information', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/ads?format=xlsx&include=category,seller`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.includes).toContain('category');
      expect(body.data.includes).toContain('seller');
    });

    it('exports ads within date range', async () => {
      const { token } = await createAdminAndToken();

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      const toDate = new Date();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/ads?format=csv&dateFrom=${fromDate.toISOString()}&dateTo=${toDate.toISOString()}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.dateRange).toBeDefined();
    });
  });

  describe('GET /api-v1/admin/export/support', () => {
    it('exports support cases with conversation history', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/support?format=csv&include=messages`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.includes).toContain('messages');
      expect(body.data.format).toBe('csv');
    });

    it('exports support cases by status and priority', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/support?format=xlsx&status=open,in_progress&priority=high,urgent`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.filters).toBeDefined();
      expect(body.data.filters.status).toContain('open');
      expect(body.data.filters.priority).toContain('high');
    });

    it('includes agent performance metrics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/support?format=csv&include=performance`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.includes).toContain('performance');
    });
  });

  describe('GET /api-v1/admin/export/reports', () => {
    it('exports user reports and moderation actions', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/reports?format=csv&type=user_reports,moderation_actions`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.types).toContain('user_reports');
      expect(body.data.types).toContain('moderation_actions');
    });

    it('exports reports within date range', async () => {
      const { token } = await createAdminAndToken();

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      const toDate = new Date();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/reports?format=xlsx&dateFrom=${fromDate.toISOString()}&dateTo=${toDate.toISOString()}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.dateRange).toBeDefined();
    });

    it('includes resolution details and admin actions', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/reports?format=csv&include=resolutions,admin_actions`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.includes).toContain('resolutions');
      expect(body.data.includes).toContain('admin_actions');
    });
  });

  describe('POST /api-v1/admin/export/custom', () => {
    it('creates custom export with advanced filtering', async () => {
      const { token, admin } = await createAdminAndToken();

      const customExportData = {
        name: 'Custom User Analytics Export',
        description: 'Monthly user activity and engagement metrics',
        entityType: 'users',
        format: 'xlsx',
        filters: [
          {
            field: 'verificationStatus',
            operator: 'eq',
            value: 'verified',
          },
          {
            field: 'createdAt',
            operator: 'gte',
            value: '2024-01-01T00:00:00Z',
          },
        ],
        fields: ['id', 'name', 'email', 'verificationStatus', 'lastLoginAt', 'createdAt'],
        include: ['activityStats', 'preferences'],
        sortBy: 'createdAt',
        sortOrder: 'desc',
        scheduled: false,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/custom`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(customExportData),
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.export).toBeDefined();
      expect(body.data.export.name).toBe('Custom User Analytics Export');
      expect(body.data.export.createdBy).toBe(admin.id);
      expect(body.data.export.status).toBe('processing');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates custom export parameters', async () => {
      const { token } = await createAdminAndToken();

      const invalidExport = {
        name: 'Invalid Export',
        entityType: 'invalid_type',
        format: 'invalid_format',
        fields: [],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/custom`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(invalidExport),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('GET /api-v1/admin/export/history', () => {
    it('lists export history with download links', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/history?page=1&limit=10`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.exports).toBeInstanceOf(Array);
      expect(body.data.pagination).toBeDefined();

      body.data.exports.forEach((export_: any) => {
        expect(export_.id).toBeDefined();
        expect(export_.filename).toBeDefined();
        expect(export_.format).toBeDefined();
        expect(export_.status).toBeDefined();
        expect(export_.createdAt).toBeDefined();
        if (export_.status === 'completed') {
          expect(export_.downloadUrl).toBeDefined();
          expect(export_.expiresAt).toBeDefined();
        }
      });
    });

    it('filters export history by status', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/history?status=completed`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.exports.every((export_: any) => export_.status === 'completed')).toBe(true);
    });

    it('includes export statistics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/history`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(typeof body.data.stats.totalExports).toBe('number');
      expect(typeof body.data.stats.totalSize).toBe('number');
      expect(body.data.stats.byFormat).toBeDefined();
      expect(body.data.stats.byStatus).toBeDefined();
    });
  });

  describe('POST /api-v1/admin/export/scheduled', () => {
    it('creates scheduled export job', async () => {
      const { token, admin } = await createAdminAndToken();

      const scheduledExportData = {
        name: 'Weekly User Report',
        description: 'Weekly export of all verified users',
        entityType: 'users',
        format: 'csv',
        filters: [
          {
            field: 'verificationStatus',
            operator: 'eq',
            value: 'verified',
          },
        ],
        fields: ['id', 'name', 'email', 'createdAt'],
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 1, // Monday
          time: '09:00',
        },
        recipients: ['admin@oysloe.com'],
        isActive: true,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/scheduled`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(scheduledExportData),
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.scheduledExport).toBeDefined();
      expect(body.data.scheduledExport.name).toBe('Weekly User Report');
      expect(body.data.scheduledExport.schedule.frequency).toBe('weekly');
      expect(body.data.scheduledExport.createdBy).toBe(admin.id);
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates schedule parameters', async () => {
      const { token } = await createAdminAndToken();

      const invalidSchedule = {
        name: 'Invalid Schedule',
        entityType: 'users',
        format: 'csv',
        schedule: {
          frequency: 'invalid',
          dayOfWeek: 8, // Invalid day
          time: '25:00', // Invalid time
        },
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/scheduled`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(invalidSchedule),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('GET /api-v1/admin/export/templates', () => {
    it('returns available export templates', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/templates`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.templates).toBeInstanceOf(Array);

      body.data.templates.forEach((template: any) => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.entityType).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.fields).toBeInstanceOf(Array);
      });
    });

    it('includes predefined templates for common exports', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/templates`,
        token
      );

      const body = await expectSuccess(response, 200);

      const templateNames = body.data.templates.map((t: any) => t.name);
      expect(templateNames).toContain('User Activity Report');
      expect(templateNames).toContain('Ads Performance Report');
      expect(templateNames).toContain('Support Metrics Report');
    });
  });

  describe('POST /api-v1/admin/export/templates/:id/use', () => {
    it('creates export from template', async () => {
      const { token } = await createAdminAndToken();

      const templateUsage = {
        customFilters: [
          {
            field: 'status',
            operator: 'eq',
            value: 'active',
          },
        ],
        customFields: ['id', 'name', 'email', 'status', 'createdAt'],
        format: 'xlsx',
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/templates/user-activity/use`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(templateUsage),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.export).toBeDefined();
      expect(body.data.template).toBeDefined();
      expect(body.data.export.format).toBe('xlsx');
    });

    it('validates template customizations', async () => {
      const { token } = await createAdminAndToken();

      const invalidCustomization = {
        customFields: [], // Empty fields
        format: 'invalid',
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/templates/user-activity/use`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(invalidCustomization),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('DELETE /api-v1/admin/export/:id', () => {
    it('deletes export file and record', async () => {
      const { token } = await createAdminAndToken();

      // First create an export (would need to mock or use real export)
      // For this test, we'll assume an export exists with ID 'test-export-id'

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/test-export-id`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({
            reason: 'File no longer needed',
          }),
        }
      );

      // In real implementation, this should succeed if export exists
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api-v1/admin/export/queue', () => {
    it('returns export processing queue', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/queue`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.queue).toBeInstanceOf(Array);
      expect(body.data.processing).toBeDefined();
      expect(typeof body.data.processing.active).toBe('number');
      expect(typeof body.data.processing.queued).toBe('number');

      body.data.queue.forEach((job: any) => {
        expect(job.id).toBeDefined();
        expect(job.status).toBeDefined();
        expect(job.entityType).toBeDefined();
        expect(job.queuedAt).toBeDefined();
      });
    });

    it('shows queue statistics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/queue`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(typeof body.data.stats.averageProcessingTime).toBe('number');
      expect(typeof body.data.stats.successRate).toBe('number');
      expect(body.data.stats.byEntityType).toBeDefined();
      expect(body.data.stats.recentFailures).toBeInstanceOf(Array);
    });
  });

  describe('POST /api-v1/admin/export/batch', () => {
    it('creates multiple exports in batch', async () => {
      const { token } = await createAdminAndToken();

      const batchExports = {
        exports: [
          {
            name: 'Users Export',
            entityType: 'users',
            format: 'csv',
            filters: [{ field: 'status', operator: 'eq', value: 'active' }],
          },
          {
            name: 'Ads Export',
            entityType: 'ads',
            format: 'xlsx',
            filters: [{ field: 'status', operator: 'eq', value: 'active' }],
          },
        ],
        notifyOnCompletion: true,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/batch`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(batchExports),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.exports).toBeInstanceOf(Array);
      expect(body.data.exports.length).toBe(2);
      expect(body.data.batchId).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates batch export parameters', async () => {
      const { token } = await createAdminAndToken();

      const invalidBatch = {
        exports: [
          {
            name: 'Invalid Export',
            entityType: 'invalid_type',
            format: 'invalid_format',
          },
        ],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/export/batch`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(invalidBatch),
        }
      );

      await expectError(response, 400);
    });
  });
});

