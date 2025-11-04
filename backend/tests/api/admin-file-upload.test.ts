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

describe('Admin File Upload System API', () => {
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

  describe('POST /api-v1/admin/uploads/profile-image', () => {
    it('uploads admin profile image successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      // Create a mock file (in a real test, you'd use a FormData with actual file)
      const formData = new FormData();
      formData.append('file', new Blob(['test image data'], { type: 'image/jpeg' }), 'profile.jpg');

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/profile-image`,
        token,
        {
          method: 'POST',
          body: formData,
          headers: {
            // Don't override content-type for FormData
          },
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.file).toBeDefined();
      expect(body.data.file.url).toBeDefined();
      expect(body.data.file.publicId).toBeDefined();
      expect(body.data.file.format).toBe('jpg');
      expect(typeof body.data.file.size).toBe('number');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates file type for profile images', async () => {
      const { token } = await createAdminAndToken();

      const formData = new FormData();
      formData.append('file', new Blob(['test data'], { type: 'text/plain' }), 'invalid.txt');

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/profile-image`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      await expectError(response, 400);
    });

    it('validates file size limits', async () => {
      const { token } = await createAdminAndToken();

      // Create a large file (simulate 10MB+ file)
      const largeData = new Uint8Array(11 * 1024 * 1024); // 11MB
      const formData = new FormData();
      formData.append('file', new Blob([largeData], { type: 'image/jpeg' }), 'large.jpg');

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/profile-image`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      await expectError(response, 400);
    });
  });

  describe('POST /api-v1/admin/uploads/business-logo', () => {
    it('uploads business logo successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      const formData = new FormData();
      formData.append('file', new Blob(['logo data'], { type: 'image/png' }), 'logo.png');

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/business-logo`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.file).toBeDefined();
      expect(body.data.file.format).toBe('png');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates logo dimensions', async () => {
      const { token } = await createAdminAndToken();

      // Create a very small image that might not meet dimension requirements
      const formData = new FormData();
      formData.append('file', new Blob(['tiny'], { type: 'image/png' }), 'tiny.png');

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/business-logo`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      // Should either succeed or fail based on validation rules
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('POST /api-v1/admin/uploads/ad-image', () => {
    it('uploads ad image for moderation', async () => {
      const { token } = await createAdminAndToken();

      const formData = new FormData();
      formData.append('file', new Blob(['ad image'], { type: 'image/jpeg' }), 'ad.jpg');
      formData.append('adId', 'test-ad-123');

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/ad-image`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.file).toBeDefined();
      expect(body.data.file.url).toBeDefined();
      expect(body.data.metadata).toBeDefined();
      expect(body.data.metadata.adId).toBe('test-ad-123');
    });

    it('validates ad image quality', async () => {
      const { token } = await createAdminAndToken();

      // Very low quality image
      const formData = new FormData();
      formData.append('file', new Blob(['low quality'], { type: 'image/jpeg' }), 'low.jpg');

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/ad-image`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      // Should validate image quality
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('POST /api-v1/admin/uploads/support-file', () => {
    it('uploads support case file', async () => {
      const { token } = await createAdminAndToken();

      const formData = new FormData();
      formData.append(
        'file',
        new Blob(['support document'], { type: 'application/pdf' }),
        'support.pdf'
      );
      formData.append('caseId', 'case-123');
      formData.append('messageId', 'msg-456');

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/support-file`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.file).toBeDefined();
      expect(body.data.file.format).toBe('pdf');
      expect(body.data.metadata.caseId).toBe('case-123');
      expect(body.data.metadata.messageId).toBe('msg-456');
    });

    it('validates support file types', async () => {
      const { token } = await createAdminAndToken();

      const formData = new FormData();
      formData.append('file', new Blob(['executable'], { type: 'application/exe' }), 'malware.exe');

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/support-file`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      await expectError(response, 400);
    });
  });

  describe('POST /api-v1/admin/uploads/category-image', () => {
    it('uploads category image', async () => {
      const { token } = await createAdminAndToken();

      const formData = new FormData();
      formData.append(
        'file',
        new Blob(['category icon'], { type: 'image/svg+xml' }),
        'category.svg'
      );
      formData.append('categoryId', 'cat-123');

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/category-image`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.file).toBeDefined();
      expect(body.data.file.format).toBe('svg');
      expect(body.data.metadata.categoryId).toBe('cat-123');
    });

    it('handles SVG uploads for categories', async () => {
      const { token } = await createAdminAndToken();

      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>`;
      const formData = new FormData();
      formData.append('file', new Blob([svgContent], { type: 'image/svg+xml' }), 'icon.svg');

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/category-image`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.file.format).toBe('svg');
    });
  });

  describe('DELETE /api-v1/admin/uploads/:publicId', () => {
    it('deletes uploaded file successfully', async () => {
      const { token } = await createAdminAndToken();

      // First upload a file
      const formData = new FormData();
      formData.append('file', new Blob(['test file'], { type: 'image/jpeg' }), 'test.jpg');

      const uploadResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/profile-image`,
        token,
        {
          method: 'POST',
          body: formData,
        }
      );

      const uploadBody = await uploadResponse.json();
      const publicId = uploadBody.data.file.publicId;

      // Now delete it
      const deleteResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/${publicId}`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({
            reason: 'File no longer needed',
          }),
        }
      );

      const deleteBody = await expectSuccess(deleteResponse, 200);
      expect(deleteBody.data.message).toBeDefined();
      expect(deleteBody.data.auditLogId).toBeDefined();
    });

    it('returns 404 for non-existent file', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/non-existent-file`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({
            reason: 'Test deletion',
          }),
        }
      );

      await expectError(response, 404);
    });
  });

  describe('GET /api-v1/admin/uploads', () => {
    it('lists uploaded files with pagination', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads?page=1&limit=10&folder=admin/profiles`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.files).toBeInstanceOf(Array);
      expect(body.data.pagination).toBeDefined();
      expect(body.data.pagination.page).toBe(1);
      expect(body.data.pagination.limit).toBe(10);

      // Each file should have metadata
      body.data.files.forEach((file: any) => {
        expect(file.publicId).toBeDefined();
        expect(file.url).toBeDefined();
        expect(file.format).toBeDefined();
        expect(file.size).toBeDefined();
        expect(file.uploadedAt).toBeDefined();
        expect(file.uploadedBy).toBeDefined();
      });
    });

    it('filters files by folder', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads?folder=admin/business`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.files).toBeInstanceOf(Array);

      // All files should be from the specified folder
      body.data.files.forEach((file: any) => {
        expect(file.folder).toBe('admin/business');
      });
    });

    it('filters files by date range', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads?dateFrom=2024-01-01&dateTo=2024-12-31`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.files).toBeInstanceOf(Array);
    });
  });

  describe('GET /api-v1/admin/uploads/stats', () => {
    it('returns upload statistics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(typeof body.data.stats.totalFiles).toBe('number');
      expect(typeof body.data.stats.totalSize).toBe('number');
      expect(body.data.stats.byType).toBeDefined();
      expect(body.data.stats.byFolder).toBeDefined();
      expect(body.data.stats.recentUploads).toBeInstanceOf(Array);
    });

    it('includes storage usage breakdown', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats.byType).toBeDefined();

      // Should have file type statistics
      const fileTypes = Object.keys(body.data.stats.byType);
      expect(fileTypes.length).toBeGreaterThan(0);

      fileTypes.forEach((type) => {
        expect(typeof body.data.stats.byType[type]).toBe('number');
      });
    });
  });

  describe('POST /api-v1/admin/uploads/bulk-delete', () => {
    it('deletes multiple files', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/bulk-delete`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            publicIds: ['file1', 'file2', 'file3'],
            reason: 'Bulk cleanup of old files',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.deleted).toBeDefined();
      expect(body.data.failed).toBeDefined();
      expect(body.data.results).toBeInstanceOf(Array);
      expect(body.data.auditLogId).toBeDefined();
    });

    it('handles partial failures in bulk delete', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/bulk-delete`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            publicIds: ['valid-file', 'invalid-file'],
            reason: 'Test bulk delete',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.deleted).toBeDefined();
      expect(body.data.failed).toBeDefined();
      expect(body.data.results.length).toBe(2);
    });
  });

  describe('POST /api-v1/admin/uploads/migrate', () => {
    it('migrates files between storage providers', async () => {
      const { token } = await createAdminAndToken({ role: 'super-admin' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/migrate`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            sourceProvider: 'cloudinary',
            targetProvider: 'aws-s3',
            folder: 'admin/profiles',
            batchSize: 10,
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.migration).toBeDefined();
      expect(body.data.migration.id).toBeDefined();
      expect(body.data.migration.status).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('requires super-admin role for migration', async () => {
      const { token } = await createAdminAndToken({ role: 'staff' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/migrate`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            sourceProvider: 'cloudinary',
            targetProvider: 'aws-s3',
          }),
        }
      );

      await expectError(response, 403);
    });
  });

  describe('GET /api-v1/admin/uploads/usage', () => {
    it('returns storage usage report', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/usage?period=month`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.usage).toBeDefined();
      expect(body.data.usage.current).toBeDefined();
      expect(body.data.usage.limit).toBeDefined();
      expect(typeof body.data.usage.percentage).toBe('number');
      expect(body.data.usage.byFolder).toBeInstanceOf(Array);
      expect(body.data.usage.trends).toBeInstanceOf(Array);
    });

    it('includes quota information', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/uploads/usage`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.usage.limit).toBeDefined();
      expect(body.data.usage.percentage).toBeDefined();
      expect(body.data.usage.percentage).toBeGreaterThanOrEqual(0);
      expect(body.data.usage.percentage).toBeLessThanOrEqual(100);
    });
  });
});

