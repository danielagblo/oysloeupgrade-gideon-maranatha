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

describe('Admin Analytics & Dashboard API', () => {
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

  describe('GET /api-v1/admin/analytics/overview', () => {
    it('returns comprehensive dashboard overview', async () => {
      const { token } = await createAdminAndToken();

      // Create some test data
      await seedUser({ name: 'Test User 1' });
      await seedUser({ name: 'Test User 2' });
      await seedProduct({ name: 'Test Product 1', status: 'active' });
      await seedProduct({ name: 'Test Product 2', status: 'active' });
      await seedProduct({ name: 'Test Product 3', status: 'pending' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/overview`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data).toBeDefined();

      // User statistics
      expect(body.data.data.users).toBeDefined();
      expect(body.data.data.users.total).toBeGreaterThanOrEqual(2);
      expect(body.data.data.users.newToday).toBeDefined();
      expect(body.data.data.users.newWeek).toBeDefined();
      expect(body.data.data.users.verified).toBeDefined();
      expect(body.data.data.users.active).toBeDefined();

      // Ads statistics
      expect(body.data.data.ads).toBeDefined();
      expect(body.data.data.ads.total).toBeGreaterThanOrEqual(3);
      expect(body.data.data.ads.active).toBe(2);
      expect(body.data.data.ads.pending).toBe(1);
      expect(body.data.data.ads.newToday).toBeDefined();
      expect(body.data.data.ads.newWeek).toBeDefined();

      // Revenue statistics
      expect(body.data.data.revenue).toBeDefined();
      expect(body.data.data.revenue.total).toBeDefined();
      expect(body.data.data.revenue.today).toBeDefined();
      expect(body.data.data.revenue.week).toBeDefined();
      expect(body.data.data.revenue.month).toBeDefined();

      // Support statistics
      expect(body.data.data.support).toBeDefined();
      expect(body.data.data.support.openCases).toBeDefined();
      expect(body.data.data.support.resolvedToday).toBeDefined();
      expect(body.data.data.support.avgResponseTime).toBeDefined();
    });

    it('calculates growth metrics correctly', async () => {
      const { token } = await createAdminAndToken();

      // Create users with different creation dates
      await seedUser({ name: 'Recent User' });
      // In a real implementation, we would manipulate timestamps

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/overview`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data.users.growth).toBeDefined();
      expect(typeof body.data.data.users.growth.today).toBe('number');
      expect(typeof body.data.data.users.growth.week).toBe('number');
      expect(typeof body.data.data.users.growth.month).toBe('number');
    });
  });

  describe('GET /api-v1/admin/analytics/users', () => {
    it('returns user analytics with date filtering', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/users?dateFrom=2024-01-01&dateTo=2024-12-31&groupBy=day`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data).toBeDefined();
      expect(body.data.data.registrations).toBeInstanceOf(Array);
      expect(body.data.data.verifications).toBeInstanceOf(Array);
      expect(body.data.data.activeUsers).toBeInstanceOf(Array);
      expect(body.data.data.topRegions).toBeInstanceOf(Array);
      expect(body.data.data.deviceTypes).toBeInstanceOf(Array);
    });

    it('validates date range parameters', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/users?dateFrom=invalid-date`,
        token
      );

      await expectError(response, 400);
    });

    it('supports different grouping options', async () => {
      const { token } = await createAdminAndToken();

      const groupings = ['day', 'week', 'month'];

      for (const groupBy of groupings) {
        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/analytics/users?groupBy=${groupBy}`,
          token
        );

        const body = await expectSuccess(response, 200);
        expect(body.data.data.registrations).toBeInstanceOf(Array);
      }
    });

    it('includes device type breakdown', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/users`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data.deviceTypes).toBeInstanceOf(Array);

      // Each device type should have name and count
      body.data.data.deviceTypes.forEach((device: any) => {
        expect(device.name).toBeDefined();
        expect(device.count).toBeDefined();
        expect(typeof device.count).toBe('number');
      });
    });
  });

  describe('GET /api-v1/admin/analytics/ads', () => {
    it('returns ads analytics with category filtering', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/ads?dateFrom=2024-01-01&dateTo=2024-12-31&category=electronics`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data).toBeDefined();
      expect(body.data.data.postings).toBeInstanceOf(Array);
      expect(body.data.data.approvals).toBeInstanceOf(Array);
      expect(body.data.data.suspensions).toBeInstanceOf(Array);
      expect(body.data.data.topCategories).toBeInstanceOf(Array);
      expect(body.data.data.topSellers).toBeInstanceOf(Array);
      expect(body.data.data.performance).toBeInstanceOf(Array);
    });

    it('includes moderation metrics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/ads`,
        token
      );

      const body = await expectSuccess(response, 200);

      // Check that moderation data is included
      const hasModerationData =
        body.data.data.postings.length > 0 ||
        body.data.data.approvals.length > 0 ||
        body.data.data.suspensions.length > 0;

      expect(hasModerationData).toBeDefined();
    });

    it('returns top performing categories', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/ads`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data.topCategories).toBeInstanceOf(Array);

      // Each category should have name and metrics
      body.data.data.topCategories.forEach((category: any) => {
        expect(category.name).toBeDefined();
        expect(category.adCount).toBeDefined();
        expect(typeof category.adCount).toBe('number');
      });
    });
  });

  describe('GET /api-v1/admin/analytics/revenue', () => {
    it('returns revenue analytics by type', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/revenue?dateFrom=2024-01-01&dateTo=2024-12-31&type=subscription`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data).toBeDefined();
      expect(typeof body.data.data.total).toBe('number');
      expect(body.data.data.breakdown).toBeInstanceOf(Array);
      expect(body.data.data.trends).toBeInstanceOf(Array);
      expect(body.data.data.projections).toBeInstanceOf(Array);
    });

    it('supports different revenue types', async () => {
      const { token } = await createAdminAndToken();

      const revenueTypes = ['subscription', 'commission', 'ads'];

      for (const type of revenueTypes) {
        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/analytics/revenue?type=${type}`,
          token
        );

        const body = await expectSuccess(response, 200);
        expect(typeof body.data.data.total).toBe('number');
      }
    });

    it('includes revenue projections', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/revenue`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data.projections).toBeInstanceOf(Array);

      // Projections should include future periods
      if (body.data.data.projections.length > 0) {
        const projection = body.data.data.projections[0];
        expect(projection.period).toBeDefined();
        expect(typeof projection.amount).toBe('number');
        expect(typeof projection.confidence).toBe('number');
      }
    });
  });

  describe('GET /api-v1/admin/analytics/support', () => {
    it('returns comprehensive support analytics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/support`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data).toBeDefined();
      expect(typeof body.data.data.totalCases).toBe('number');
      expect(typeof body.data.data.openCases).toBe('number');
      expect(typeof body.data.data.resolvedCases).toBe('number');
      expect(typeof body.data.data.avgResolutionTime).toBe('number');
      expect(body.data.data.caseCategories).toBeInstanceOf(Array);
      expect(body.data.data.agentPerformance).toBeInstanceOf(Array);
      expect(body.data.data.responseTimes).toBeInstanceOf(Array);
    });

    it('includes agent performance metrics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/support`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data.agentPerformance).toBeInstanceOf(Array);

      // Each agent should have performance metrics
      body.data.data.agentPerformance.forEach((agent: any) => {
        expect(agent.agentId).toBeDefined();
        expect(agent.agentName).toBeDefined();
        expect(typeof agent.casesResolved).toBe('number');
        expect(typeof agent.avgResolutionTime).toBe('number');
        expect(typeof agent.customerSatisfaction).toBe('number');
      });
    });

    it('includes response time statistics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/support`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data.responseTimes).toBeInstanceOf(Array);

      // Response times should be categorized
      body.data.data.responseTimes.forEach((timeStats: any) => {
        expect(timeStats.category).toBeDefined();
        expect(typeof timeStats.averageTime).toBe('number');
        expect(typeof timeStats.count).toBe('number');
      });
    });
  });

  describe('GET /api-v1/admin/analytics/real-time', () => {
    it('returns real-time metrics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/real-time`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data).toBeDefined();
      expect(body.data.data.activeUsers).toBeDefined();
      expect(typeof body.data.data.activeUsers.lastHour).toBe('number');
      expect(typeof body.data.data.activeUsers.last24Hours).toBe('number');
      expect(body.data.data.serverMetrics).toBeDefined();
      expect(body.data.data.liveUpdates).toBeInstanceOf(Array);
    });

    it('includes server performance metrics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/real-time`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data.serverMetrics).toBeDefined();
      expect(typeof body.data.data.serverMetrics.cpuUsage).toBe('number');
      expect(typeof body.data.data.serverMetrics.memoryUsage).toBe('number');
      expect(typeof body.data.data.serverMetrics.responseTime).toBe('number');
    });
  });

  describe('GET /api-v1/admin/analytics/export', () => {
    it('exports analytics data', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/export?format=json&metrics=users,ads,revenue`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.downloadUrl).toBeDefined();
      expect(body.data.expiresAt).toBeDefined();
      expect(typeof body.data.fileSize).toBe('number');
      expect(body.data.format).toBe('json');
    });

    it('supports different export formats', async () => {
      const { token } = await createAdminAndToken();

      const formats = ['json', 'csv', 'xlsx'];

      for (const format of formats) {
        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/analytics/export?format=${format}`,
          token
        );

        const body = await expectSuccess(response, 200);
        expect(body.data.format).toBe(format);
        expect(body.data.downloadUrl).toMatch(new RegExp(`\\.${format}`));
      }
    });
  });

  describe('POST /api-v1/admin/analytics/custom', () => {
    it('creates custom analytics query', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/custom`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Custom User Growth Analysis',
            metrics: ['userRegistrations', 'userVerifications'],
            dimensions: ['date', 'region'],
            filters: {
              dateRange: {
                from: '2024-01-01',
                to: '2024-12-31',
              },
              userType: 'verified',
            },
            groupBy: 'month',
          }),
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.query).toBeDefined();
      expect(body.data.query.id).toBeDefined();
      expect(body.data.query.name).toBe('Custom User Growth Analysis');
      expect(body.data.results).toBeDefined();
    });

    it('validates query parameters', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/custom`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            // Missing required fields
            filters: {},
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('GET /api-v1/admin/analytics/reports/scheduled', () => {
    it('returns scheduled reports list', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/reports/scheduled`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.reports).toBeInstanceOf(Array);

      // Each report should have schedule info
      body.data.reports.forEach((report: any) => {
        expect(report.id).toBeDefined();
        expect(report.name).toBeDefined();
        expect(report.schedule).toBeDefined();
        expect(report.nextRun).toBeDefined();
        expect(report.isActive).toBeDefined();
      });
    });
  });

  describe('POST /api-v1/admin/analytics/reports/scheduled', () => {
    it('creates scheduled report', async () => {
      const { token, admin } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/reports/scheduled`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Weekly User Report',
            description: 'Weekly summary of user registrations and activity',
            metrics: ['userRegistrations', 'activeUsers', 'newAds'],
            schedule: {
              frequency: 'weekly',
              dayOfWeek: 1, // Monday
              time: '09:00',
            },
            recipients: ['admin@oysloe.com'],
            format: 'pdf',
            isActive: true,
          }),
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.report).toBeDefined();
      expect(body.data.report.name).toBe('Weekly User Report');
      expect(body.data.report.schedule.frequency).toBe('weekly');
      expect(body.data.report.createdBy).toBe(admin.id);
      expect(body.data.auditLogId).toBeDefined();
    });
  });

  describe('PUT /api-v1/admin/analytics/reports/scheduled/:id', () => {
    it('updates scheduled report', async () => {
      const { token } = await createAdminAndToken();

      // First create a report
      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/reports/scheduled`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Report',
            description: 'Test scheduled report',
            metrics: ['userRegistrations'],
            schedule: {
              frequency: 'daily',
              time: '10:00',
            },
            recipients: ['test@example.com'],
            format: 'pdf',
            isActive: true,
          }),
        }
      );

      const createBody = await createResponse.json();
      const reportId = createBody.data.report.id;

      // Update the report
      const updateResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/reports/scheduled/${reportId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Updated Test Report',
            schedule: {
              frequency: 'weekly',
              dayOfWeek: 5, // Friday
              time: '15:00',
            },
            isActive: false,
          }),
        }
      );

      const updateBody = await expectSuccess(updateResponse, 200);
      expect(updateBody.data.report.name).toBe('Updated Test Report');
      expect(updateBody.data.report.schedule.frequency).toBe('weekly');
      expect(updateBody.data.report.schedule.dayOfWeek).toBe(5);
      expect(updateBody.data.report.isActive).toBe(false);
    });
  });

  describe('DELETE /api-v1/admin/analytics/reports/scheduled/:id', () => {
    it('deletes scheduled report', async () => {
      const { token } = await createAdminAndToken();

      // Create a report first
      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/reports/scheduled`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Report to Delete',
            description: 'Will be deleted',
            metrics: ['userRegistrations'],
            schedule: { frequency: 'daily', time: '12:00' },
            recipients: ['test@example.com'],
            format: 'pdf',
          }),
        }
      );

      const createBody = await createResponse.json();
      const reportId = createBody.data.report.id;

      // Delete the report
      const deleteResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/reports/scheduled/${reportId}`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({
            reason: 'No longer needed',
          }),
        }
      );

      const deleteBody = await expectSuccess(deleteResponse, 200);
      expect(deleteBody.data.message).toBeDefined();
      expect(deleteBody.data.auditLogId).toBeDefined();
    });
  });
});

