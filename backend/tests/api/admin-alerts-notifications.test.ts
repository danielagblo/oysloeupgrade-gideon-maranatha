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

describe('Admin Alerts & Notifications API', () => {
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

  describe('POST /api-v1/admin/alerts/send', () => {
    it('sends alert to users successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      // Create some test users
      const user1 = await seedUser({ email: 'user1@example.com' });
      const user2 = await seedUser({ email: 'user2@example.com' });

      const alertData = {
        title: 'Platform Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2-4 AM UTC',
        type: 'warning',
        recipientIds: [user1.id, user2.id],
        sendImmediately: true,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/send`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(alertData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.alert).toBeDefined();
      expect(body.data.alert.title).toBe('Platform Maintenance');
      expect(body.data.alert.type).toBe('warning');
      expect(body.data.recipients).toBe(2);
      expect(body.data.auditLogId).toBeDefined();
    });

    it('schedules alert for future delivery', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

      const alertData = {
        title: 'Scheduled Alert',
        message: 'This alert is scheduled for tomorrow',
        type: 'info',
        recipientIds: [user.id],
        scheduledFor: futureTime.toISOString(),
        sendImmediately: false,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/send`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(alertData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.alert.scheduledFor).toBe(futureTime.toISOString());
      expect(body.data.alert.status).toBe('scheduled');
    });

    it('validates alert type', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/send`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            title: 'Test Alert',
            message: 'Test message',
            type: 'invalid-type', // Should be info, warning, success, error
            recipientIds: [user.id],
          }),
        }
      );

      await expectError(response, 400);
    });

    it('validates recipient IDs', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/send`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            title: 'Test Alert',
            message: 'Test message',
            type: 'info',
            recipientIds: [], // Empty array
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('POST /api-v1/admin/alerts/coupon/create', () => {
    it('creates coupon alert successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      // Create test users
      const user1 = await seedUser({ email: 'coupon1@example.com' });
      const user2 = await seedUser({ email: 'coupon2@example.com' });

      const couponData = {
        amount: 20, // 20% discount
        code: 'WELCOME20',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        recipientIds: [user1.id, user2.id],
        message: "Welcome! Here's a special discount for you.",
        linkedAdIds: [], // No linked ads for this test
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/coupon/create`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(couponData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.coupon).toBeDefined();
      expect(body.data.coupon.code).toBe('WELCOME20');
      expect(body.data.coupon.discountValue).toBe(20);
      expect(body.data.alert).toBeDefined();
      expect(body.data.alert.type).toBe('success');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('auto-generates coupon code when not provided', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const couponData = {
        amount: 15,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        recipientIds: [user.id],
        message: 'Auto-generated coupon',
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/coupon/create`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(couponData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.coupon.code).toBeDefined();
      expect(typeof body.data.coupon.code).toBe('string');
      expect(body.data.coupon.code.length).toBeGreaterThan(0);
    });

    it('validates coupon amount', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/coupon/create`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            amount: -10, // Invalid negative amount
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            recipientIds: [user.id],
          }),
        }
      );

      await expectError(response, 400);
    });

    it('validates expiration date', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/coupon/create`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            amount: 10,
            expiresAt: pastDate.toISOString(), // Past date
            recipientIds: [user.id],
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('GET /api-v1/admin/alerts/history', () => {
    it('returns paginated alert history', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/history?page=1&limit=10`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.alerts).toBeInstanceOf(Array);
      expect(body.data.pagination).toBeDefined();
      expect(body.data.stats).toBeDefined();
      expect(typeof body.data.stats.total).toBe('number');
      expect(typeof body.data.stats.delivered).toBe('number');
      expect(typeof body.data.stats.clicked).toBe('number');
    });

    it('filters alerts by status', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/history?status=delivered`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.alerts).toBeInstanceOf(Array);
      expect(body.data.alerts.every((alert: any) => alert.status === 'delivered')).toBe(true);
    });

    it('filters alerts by type', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/history?type=warning`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.alerts).toBeInstanceOf(Array);
      expect(body.data.alerts.every((alert: any) => alert.type === 'warning')).toBe(true);
    });

    it('includes delivery statistics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/history`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(typeof body.data.stats.sent).toBe('number');
      expect(typeof body.data.stats.delivered).toBe('number');
      expect(typeof body.data.stats.opened).toBe('number');
      expect(typeof body.data.stats.clicked).toBe('number');
    });
  });

  describe('GET /api-v1/admin/alerts/coupons', () => {
    it('returns coupon alerts history', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/coupons?page=1&limit=10`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.coupons).toBeInstanceOf(Array);
      expect(body.data.pagination).toBeDefined();
      expect(body.data.stats).toBeDefined();
      expect(typeof body.data.stats.totalCoupons).toBe('number');
      expect(typeof body.data.stats.redeemed).toBe('number');
      expect(typeof body.data.stats.expired).toBe('number');
    });

    it('includes coupon performance metrics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/coupons`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.byValue).toBeDefined();
      expect(body.data.stats.byCategory).toBeDefined();
      expect(body.data.stats.redemptionRate).toBeDefined();
    });
  });

  describe('POST /api-v1/admin/alerts/bulk-send', () => {
    it('sends bulk alerts to user segments', async () => {
      const { token } = await createAdminAndToken();

      const bulkData = {
        title: 'Bulk Alert',
        message: 'This is a bulk alert to all verified users',
        type: 'info',
        targetSegment: 'verified-users', // Could be: all-users, verified-users, premium-users, etc.
        excludeUserIds: [],
        sendImmediately: true,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/bulk-send`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(bulkData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.alert).toBeDefined();
      expect(body.data.targetedUsers).toBeDefined();
      expect(typeof body.data.targetedUsers).toBe('number');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates target segment', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/bulk-send`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            title: 'Invalid Segment Alert',
            message: 'Test message',
            type: 'info',
            targetSegment: 'invalid-segment',
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('PUT /api-v1/admin/alerts/:id/cancel', () => {
    it('cancels scheduled alert', async () => {
      const { token } = await createAdminAndToken();

      // First create a scheduled alert
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const user = await seedUser();

      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/send`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            title: 'Scheduled Alert',
            message: 'This will be cancelled',
            type: 'info',
            recipientIds: [user.id],
            scheduledFor: futureTime.toISOString(),
            sendImmediately: false,
          }),
        }
      );

      const createBody = await createResponse.json();
      const alertId = createBody.data.alert.id;

      // Cancel the alert
      const cancelResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/${alertId}/cancel`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            reason: 'Maintenance cancelled',
          }),
        }
      );

      const cancelBody = await expectSuccess(cancelResponse, 200);
      expect(cancelBody.data.alert.status).toBe('cancelled');
      expect(cancelBody.data.auditLogId).toBeDefined();
    });

    it('returns 404 for non-existent alert', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/99999/cancel`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            reason: 'Test cancellation',
          }),
        }
      );

      await expectError(response, 404);
    });
  });

  describe('GET /api-v1/admin/alerts/templates', () => {
    it('returns available alert templates', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/templates`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.templates).toBeInstanceOf(Array);

      // Should have common alert templates
      const templateTypes = body.data.templates.map((t: any) => t.type);
      expect(templateTypes).toContain('maintenance');
      expect(templateTypes).toContain('feature-update');
      expect(templateTypes).toContain('policy-change');
    });

    it('includes template details', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/templates`,
        token
      );

      const body = await expectSuccess(response, 200);

      body.data.templates.forEach((template: any) => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.type).toBeDefined();
        expect(template.title).toBeDefined();
        expect(template.message).toBeDefined();
        expect(template.variables).toBeInstanceOf(Array);
      });
    });
  });

  describe('POST /api-v1/admin/alerts/templates/:id/use', () => {
    it('creates alert from template', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const templateData = {
        templateId: 'maintenance',
        variables: {
          startTime: '2 AM UTC',
          endTime: '4 AM UTC',
          date: '2024-01-15',
        },
        recipientIds: [user.id],
        sendImmediately: true,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/templates/maintenance/use`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(templateData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.alert).toBeDefined();
      expect(body.data.alert.title).toContain('maintenance');
      expect(body.data.alert.message).toContain('2 AM UTC');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates template variables', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/templates/maintenance/use`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            templateId: 'maintenance',
            variables: {}, // Missing required variables
            recipientIds: [],
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('GET /api-v1/admin/alerts/stats', () => {
    it('returns alert delivery statistics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/stats?period=month`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.totalSent).toBeDefined();
      expect(body.data.stats.deliveryRate).toBeDefined();
      expect(body.data.stats.openRate).toBeDefined();
      expect(body.data.stats.clickRate).toBeDefined();
      expect(body.data.stats.byType).toBeDefined();
      expect(body.data.stats.byTime).toBeInstanceOf(Array);
    });

    it('includes performance metrics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats.performance).toBeDefined();
      expect(typeof body.data.stats.performance.avgDeliveryTime).toBe('number');
      expect(typeof body.data.stats.performance.optOutRate).toBe('number');
    });
  });

  describe('POST /api-v1/admin/alerts/test', () => {
    it('sends test alert to admin', async () => {
      const { token, admin } = await createAdminAndToken();

      const testData = {
        title: 'Test Alert',
        message: 'This is a test alert',
        type: 'info',
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/test`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(testData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.alert).toBeDefined();
      expect(body.data.sentTo).toBe(admin.id);
      expect(body.data.test).toBe(true);
    });

    it('validates test alert data', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/alerts/test`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            // Missing required fields
          }),
        }
      );

      await expectError(response, 400);
    });
  });
});
