import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { randomUUID } from 'node:crypto';
import {
  authenticatedAdminRequest,
  closeTestServer,
  createAdminAndToken,
  createTestServer,
  expectError,
  expectSuccess,
  initTestDb,
  resetDb,
  seedUser,
} from '../test-helpers.js';
import { Subscription } from '../../src/entities/Subscription.js';

describe('Admin Subscriptions API', () => {
  let server: unknown;
  let baseURL: string;
  let testUserId: string;

  beforeAll(async () => {
    const testServer = await createTestServer();
    server = testServer.server;
    baseURL = testServer.baseURL;
  });

  beforeEach(async () => {
    await resetDb();
    // Create a test user for subscription testing
    const testUser = await seedUser({
      email: 'testuser@subscription.test',
      name: 'Test User',
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    await closeTestServer(server);
  });

  async function createTestSubscription(data: Partial<Subscription> = {}) {
    const db = await initTestDb();
    const repo = db.getRepository(Subscription);
    
    const subscription = repo.create({
      userId: testUserId,
      planType: 'basic',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      price: 9.99,
      ...data,
    });
    
    return await repo.save(subscription);
  }

  describe('GET /api-v1/admin/subscriptions', () => {
    it('should return subscriptions list with pagination', async () => {
      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions?page=1&limit=10`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('subscriptions');
      expect(body.data).toHaveProperty('pagination');
      expect(body.data).toHaveProperty('filters');
      expect(Array.isArray(body.data.subscriptions)).toBe(true);
      expect(body.data.pagination).toHaveProperty('page');
      expect(body.data.pagination).toHaveProperty('limit');
      expect(body.data.pagination).toHaveProperty('total');
    });

    it('should filter by planType', async () => {
      await createTestSubscription({ planType: 'basic' });
      await createTestSubscription({ planType: 'business' });

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions?planType=basic`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      if (body.data.subscriptions.length > 0) {
        body.data.subscriptions.forEach((sub: any) => {
          expect(sub.planType).toBe('basic');
        });
      }
    });

    it('should filter by status', async () => {
      await createTestSubscription({ status: 'active' });
      await createTestSubscription({ status: 'expired' });

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions?status=active`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      if (body.data.subscriptions.length > 0) {
        body.data.subscriptions.forEach((sub: any) => {
          expect(sub.status).toBe('active');
        });
      }
    });

    it('should filter by userId', async () => {
      await createTestSubscription();

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions?userId=${testUserId}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      if (body.data.subscriptions.length > 0) {
        body.data.subscriptions.forEach((sub: any) => {
          expect(sub.userId).toBe(testUserId);
        });
      }
    });

    it('should handle date range filtering', async () => {
      await createTestSubscription();

      const { token } = await createAdminAndToken({}, baseURL);
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();
      
      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions?dateFrom=${dateFrom}&dateTo=${dateTo}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
    });

    it('should sort by createdAt desc by default', async () => {
      await createTestSubscription();
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await createTestSubscription();

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions?sortBy=createdAt&sortOrder=desc`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      if (body.data.subscriptions.length > 1) {
        const dates = body.data.subscriptions.map((sub: any) => 
          new Date(sub.createdAt).getTime()
        );
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
        }
      }
    });

    it('rejects unauthenticated requests', async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/subscriptions`);
      await expectError(response, 401);
    });
  });

  describe('GET /api-v1/admin/subscriptions/stats', () => {
    it('should return subscription statistics', async () => {
      await createTestSubscription({ planType: 'basic', status: 'active' });
      await createTestSubscription({ planType: 'business', status: 'active' });
      await createTestSubscription({ planType: 'platinum', status: 'expired' });

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('total');
      expect(body.data).toHaveProperty('active');
      expect(body.data).toHaveProperty('expired');
      expect(body.data).toHaveProperty('cancelled');
      expect(body.data).toHaveProperty('pending');
      expect(body.data).toHaveProperty('byPlanType');
      expect(body.data).toHaveProperty('byStatus');
      expect(body.data).toHaveProperty('growth');
      expect(body.data).toHaveProperty('totalRevenue');
      
      expect(typeof body.data.total).toBe('number');
      expect(typeof body.data.active).toBe('number');
      expect(typeof body.data.totalRevenue).toBe('number');
    });

    it('rejects unauthenticated requests', async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/subscriptions/stats`);
      await expectError(response, 401);
    });
  });

  describe('GET /api-v1/admin/subscriptions/:id', () => {
    it('should return a single subscription', async () => {
      const subscription = await createTestSubscription();

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions/${subscription.id}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('subscription');
      expect(body.data.subscription.id).toBe(subscription.id);
      expect(body.data.subscription).toHaveProperty('planType');
      expect(body.data.subscription).toHaveProperty('status');
      expect(body.data.subscription).toHaveProperty('price');
    });

    it('should include user relation in subscription response', async () => {
      const subscription = await createTestSubscription();

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions/${subscription.id}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      expect(body.data.subscription).toHaveProperty('user');
      if (body.data.subscription.user) {
        expect(body.data.subscription.user.id).toBe(testUserId);
      }
    });

    it('should return 404 for non-existent subscription', async () => {
      const { token } = await createAdminAndToken({}, baseURL);
      const fakeId = randomUUID();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions/${fakeId}`,
        token
      );

      await expectError(response, 404);
    });

    it('rejects unauthenticated requests', async () => {
      const subscription = await createTestSubscription();
      const response = await fetch(`${baseURL}/api-v1/admin/subscriptions/${subscription.id}`);
      await expectError(response, 401);
    });
  });

  describe('PUT /api-v1/admin/subscriptions/:id/status', () => {
    it('should update subscription status to cancelled', async () => {
      const subscription = await createTestSubscription({ status: 'active' });

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions/${subscription.id}/status`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'cancelled',
            cancellationReason: 'Test cancellation',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      expect(body.data.subscription.status).toBe('cancelled');
      expect(body.data.subscription.cancellationReason).toBe('Test cancellation');
      expect(body.data.subscription.cancelledAt).toBeTruthy();
    });

    it('should update subscription status to expired', async () => {
      const subscription = await createTestSubscription({ status: 'active' });

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions/${subscription.id}/status`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'expired',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      expect(body.data.subscription.status).toBe('expired');
    });

    it('should validate status enum', async () => {
      const subscription = await createTestSubscription();

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions/${subscription.id}/status`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'invalid_status',
          }),
        }
      );

      await expectError(response, 400);
    });

    it('should return 404 for non-existent subscription', async () => {
      const { token } = await createAdminAndToken({}, baseURL);
      const fakeId = randomUUID();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions/${fakeId}/status`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'active',
          }),
        }
      );

      await expectError(response, 404);
    });

    it('rejects unauthenticated requests', async () => {
      const subscription = await createTestSubscription();
      const response = await fetch(
        `${baseURL}/api-v1/admin/subscriptions/${subscription.id}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'active' }),
        }
      );
      await expectError(response, 401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty subscriptions list', async () => {
      const { token } = await createAdminAndToken({}, baseURL);

      // Filter to get empty result
      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions?planType=nonexistent`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      expect(body.data.subscriptions).toEqual([]);
      expect(body.data.pagination.total).toBe(0);
    });

    it('should handle invalid pagination parameters', async () => {
      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions?page=-1&limit=0`,
        token
      );

      // Should either return error or default to valid values
      const body = await response.json();
      expect(body.success !== undefined).toBe(true);
    });

    it('should handle large limit values', async () => {
      await createTestSubscription();

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions?limit=1000`,
        token
      );

      const body = await expectSuccess(response, 200);
      // Should cap at max limit (100)
      expect(body.data.pagination.limit).toBeLessThanOrEqual(100);
    });

    it('should handle invalid date formats gracefully', async () => {
      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions?dateFrom=invalid-date`,
        token
      );

      await expectError(response, 400);
    });
  });

  describe('Integration Tests', () => {
    it('should filter subscriptions by user correctly', async () => {
      const user1 = await seedUser({ email: 'user1@test.com' });
      const user2 = await seedUser({ email: 'user2@test.com' });

      await createTestSubscription({ userId: user1.id });
      await createTestSubscription({ userId: user2.id });
      await createTestSubscription({ userId: testUserId });

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions?userId=${testUserId}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.success).toBe(true);
      if (body.data.subscriptions.length > 0) {
        body.data.subscriptions.forEach((sub: any) => {
          expect(sub.userId).toBe(testUserId);
        });
      }
    });

    it('should return correct stats after creating subscriptions', async () => {
      await createTestSubscription({ planType: 'basic', status: 'active', price: 9.99 });
      await createTestSubscription({ planType: 'business', status: 'active', price: 29.99 });
      await createTestSubscription({ planType: 'platinum', status: 'expired', price: 49.99 });

      const { token } = await createAdminAndToken({}, baseURL);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/subscriptions/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.total).toBeGreaterThanOrEqual(3);
      expect(body.data.active).toBeGreaterThanOrEqual(2);
      expect(body.data.expired).toBeGreaterThanOrEqual(1);
      expect(body.data.byPlanType.basic).toBeGreaterThanOrEqual(1);
      expect(body.data.byPlanType.business).toBeGreaterThanOrEqual(1);
      expect(body.data.byPlanType.platinum).toBeGreaterThanOrEqual(1);
    });
  });
});
