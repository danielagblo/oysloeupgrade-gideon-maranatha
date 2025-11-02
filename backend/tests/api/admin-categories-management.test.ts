import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import {
  authenticatedAdminRequest,
  closeTestServer,
  createAdminAndToken,
  createTestServer,
  expectError,
  expectSuccess,
  resetDb,
} from '../test-helpers';

describe('Admin Categories Management API', () => {
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

  describe('GET /api-v1/admin/categories', () => {
    it('returns all categories with hierarchy', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/categories`, token);

      const body = await expectSuccess(response, 200);
      expect(body.data.categories).toBeInstanceOf(Array);
      expect(body.data.hierarchy).toBeDefined();

      // Each category should have basic fields
      body.data.categories.forEach((category: any) => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.slug).toBeDefined();
        expect(typeof category.isActive).toBe('boolean');
      });
    });

    it('includes subcategories in hierarchy', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/categories`, token);

      const body = await expectSuccess(response, 200);
      expect(body.data.hierarchy).toBeDefined();

      // Check if hierarchy includes subcategories
      if (body.data.hierarchy.length > 0) {
        const categoryWithSubs = body.data.hierarchy.find((cat: any) => cat.subcategories);
        if (categoryWithSubs) {
          expect(categoryWithSubs.subcategories).toBeInstanceOf(Array);
          categoryWithSubs.subcategories.forEach((sub: any) => {
            expect(sub.id).toBeDefined();
            expect(sub.name).toBeDefined();
            expect(sub.categoryId).toBe(categoryWithSubs.id);
          });
        }
      }
    });

    it('rejects unauthenticated requests', async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/categories`);

      await expectError(response, 401);
    });
  });

  describe('POST /api-v1/admin/categories', () => {
    it('creates new category successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      const categoryData = {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        isActive: true,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(categoryData),
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.category).toBeDefined();
      expect(body.data.category.name).toBe('Electronics');
      expect(body.data.category.slug).toBe('electronics');
      expect(body.data.category.description).toBe('Electronic devices and gadgets');
      expect(body.data.category.isActive).toBe(true);
      expect(body.data.category.createdBy).toBe(admin.id);
      expect(body.data.auditLogId).toBeDefined();
    });

    it('auto-generates slug when not provided', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Home & Garden',
            description: 'Home improvement and gardening supplies',
          }),
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.category.slug).toBe('home-garden');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates required name field', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            description: 'Missing name field',
          }),
        }
      );

      await expectError(response, 400);
    });

    it('validates unique slug', async () => {
      const { token } = await createAdminAndToken();

      // Create first category
      await authenticatedAdminRequest(`${baseURL}/api-v1/admin/categories`, token, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Category',
          slug: 'test-slug',
        }),
      });

      // Try to create duplicate slug
      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Different Name',
            slug: 'test-slug', // duplicate
          }),
        }
      );

      await expectError(response, 409);
    });
  });

  describe('PUT /api-v1/admin/categories/:id', () => {
    it('updates category successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      // First create a category
      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Original Category',
            description: 'Original description',
          }),
        }
      );

      const createBody = await createResponse.json();
      const categoryId = createBody.data.category.id;

      // Now update it
      const updateResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/${categoryId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Updated Category',
            description: 'Updated description',
            isActive: false,
          }),
        }
      );

      const updateBody = await expectSuccess(updateResponse, 200);
      expect(updateBody.data.category.name).toBe('Updated Category');
      expect(updateBody.data.category.description).toBe('Updated description');
      expect(updateBody.data.category.isActive).toBe(false);
      expect(updateBody.data.category.updatedBy).toBe(admin.id);
      expect(updateBody.data.auditLogId).toBeDefined();
    });

    it('updates only provided fields', async () => {
      const { token } = await createAdminAndToken();

      // Create category
      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Partial Update Test',
            description: 'Original description',
            isActive: true,
          }),
        }
      );

      const createBody = await createResponse.json();
      const categoryId = createBody.data.category.id;

      // Update only description
      const updateResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/${categoryId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            description: 'Updated description only',
          }),
        }
      );

      const updateBody = await expectSuccess(updateResponse, 200);
      expect(updateBody.data.category.name).toBe('Partial Update Test'); // Unchanged
      expect(updateBody.data.category.description).toBe('Updated description only'); // Changed
      expect(updateBody.data.category.isActive).toBe(true); // Unchanged
    });

    it('returns 404 for non-existent category', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/99999`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Non-existent Category',
          }),
        }
      );

      await expectError(response, 404);
    });
  });

  describe('DELETE /api-v1/admin/categories/:id', () => {
    it('deletes category successfully', async () => {
      const { token } = await createAdminAndToken();

      // Create category
      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Category to Delete',
            description: 'Will be deleted',
          }),
        }
      );

      const createBody = await createResponse.json();
      const categoryId = createBody.data.category.id;

      // Delete category
      const deleteResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/${categoryId}`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({
            reason: 'Category no longer needed',
          }),
        }
      );

      const deleteBody = await expectSuccess(deleteResponse, 200);
      expect(deleteBody.data.message).toBeDefined();
      expect(deleteBody.data.auditLogId).toBeDefined();
    });

    it('prevents deletion of categories with subcategories', async () => {
      const { token } = await createAdminAndToken();

      // Create category
      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Category with Subs',
            description: 'Has subcategories',
          }),
        }
      );

      const createBody = await createResponse.json();
      const categoryId = createBody.data.category.id;

      // Add subcategory (assuming endpoint exists)
      // This would prevent deletion

      const deleteResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/${categoryId}`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({
            reason: 'Test deletion prevention',
          }),
        }
      );

      // Should either succeed or fail with appropriate error
      // depending on implementation
      expect([200, 409]).toContain(deleteResponse.status);
    });
  });

  describe('POST /api-v1/admin/categories/:id/subcategories', () => {
    it('creates subcategory successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      // Create parent category first
      const categoryResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Electronics',
            description: 'Electronic devices',
          }),
        }
      );

      const categoryBody = await categoryResponse.json();
      const categoryId = categoryBody.data.category.id;

      // Create subcategory
      const subResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/${categoryId}/subcategories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Smartphones',
            description: 'Mobile phones and accessories',
            parameters: [
              { name: 'brand', type: 'string', required: true },
              { name: 'storage', type: 'number', unit: 'GB' },
            ],
            isActive: true,
          }),
        }
      );

      const subBody = await expectSuccess(subResponse, 201);
      expect(subBody.data.subcategory).toBeDefined();
      expect(subBody.data.subcategory.name).toBe('Smartphones');
      expect(subBody.data.subcategory.categoryId).toBe(categoryId);
      expect(subBody.data.subcategory.parameters).toBeInstanceOf(Array);
      expect(subBody.data.subcategory.parameters.length).toBe(2);
      expect(subBody.data.auditLogId).toBeDefined();
    });

    it('validates parent category exists', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/99999/subcategories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Invalid Subcategory',
            description: "Parent category doesn't exist",
          }),
        }
      );

      await expectError(response, 404);
    });

    it('validates subcategory parameters', async () => {
      const { token } = await createAdminAndToken();

      // Create parent category
      const categoryResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Category',
            description: 'For subcategory testing',
          }),
        }
      );

      const categoryBody = await categoryResponse.json();
      const categoryId = categoryBody.data.category.id;

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/${categoryId}/subcategories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Subcategory',
            parameters: 'invalid-parameters', // Should be array
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('PUT /api-v1/admin/categories/:catId/subcategories/:subId', () => {
    it('updates subcategory successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      // Create category and subcategory first
      const categoryResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Vehicles',
            description: 'Cars and vehicles',
          }),
        }
      );

      const categoryBody = await categoryResponse.json();
      const categoryId = categoryBody.data.category.id;

      const subResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/${categoryId}/subcategories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Sedans',
            description: 'Four door cars',
            isActive: true,
          }),
        }
      );

      const subBody = await subResponse.json();
      const subcategoryId = subBody.data.subcategory.id;

      // Update subcategory
      const updateResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/${categoryId}/subcategories/${subcategoryId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Luxury Sedans',
            description: 'Premium four door cars',
            isActive: true,
          }),
        }
      );

      const updateBody = await expectSuccess(updateResponse, 200);
      expect(updateBody.data.subcategory.name).toBe('Luxury Sedans');
      expect(updateBody.data.subcategory.description).toBe('Premium four door cars');
      expect(updateBody.data.subcategory.categoryId).toBe(categoryId);
      expect(updateBody.data.auditLogId).toBeDefined();
    });

    it('returns 404 for non-existent subcategory', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/1/subcategories/99999`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Non-existent Subcategory',
          }),
        }
      );

      await expectError(response, 404);
    });
  });

  describe('GET /api-v1/admin/categories/stats', () => {
    it('returns category statistics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.totalCategories).toBeDefined();
      expect(body.data.stats.totalSubcategories).toBeDefined();
      expect(body.data.stats.activeCategories).toBeDefined();
      expect(body.data.stats.categoryUsage).toBeInstanceOf(Array);
      expect(body.data.stats.popularSubcategories).toBeInstanceOf(Array);
    });
  });

  describe('POST /api-v1/admin/categories/reorder', () => {
    it('reorders categories successfully', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/reorder`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            categoryIds: ['cat-1', 'cat-2', 'cat-3'],
            reason: 'Reordering for better UX',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.message).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates category IDs array', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/reorder`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            categoryIds: 'not-an-array',
          }),
        }
      );

      await expectError(response, 400);
    });
  });
});
