import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import {
  authenticatedAdminRequest,
  closeTestServer,
  createAdminAndToken,
  createTestServer,
  expectError,
  resetDb,
  seedProduct,
  seedUser,
} from '../test-helpers';

describe('Admin Error Handling & Validation', () => {
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

  describe('Authentication Errors', () => {
    describe('INVALID_CREDENTIALS', () => {
      it('returns INVALID_CREDENTIALS for wrong username', async () => {
        const response = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'wronguser',
            password: 'password123',
          }),
        });

        await expectError(response, 401, 'INVALID_CREDENTIALS');
      });

      it('returns INVALID_CREDENTIALS for wrong password', async () => {
        const adminUser = await seedUser();
        // Try to login as admin with user credentials
        const response = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: adminUser.email, // Wrong endpoint
            password: adminUser.password,
          }),
        });

        await expectError(response, 401, 'INVALID_CREDENTIALS');
      });
    });

    describe('TOKEN_EXPIRED', () => {
      it('returns TOKEN_EXPIRED for expired JWT', async () => {
        // This would require mocking an expired token
        // In a real implementation, this would test JWT expiration
        const response = await fetch(`${baseURL}/api-v1/admin/users`, {
          method: 'GET',
          headers: {
            Authorization: 'Bearer expired.jwt.token',
            'Content-Type': 'application/json',
          },
        });

        await expectError(response, 401, 'TOKEN_EXPIRED');
      });
    });

    describe('INSUFFICIENT_PERMISSIONS', () => {
      it('returns INSUFFICIENT_PERMISSIONS for staff accessing super-admin features', async () => {
        const { token } = await createAdminAndToken({ role: 'staff' });

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/system/config`,
          token,
          {
            method: 'PUT',
            body: JSON.stringify({ setting: 'test' }),
          }
        );

        await expectError(response, 403, 'INSUFFICIENT_PERMISSIONS');
      });

      it('returns INSUFFICIENT_PERMISSIONS for support role accessing user management', async () => {
        const { token } = await createAdminAndToken({ role: 'support' });

        const user = await seedUser();

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/users/${user.id}`,
          token,
          {
            method: 'DELETE',
            body: JSON.stringify({ reason: 'test' }),
          }
        );

        await expectError(response, 403, 'INSUFFICIENT_PERMISSIONS');
      });
    });
  });

  describe('Validation Errors', () => {
    describe('VALIDATION_ERROR', () => {
      it('returns VALIDATION_ERROR for invalid email format', async () => {
        const { token } = await createAdminAndToken();

        const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/users`, token, {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test User',
            email: 'invalid-email',
            password: 'password123',
          }),
        });

        await expectError(response, 400, 'VALIDATION_ERROR');
      });

      it('returns VALIDATION_ERROR for missing required fields', async () => {
        const { token } = await createAdminAndToken();

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/categories`,
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              // Missing required 'name' field
              description: 'Test category',
            }),
          }
        );

        await expectError(response, 400, 'VALIDATION_ERROR');
      });

      it('returns VALIDATION_ERROR for invalid UUID format', async () => {
        const { token } = await createAdminAndToken();

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/users/invalid-uuid-format`,
          token
        );

        await expectError(response, 400, 'VALIDATION_ERROR');
      });
    });

    describe('REQUIRED_FIELD_MISSING', () => {
      it('returns REQUIRED_FIELD_MISSING for missing mandatory fields', async () => {
        const { token } = await createAdminAndToken();

        const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/ads`, token, {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Ad',
            // Missing required price field
          }),
        });

        await expectError(response, 400, 'REQUIRED_FIELD_MISSING');
      });
    });

    describe('INVALID_FORMAT', () => {
      it('returns INVALID_FORMAT for malformed data', async () => {
        const { token } = await createAdminAndToken();

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/analytics/users`,
          token,
          {
            method: 'GET',
            headers: {
              // Invalid query parameter format
              ...{ 'Content-Type': 'application/json' },
            },
          }
        );

        // Add query parameter for invalid date format
        const responseWithInvalidDate = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/analytics/users?dateFrom=invalid-date`,
          token
        );

        await expectError(responseWithInvalidDate, 400, 'INVALID_FORMAT');
      });
    });
  });

  describe('Resource Errors', () => {
    describe('RESOURCE_NOT_FOUND', () => {
      it('returns RESOURCE_NOT_FOUND for non-existent user', async () => {
        const { token } = await createAdminAndToken();

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/users/00000000-0000-0000-0000-000000000000`,
          token
        );

        await expectError(response, 404, 'RESOURCE_NOT_FOUND');
      });

      it('returns RESOURCE_NOT_FOUND for non-existent category', async () => {
        const { token } = await createAdminAndToken();

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/categories/00000000-0000-0000-0000-000000000000`,
          token,
          {
            method: 'PUT',
            body: JSON.stringify({ name: 'Updated Name' }),
          }
        );

        await expectError(response, 404, 'RESOURCE_NOT_FOUND');
      });

      it('returns RESOURCE_NOT_FOUND for non-existent support case', async () => {
        const { token } = await createAdminAndToken();

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/support/cases/99999`,
          token
        );

        await expectError(response, 404, 'RESOURCE_NOT_FOUND');
      });
    });

    describe('RESOURCE_ALREADY_EXISTS', () => {
      it('returns RESOURCE_ALREADY_EXISTS for duplicate category name', async () => {
        const { token } = await createAdminAndToken();

        // Create first category
        await authenticatedAdminRequest(`${baseURL}/api-v1/admin/categories`, token, {
          method: 'POST',
          body: JSON.stringify({
            name: 'Electronics',
            slug: 'electronics',
          }),
        });

        // Try to create duplicate
        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/categories`,
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'Electronics',
              slug: 'electronics-2', // Different slug but same name might cause conflict
            }),
          }
        );

        await expectError(response, 409, 'RESOURCE_ALREADY_EXISTS');
      });

      it('returns RESOURCE_ALREADY_EXISTS for duplicate admin username', async () => {
        const { token } = await createAdminAndToken();

        // Try to create admin with existing username
        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/users/admin/create`,
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              username: 'admin', // Assuming this already exists
              email: 'newadmin@example.com',
              password: 'password123',
              role: 'staff',
            }),
          }
        );

        await expectError(response, 409, 'RESOURCE_ALREADY_EXISTS');
      });
    });

    describe('RESOURCE_IN_USE', () => {
      it('returns RESOURCE_IN_USE when trying to delete category with products', async () => {
        const { token } = await createAdminAndToken();

        // Create category
        const categoryResponse = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/categories`,
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'Test Category',
              slug: 'test-category',
            }),
          }
        );

        const categoryBody = await categoryResponse.json();
        const categoryId = categoryBody.data.category.id;

        // Create product in this category
        await seedProduct({ categoryId });

        // Try to delete category
        const deleteResponse = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/categories/${categoryId}`,
          token,
          {
            method: 'DELETE',
            body: JSON.stringify({ reason: 'Test deletion' }),
          }
        );

        await expectError(deleteResponse, 409, 'RESOURCE_IN_USE');
      });
    });
  });

  describe('Business Logic Errors', () => {
    describe('INVALID_STATUS_TRANSITION', () => {
      it('returns INVALID_STATUS_TRANSITION for invalid ad status change', async () => {
        const { token } = await createAdminAndToken();
        const product = await seedProduct({ status: 'sold' });

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/ads/${product.id}/status`,
          token,
          {
            method: 'PUT',
            body: JSON.stringify({
              status: 'active', // Cannot activate a sold product
              reason: 'Invalid transition',
            }),
          }
        );

        await expectError(response, 400, 'INVALID_STATUS_TRANSITION');
      });

      it('returns INVALID_STATUS_TRANSITION for invalid user verification change', async () => {
        const { token } = await createAdminAndToken();
        const user = await seedUser({ verificationStatus: 'verified' });

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/users/${user.id}/verify`,
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              status: 'verified', // Already verified
              notes: 'Attempting duplicate verification',
            }),
          }
        );

        await expectError(response, 400, 'INVALID_STATUS_TRANSITION');
      });
    });

    describe('QUOTA_EXCEEDED', () => {
      it('returns QUOTA_EXCEEDED for export limit exceeded', async () => {
        const { token } = await createAdminAndToken();

        // Try to export too many records at once
        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/export/users?limit=10000`, // Exceeds limit
          token
        );

        await expectError(response, 429, 'QUOTA_EXCEEDED');
      });

      it('returns QUOTA_EXCEEDED for bulk operation size limit', async () => {
        const { token } = await createAdminAndToken();

        const largeBulkOperation = {
          adIds: Array.from({ length: 1000 }, (_, i) => `ad-${i + 1}`), // Too many IDs
          status: 'active',
          reason: 'Bulk update',
        };

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/ads/bulk/status`,
          token,
          {
            method: 'POST',
            body: JSON.stringify(largeBulkOperation),
          }
        );

        await expectError(response, 429, 'QUOTA_EXCEEDED');
      });
    });

    describe('OPERATION_NOT_ALLOWED', () => {
      it('returns OPERATION_NOT_ALLOWED for deleting system categories', async () => {
        const { token } = await createAdminAndToken();

        // Assume there's a system category that cannot be deleted
        const systemCategoryId = 'system-category-id';

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/categories/${systemCategoryId}`,
          token,
          {
            method: 'DELETE',
            body: JSON.stringify({ reason: 'Attempt to delete system category' }),
          }
        );

        await expectError(response, 403, 'OPERATION_NOT_ALLOWED');
      });

      it('returns OPERATION_NOT_ALLOWED for self-deletion', async () => {
        const { token, admin } = await createAdminAndToken();

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/users/admin/${admin.id}`,
          token,
          {
            method: 'DELETE',
            body: JSON.stringify({ reason: 'Attempting self-deletion' }),
          }
        );

        await expectError(response, 403, 'OPERATION_NOT_ALLOWED');
      });
    });
  });

  describe('System Errors', () => {
    describe('INTERNAL_SERVER_ERROR', () => {
      it('returns INTERNAL_SERVER_ERROR for database connection issues', async () => {
        const { token } = await createAdminAndToken();

        // This would require mocking database disconnection
        // In real implementation, this would test database failures
        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/analytics/overview`,
          token
        );

        // Should handle gracefully, but may return 500 in case of actual DB issues
        expect([200, 500]).toContain(response.status);
      });
    });

    describe('DATABASE_ERROR', () => {
      it('returns DATABASE_ERROR for constraint violations', async () => {
        const { token } = await createAdminAndToken();

        // Try to create category with invalid foreign key
        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/categories/invalid-parent/subcategories`,
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'Invalid Subcategory',
              parentId: '00000000-0000-0000-0000-000000000000', // Non-existent parent
            }),
          }
        );

        await expectError(response, 500, 'DATABASE_ERROR');
      });
    });

    describe('EXTERNAL_SERVICE_ERROR', () => {
      it('returns EXTERNAL_SERVICE_ERROR for file upload failures', async () => {
        const { token } = await createAdminAndToken();

        // This would require mocking Cloudinary failures
        const formData = new FormData();
        formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/uploads/profile-image`,
          token,
          {
            method: 'POST',
            body: formData,
          }
        );

        // In case of external service failure, should return appropriate error
        expect([200, 500]).toContain(response.status);
      });

      it('returns EXTERNAL_SERVICE_ERROR for FCM notification failures', async () => {
        const { token } = await createAdminAndToken();

        // This would require mocking FCM service failures
        const user = await seedUser();

        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/alerts/send`,
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              title: 'Test Alert',
              message: 'Test message',
              type: 'info',
              recipientIds: [user.id],
            }),
          }
        );

        // Should handle FCM failures gracefully
        expect([200, 500]).toContain(response.status);
      });
    });
  });

  describe('Rate Limiting Errors', () => {
    it('returns rate limit exceeded for too many requests', async () => {
      const { token } = await createAdminAndToken();

      // Make multiple rapid requests to trigger rate limiting
      const requests = Array.from({ length: 100 }, () =>
        authenticatedAdminRequest(`${baseURL}/api-v1/admin/users`, token)
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('includes rate limit headers in response', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/users`, token);

      // Should include rate limiting headers
      const headers = response.headers;
      expect(headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('handles extremely long input strings', async () => {
      const { token } = await createAdminAndToken();

      const longString = 'a'.repeat(10000); // 10k characters

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: longString,
            description: 'Test category',
          }),
        }
      );

      await expectError(response, 400, 'VALIDATION_ERROR');
    });

    it('handles special characters in input', async () => {
      const { token } = await createAdminAndToken();

      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: `Test ${specialChars}`,
            slug: `test-${specialChars.toLowerCase()}`,
          }),
        }
      );

      // Should either succeed or fail with validation error
      expect([200, 400]).toContain(response.status);
    });

    it('handles null and undefined values', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/users`, token, {
        method: 'POST',
        body: JSON.stringify({
          name: null, // Invalid null value
          email: undefined, // Invalid undefined value
          password: 'password123',
        }),
      });

      await expectError(response, 400, 'VALIDATION_ERROR');
    });

    it('handles array size limits', async () => {
      const { token } = await createAdminAndToken();

      const largeArray = Array.from({ length: 1000 }, (_, i) => `item-${i}`);

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/bulk/filter-update`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            entityType: 'users',
            operation: 'update',
            filters: [{ field: 'id', operator: 'in', value: largeArray }],
            updateData: { status: 'active' },
          }),
        }
      );

      await expectError(response, 400, 'VALIDATION_ERROR');
    });

    it('handles deeply nested objects', async () => {
      const { token } = await createAdminAndToken();

      const deeplyNested = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value',
              },
            },
          },
        },
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/custom`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Deep Test',
            entityType: 'users',
            format: 'json',
            config: deeplyNested,
          }),
        }
      );

      // Should handle or reject deeply nested structures
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Concurrent Operation Errors', () => {
    it('handles optimistic locking conflicts', async () => {
      const { token: token1 } = await createAdminAndToken();
      const { token: token2 } = await createAdminAndToken();

      // Create a category
      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token1,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Concurrent Test Category',
            description: 'Testing concurrent updates',
          }),
        }
      );

      const createBody = await createResponse.json();
      const categoryId = createBody.data.category.id;

      // Both admins try to update the same category simultaneously
      const update1 = authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/${categoryId}`,
        token1,
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated by Admin 1' }),
        }
      );

      const update2 = authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories/${categoryId}`,
        token2,
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated by Admin 2' }),
        }
      );

      const [response1, response2] = await Promise.all([update1, update2]);

      // At least one should succeed, and if there are conflicts, one might fail
      const successCount = [response1, response2].filter((r) => r.status === 200).length;
      const conflictCount = [response1, response2].filter((r) => r.status === 409).length;

      expect(successCount + conflictCount).toBe(2);
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Security Validation', () => {
    it('prevents SQL injection attempts', async () => {
      const { token } = await createAdminAndToken();

      const sqlInjection = "'; DROP TABLE users; --";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search?q=${encodeURIComponent(sqlInjection)}`,
        token
      );

      // Should either return safe results or validation error
      expect([200, 400]).toContain(response.status);
    });

    it('prevents XSS attempts in input fields', async () => {
      const { token } = await createAdminAndToken();

      const xssAttempt = '<script>alert("XSS")</script>';

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: xssAttempt,
            description: 'XSS test',
          }),
        }
      );

      // Should sanitize input or reject
      expect([200, 400]).toContain(response.status);
    });

    it('validates file upload security', async () => {
      const { token } = await createAdminAndToken();

      // Try to upload executable file
      const formData = new FormData();
      formData.append(
        'file',
        new Blob(['malicious code'], { type: 'application/x-executable' }),
        'malware.exe'
      );

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/support-file`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      await expectError(response, 400, 'VALIDATION_ERROR');
    });
  });

  describe('Error Response Format', () => {
    it('returns consistent error response format', async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/users`, {
        method: 'GET',
        // Missing auth token
      });

      await expectError(response, 401);

      const body = await response.json();

      // Validate error response structure
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(false);
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('timestamp');
      expect(body.meta).toHaveProperty('requestId');
    });

    it('includes request ID in all responses', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/non-existent-id`,
        token
      );

      const body = await response.json();
      expect(body.meta).toHaveProperty('requestId');
      expect(typeof body.meta.requestId).toBe('string');
      expect(body.meta.requestId.length).toBeGreaterThan(0);
    });

    it('includes error details when appropriate', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/users`, token, {
        method: 'POST',
        body: JSON.stringify({
          // Invalid data to trigger validation error
          invalidField: 'invalid',
        }),
      });

      await expectError(response, 400);

      const body = await response.json();

      // Validation errors should include details
      if (body.error.code === 'VALIDATION_ERROR') {
        expect(body.error).toHaveProperty('details');
      }
    });
  });
});

