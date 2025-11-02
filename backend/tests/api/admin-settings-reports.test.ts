import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import {
  authenticatedAdminRequest,
  closeTestServer,
  createAdminAndToken,
  createTestServer,
  expectError,
  expectSuccess,
  resetDb,
  seedUser,
} from '../test-helpers';

describe('Admin Settings & Reports API', () => {
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

  describe('GET /api-v1/admin/settings/privacy-policy', () => {
    it('returns current privacy policy', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/settings/privacy-policy`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.content).toBeDefined();
      expect(body.data.content.title).toBeDefined();
      expect(body.data.content.content).toBeInstanceOf(Array);
      expect(body.data.content.version).toBeDefined();
      expect(body.data.content.updatedAt).toBeDefined();
      expect(body.data.content.updatedBy).toBeDefined();
    });

    it('returns default privacy policy when none set', async () => {
      const { token } = await createAdminAndToken();

      // Assuming we clear any existing policy first
      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/settings/privacy-policy`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.content.title).toBe('Privacy Policy');
      expect(body.data.content.version).toBe('1.0');
    });
  });

  describe('PUT /api-v1/admin/settings/privacy-policy', () => {
    it('updates privacy policy successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      const newPolicy = {
        title: 'Updated Privacy Policy',
        content: [
          'We collect personal information...',
          'We use this information to...',
          'You have the right to...',
        ],
        version: '2.0',
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/settings/privacy-policy`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify(newPolicy),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.content.title).toBe('Updated Privacy Policy');
      expect(body.data.content.content).toEqual(newPolicy.content);
      expect(body.data.content.version).toBe('2.0');
      expect(body.data.content.updatedBy.id).toBe(admin.id);
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates required fields', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/settings/privacy-policy`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Test Policy',
            // Missing content and version
          }),
        }
      );

      await expectError(response, 400);
    });

    it('validates content array', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/settings/privacy-policy`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Test Policy',
            content: 'not an array', // Should be array
            version: '1.0',
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('GET /api-v1/admin/settings/terms-conditions', () => {
    it('returns current terms and conditions', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/settings/terms-conditions`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.content).toBeDefined();
      expect(body.data.content.title).toBeDefined();
      expect(body.data.content.content).toBeInstanceOf(Array);
      expect(body.data.content.version).toBeDefined();
    });
  });

  describe('PUT /api-v1/admin/settings/terms-conditions', () => {
    it('updates terms and conditions successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      const newTerms = {
        title: 'Updated Terms & Conditions',
        content: [
          'By using our service you agree to...',
          'You are responsible for...',
          'We reserve the right to...',
        ],
        version: '3.1',
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/settings/terms-conditions`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify(newTerms),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.content.title).toBe('Updated Terms & Conditions');
      expect(body.data.content.version).toBe('3.1');
      expect(body.data.content.updatedBy.id).toBe(admin.id);
      expect(body.data.auditLogId).toBeDefined();
    });
  });

  describe('GET /api-v1/admin/reports', () => {
    it('returns paginated user reports', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports?page=1&limit=10`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.reports).toBeInstanceOf(Array);
      expect(body.data.pagination).toBeDefined();
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.total).toBeDefined();
      expect(body.data.stats.pending).toBeDefined();
      expect(body.data.stats.resolved).toBeDefined();
    });

    it('filters reports by status', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports?status=pending`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.reports).toBeInstanceOf(Array);
      expect(body.data.reports.every((report: any) => report.status === 'pending')).toBe(true);
    });

    it('filters reports by type', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports?type=spam`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.reports).toBeInstanceOf(Array);
      expect(body.data.reports.every((report: any) => report.reportType === 'spam')).toBe(true);
    });

    it('includes report statistics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/reports`, token);

      const body = await expectSuccess(response, 200);
      expect(body.data.stats.byType).toBeDefined();
      expect(typeof body.data.stats.byType).toBe('object');
    });
  });

  describe('PUT /api-v1/admin/reports/:id/resolve', () => {
    it('resolves report with warning action', async () => {
      const { token, admin } = await createAdminAndToken();
      const reportId = 'mock-report-id';

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports/${reportId}/resolve`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            resolution: 'User has been warned about community guidelines violation',
            notes: 'First offense, issued formal warning',
            action: 'warn',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.report).toBeDefined();
      expect(body.data.report.status).toBe('resolved');
      expect(body.data.report.resolution).toBe(
        'User has been warned about community guidelines violation'
      );
      expect(body.data.report.resolvedAt).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('resolves report with suspension action', async () => {
      const { token } = await createAdminAndToken();
      const reportId = 'mock-report-id';

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports/${reportId}/resolve`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            resolution: 'Account suspended for 7 days due to repeated violations',
            notes: 'Multiple spam reports, temporary suspension applied',
            action: 'suspend',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.report.status).toBe('resolved');
      expect(body.data.report.action).toBe('suspend');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('dismisses report as invalid', async () => {
      const { token } = await createAdminAndToken();
      const reportId = 'mock-report-id';

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports/${reportId}/resolve`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            resolution: 'Report dismissed - content does not violate guidelines',
            notes: 'After review, the reported content is within acceptable limits',
            action: 'dismiss',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.report.status).toBe('resolved');
      expect(body.data.report.action).toBe('dismiss');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates required resolution field', async () => {
      const { token } = await createAdminAndToken();
      const reportId = 'mock-report-id';

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports/${reportId}/resolve`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            // Missing resolution
            action: 'warn',
          }),
        }
      );

      await expectError(response, 400);
    });

    it('validates action field', async () => {
      const { token } = await createAdminAndToken();
      const reportId = 'mock-report-id';

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports/${reportId}/resolve`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            resolution: 'Test resolution',
            action: 'invalid-action',
          }),
        }
      );

      await expectError(response, 400);
    });

    it('returns 404 for non-existent report', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports/99999/resolve`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            resolution: 'Test resolution',
            action: 'warn',
          }),
        }
      );

      await expectError(response, 404);
    });
  });

  describe('GET /api-v1/admin/feedback', () => {
    it('returns paginated user feedback', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/feedback?page=1&limit=10`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.feedback).toBeInstanceOf(Array);
      expect(body.data.pagination).toBeDefined();
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.averageRating).toBeDefined();
      expect(body.data.stats.distribution).toBeDefined();
    });

    it('filters feedback by rating', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/feedback?rating=5`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.feedback).toBeInstanceOf(Array);
      expect(body.data.feedback.every((item: any) => item.rating === 5)).toBe(true);
    });

    it('includes rating distribution statistics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/feedback`, token);

      const body = await expectSuccess(response, 200);
      expect(body.data.stats.distribution).toBeDefined();
      expect(typeof body.data.stats.distribution).toBe('object');

      // Should have ratings 1-5
      for (let i = 1; i <= 5; i++) {
        expect(body.data.stats.distribution[i]).toBeDefined();
        expect(typeof body.data.stats.distribution[i]).toBe('number');
      }
    });

    it('calculates correct average rating', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/feedback`, token);

      const body = await expectSuccess(response, 200);
      expect(body.data.stats.averageRating).toBeDefined();
      expect(typeof body.data.stats.averageRating).toBe('number');
      expect(body.data.stats.averageRating).toBeGreaterThanOrEqual(1);
      expect(body.data.stats.averageRating).toBeLessThanOrEqual(5);
    });
  });

  describe('Additional Settings & Reports Endpoints', () => {
    it('GET /api-v1/admin/settings/announcements returns system announcements', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/settings/announcements`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.announcements).toBeInstanceOf(Array);
    });

    it('POST /api-v1/admin/settings/announcements creates new announcement', async () => {
      const { token, admin } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/settings/announcements`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            title: 'Scheduled Maintenance',
            content: 'The platform will be under maintenance tonight from 2-4 AM UTC',
            type: 'warning',
            isActive: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.announcement).toBeDefined();
      expect(body.data.announcement.title).toBe('Scheduled Maintenance');
      expect(body.data.announcement.type).toBe('warning');
      expect(body.data.announcement.createdBy).toBe(admin.id);
      expect(body.data.auditLogId).toBeDefined();
    });

    it('GET /api-v1/admin/reports/user-activity returns user activity reports', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports/user-activity?dateFrom=2024-01-01&dateTo=2024-12-31`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.activities).toBeInstanceOf(Array);
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.totalActions).toBeDefined();
      expect(body.data.stats.byActionType).toBeDefined();
    });

    it('GET /api-v1/admin/reports/revenue returns revenue reports', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports/revenue?period=month`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.revenue).toBeDefined();
      expect(body.data.revenue.total).toBeDefined();
      expect(body.data.revenue.bySource).toBeDefined();
      expect(body.data.revenue.trends).toBeInstanceOf(Array);
    });

    it('POST /api-v1/admin/settings/maintenance enables maintenance mode', async () => {
      const { token, admin } = await createAdminAndToken({ role: 'super-admin' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/settings/maintenance`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            enabled: true,
            message: 'Platform is under scheduled maintenance',
            estimatedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.maintenance).toBeDefined();
      expect(body.data.maintenance.enabled).toBe(true);
      expect(body.data.maintenance.message).toBe('Platform is under scheduled maintenance');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('GET /api-v1/admin/settings returns all system settings', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/settings`, token);

      const body = await expectSuccess(response, 200);
      expect(body.data.settings).toBeDefined();
      expect(typeof body.data.settings).toBe('object');
    });

    it('PUT /api-v1/admin/settings/:key updates specific setting', async () => {
      const { token, admin } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/settings/platform_name`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            value: 'Oysloe Marketplace',
            description: 'Platform display name',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.setting).toBeDefined();
      expect(body.data.setting.key).toBe('platform_name');
      expect(body.data.setting.value).toBe('Oysloe Marketplace');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('GET /api-v1/admin/reports/export returns available export types', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/reports/export`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.exports).toBeInstanceOf(Array);
      expect(body.data.exports.length).toBeGreaterThan(0);

      // Should include various export types
      const exportTypes = body.data.exports.map((exp: any) => exp.type);
      expect(exportTypes).toContain('users');
      expect(exportTypes).toContain('ads');
      expect(exportTypes).toContain('reports');
    });
  });
});
