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
} from '../test-helpers';

describe('Admin Ads Moderation API', () => {
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

  describe('GET /api-v1/admin/ads', () => {
    it('returns paginated ads list', async () => {
      const { token } = await createAdminAndToken();

      await seedProduct({ name: 'Test Ad 1', status: 'active' });
      await seedProduct({ name: 'Test Ad 2', status: 'pending' });
      await seedProduct({ name: 'Test Ad 3', status: 'suspended' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads?page=1&limit=10`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ads).toBeInstanceOf(Array);
      expect(body.data.ads.length).toBeGreaterThanOrEqual(3);
      expect(body.data.pagination).toBeDefined();
      expect(body.data.pagination.page).toBe(1);
      expect(body.data.pagination.limit).toBe(10);
      expect(body.data.pagination.total).toBeGreaterThanOrEqual(3);
      expect(body.data.filters).toBeDefined();
      expect(body.data.filters.status).toBeInstanceOf(Array);
      expect(body.data.filters.categories).toBeInstanceOf(Array);
    });

    it('filters ads by status', async () => {
      const { token } = await createAdminAndToken();

      await seedProduct({ name: 'Active Ad', status: 'active' });
      await seedProduct({ name: 'Pending Ad', status: 'pending' });
      await seedProduct({ name: 'Suspended Ad', status: 'suspended' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads?status=pending`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ads).toBeInstanceOf(Array);
      expect(body.data.ads.length).toBe(1);
      expect(body.data.ads[0].status).toBe('pending');
      expect(body.data.ads[0].name).toBe('Pending Ad');
    });

    it('filters ads by date range', async () => {
      const { token } = await createAdminAndToken();

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await seedProduct({ name: 'Recent Ad' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads?dateFrom=${pastDate.toISOString()}&dateTo=${futureDate.toISOString()}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ads).toBeInstanceOf(Array);
      expect(body.data.ads.length).toBeGreaterThanOrEqual(1);
    });

    it('searches ads by seller', async () => {
      const { token } = await createAdminAndToken();

      await seedProduct({ name: 'Seller Ad 1', userId: undefined }); // Will create default user
      await seedProduct({ name: 'Seller Ad 2', userId: undefined }); // Will create another user

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads?sellerId=1`, // First user ID
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ads).toBeInstanceOf(Array);
    });

    it('rejects unauthenticated requests', async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/ads`);

      await expectError(response, 401);
    });
  });

  describe('PUT /api-v1/admin/ads/:id/status', () => {
    it('approves pending ad successfully', async () => {
      const { token } = await createAdminAndToken();
      const product = await seedProduct({ status: 'pending' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/${product.id}/status`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'active',
            reason: 'Ad meets all requirements',
            notes: 'Approved after review',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ad).toBeDefined();
      expect(body.data.ad.status).toBe('active');
      expect(body.data.moderationHistory).toBeDefined();
      expect(body.data.moderationHistory.action).toBe('approve');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('suspends ad with reason', async () => {
      const { token } = await createAdminAndToken();
      const product = await seedProduct({ status: 'active' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/${product.id}/status`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'suspended',
            reason: 'Violation of community guidelines',
            notes: 'Contains prohibited content',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ad.status).toBe('suspended');
      expect(body.data.moderationHistory.action).toBe('suspend');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('rejects ad with feedback', async () => {
      const { token } = await createAdminAndToken();
      const product = await seedProduct({ status: 'pending' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/${product.id}/status`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'rejected',
            reason: 'Incomplete product information',
            notes: 'Please add more product details and better photos',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ad.status).toBe('rejected');
      expect(body.data.moderationHistory.action).toBe('reject');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates status transitions', async () => {
      const { token } = await createAdminAndToken();
      const product = await seedProduct({ status: 'sold' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/${product.id}/status`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'invalid-transition',
          }),
        }
      );

      await expectError(response, 400);
    });

    it('returns 404 for non-existent ad', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/99999/status`,
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
  });

  describe('DELETE /api-v1/admin/ads/:id/images/:imageId', () => {
    it('removes ad image successfully', async () => {
      const { token } = await createAdminAndToken();
      const product = await seedProduct();

      const imageId = 'mock-image-id';

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/${product.id}/images/${imageId}`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({
            reason: 'Image contains prohibited content',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ad).toBeDefined();
      expect(body.data.deletedImageUrl).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates required reason', async () => {
      const { token } = await createAdminAndToken();
      const product = await seedProduct();
      const imageId = 'mock-image-id';

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/${product.id}/images/${imageId}`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({}),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('POST /api-v1/admin/ads/bulk/status', () => {
    it('updates multiple ads status successfully', async () => {
      const { token } = await createAdminAndToken();

      const ad1 = await seedProduct({ status: 'pending' });
      const ad2 = await seedProduct({ status: 'pending' });
      const ad3 = await seedProduct({ status: 'active' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/bulk/status`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            adIds: [ad1.id, ad2.id, ad3.id],
            status: 'active',
            reason: 'Bulk approval of quality ads',
            notes: 'Approved by senior moderator',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.updated).toBe(3);
      expect(body.data.failed).toBe(0);
      expect(body.data.results).toBeInstanceOf(Array);
      expect(body.data.results.length).toBe(3);
      expect(body.data.auditLogIds).toBeInstanceOf(Array);
      expect(body.data.auditLogIds.length).toBe(3);
    });

    it('handles partial failures in bulk update', async () => {
      const { token } = await createAdminAndToken();

      const validAd = await seedProduct({ status: 'pending' });
      const invalidAdId = 'invalid-uuid';

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/bulk/status`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            adIds: [validAd.id, invalidAdId],
            status: 'active',
            reason: 'Bulk approval',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.updated).toBe(1);
      expect(body.data.failed).toBe(1);
      expect(body.data.results).toBeInstanceOf(Array);
      expect(body.data.results.length).toBe(2);

      const validResult = body.data.results.find((r: any) => r.adId === validAd.id);
      const invalidResult = body.data.results.find((r: any) => r.adId === invalidAdId);

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toBeDefined();
    });

    it('validates required fields', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/bulk/status`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            reason: 'Test',
          }),
        }
      );

      await expectError(response, 400);
    });

    it('validates adIds array', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/bulk/status`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            adIds: [], // Empty array
            status: 'active',
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('GET /api-v1/admin/ads/stats', () => {
    it('returns comprehensive ads statistics', async () => {
      const { token } = await createAdminAndToken();

      await seedProduct({ status: 'active' });
      await seedProduct({ status: 'active' });
      await seedProduct({ status: 'pending' });
      await seedProduct({ status: 'pending' });
      await seedProduct({ status: 'suspended' });
      await seedProduct({ status: 'rejected' });

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/ads/stats`, token);

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.total).toBeGreaterThanOrEqual(6);
      expect(body.data.stats.active).toBe(2);
      expect(body.data.stats.pending).toBe(2);
      expect(body.data.stats.suspended).toBe(1);
      expect(body.data.stats.rejected).toBe(1);
      expect(body.data.stats.todayPosted).toBeDefined();
      expect(body.data.stats.weekPosted).toBeDefined();
      expect(body.data.stats.monthPosted).toBeDefined();
      expect(body.data.stats.byCategory).toBeDefined();
      expect(body.data.stats.topSellers).toBeInstanceOf(Array);
      expect(body.data.stats.moderation).toBeDefined();
      expect(body.data.stats.moderation.avgResponseTime).toBeDefined();
      expect(body.data.stats.moderation.pendingCount).toBe(2);
      expect(body.data.stats.moderation.resolvedToday).toBeDefined();
    });

    it('includes top sellers statistics', async () => {
      const { token } = await createAdminAndToken();

      await seedProduct({ status: 'active', userId: undefined }); // User 1
      await seedProduct({ status: 'active', userId: undefined }); // User 2 gets different user
      await seedProduct({ status: 'active', userId: undefined }); // User 3

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/ads/stats`, token);

      const body = await expectSuccess(response, 200);
      expect(body.data.stats.topSellers).toBeInstanceOf(Array);
      if (body.data.stats.topSellers.length > 0) {
        const topSeller = body.data.stats.topSellers[0];
        expect(topSeller.sellerId).toBeDefined();
        expect(topSeller.sellerName).toBeDefined();
        expect(topSeller.adCount).toBeDefined();
      }
    });
  });

  describe('Additional Moderation Endpoints', () => {
    it('GET /api-v1/admin/ads/:id returns detailed ad information', async () => {
      const { token } = await createAdminAndToken();
      const product = await seedProduct();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/${product.id}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ad).toBeDefined();
      expect(body.data.ad.id).toBe(product.id);
      expect(body.data.ad.moderationHistory).toBeInstanceOf(Array);
      expect(body.data.ad.approvalHistory).toBeInstanceOf(Array);
    });

    it('POST /api-v1/admin/ads/:id/feature adds featured status', async () => {
      const { token } = await createAdminAndToken();
      const product = await seedProduct({ status: 'active' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/${product.id}/feature`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            featured: true,
            duration: 7, // days
            reason: 'High quality product',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ad).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('DELETE /api-v1/admin/ads/:id/feature removes featured status', async () => {
      const { token } = await createAdminAndToken();
      const product = await seedProduct({ status: 'active' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/${product.id}/feature`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({
            reason: 'Featured period ended',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ad).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('POST /api-v1/admin/ads/:id/priority sets priority level', async () => {
      const { token } = await createAdminAndToken();
      const product = await seedProduct({ status: 'active' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/${product.id}/priority`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            priority: 'high',
            reason: 'Urgent business listing',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ad).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('GET /api-v1/admin/ads/moderation-queue returns pending ads', async () => {
      const { token } = await createAdminAndToken();

      await seedProduct({ status: 'pending' });
      await seedProduct({ status: 'pending' });
      await seedProduct({ status: 'active' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/moderation-queue`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ads).toBeInstanceOf(Array);
      expect(body.data.ads.length).toBe(2); // Only pending ads
      expect(body.data.ads.every((ad: any) => ad.status === 'pending')).toBe(true);
    });

    it('GET /api-v1/admin/ads/reported returns reported ads', async () => {
      const { token } = await createAdminAndToken();

      await seedProduct({ status: 'active' });
      await seedProduct({ status: 'suspended' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/reported`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ads).toBeInstanceOf(Array);
      expect(body.data.reports).toBeInstanceOf(Array);
    });
  });
});



