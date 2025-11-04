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

describe('Admin User Management API', () => {
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

  describe('GET /api-v1/admin/users', () => {
    it('returns paginated users list', async () => {
      const { token } = await createAdminAndToken();

      // Create some test users
      await seedUser({ email: 'user1@example.com', name: 'User One' });
      await seedUser({ email: 'user2@example.com', name: 'User Two' });
      await seedUser({ email: 'user3@example.com', name: 'User Three' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users?page=1&limit=10`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.users).toBeInstanceOf(Array);
      expect(body.data.users.length).toBeGreaterThanOrEqual(3);
      expect(body.data.pagination).toBeDefined();
      expect(body.data.pagination.page).toBe(1);
      expect(body.data.pagination.limit).toBe(10);
      expect(body.data.pagination.total).toBeGreaterThanOrEqual(3);
      expect(body.data.filters).toBeDefined();
      expect(body.data.filters.status).toBeInstanceOf(Array);
      expect(body.data.filters.level).toBeInstanceOf(Array);
      expect(body.data.filters.role).toBeInstanceOf(Array);
    });

    it('filters users by status', async () => {
      const { token } = await createAdminAndToken();

      // Create users with different verification statuses
      await seedUser({
        email: 'verified@example.com',
        verificationStatus: 'verified',
      });
      await seedUser({
        email: 'unverified@example.com',
        verificationStatus: 'unverified',
      });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users?status=verified`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.users).toBeInstanceOf(Array);
      expect(body.data.users.length).toBe(1);
      expect(body.data.users[0].verificationStatus).toBe('verified');
    });

    it('searches users by email', async () => {
      const { token } = await createAdminAndToken();

      await seedUser({ email: 'john.doe@example.com', name: 'John Doe' });
      await seedUser({ email: 'jane.smith@example.com', name: 'Jane Smith' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users?search=john`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.users).toBeInstanceOf(Array);
      expect(body.data.users.length).toBe(1);
      expect(body.data.users[0].name).toBe('John Doe');
    });

    it('sorts users by specified field', async () => {
      const { token } = await createAdminAndToken();

      await seedUser({ email: 'a@example.com', name: 'A User' });
      await seedUser({ email: 'z@example.com', name: 'Z User' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users?sortBy=name&sortOrder=asc`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.users).toBeInstanceOf(Array);
      expect(body.data.users.length).toBeGreaterThanOrEqual(2);
      // First user should be A User if sorted ascending
      const aUserIndex = body.data.users.findIndex((u: any) => u.name === 'A User');
      const zUserIndex = body.data.users.findIndex((u: any) => u.name === 'Z User');
      expect(aUserIndex).toBeLessThan(zUserIndex);
    });

    it('rejects unauthenticated requests', async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/users`);

      await expectError(response, 401);
    });
  });

  describe('GET /api-v1/admin/users/:id', () => {
    it('returns detailed user information', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser({
        name: 'Test User',
        email: 'test@example.com',
      });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.user).toBeDefined();
      expect(body.data.user.id).toBe(user.id);
      expect(body.data.user.name).toBe('Test User');
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.data.user.adminNotes).toBeDefined();
      expect(body.data.user.verificationHistory).toBeInstanceOf(Array);
      expect(body.data.user.moderationHistory).toBeInstanceOf(Array);
      expect(body.data.user.activityStats).toBeDefined();
    });

    it('returns 404 for non-existent user', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/99999`,
        token
      );

      await expectError(response, 404);
    });

    it('rejects invalid user ID', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/invalid-id`,
        token
      );

      await expectError(response, 400);
    });
  });

  describe('POST /api-v1/admin/users/:id/verify', () => {
    it('verifies user successfully', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser({ verificationStatus: 'unverified' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}/verify`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            status: 'verified',
            notes: 'Verified via admin panel',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.user).toBeDefined();
      expect(body.data.user.verificationStatus).toBe('verified');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('unverifies user successfully', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser({ verificationStatus: 'verified' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}/verify`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            status: 'unverified',
            notes: 'Unverified due to suspicious activity',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.user.verificationStatus).toBe('unverified');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates status field', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}/verify`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            status: 'invalid-status',
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('PUT /api-v1/admin/users/:id/level', () => {
    it('updates user level successfully', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser({ verificationLevel: 'basic' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}/level`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            level: 'high',
            notes: 'Upgraded to high level',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.user.verificationLevel).toBe('high');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates level field', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}/level`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            level: 'invalid-level',
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('POST /api-v1/admin/users/:id/mute', () => {
    it('mutes user successfully', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser({ isMuted: false });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}/mute`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'mute',
            reason: 'Violation of community guidelines',
            duration: 24, // hours
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.user.isMuted).toBe(true);
      expect(body.data.muteRecord).toBeDefined();
      expect(body.data.muteRecord.reason).toBe('Violation of community guidelines');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('unmutes user successfully', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser({ isMuted: true });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}/mute`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'unmute',
            reason: 'Appealed successfully',
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.user.isMuted).toBe(false);
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates action field', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}/mute`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'invalid-action',
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('DELETE /api-v1/admin/users/:id', () => {
    it('soft deletes user successfully', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({
            reason: 'User requested account deletion',
            permanent: false,
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.message).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('hard deletes user when permanent is true', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({
            reason: 'Violation of terms of service',
            permanent: true,
          }),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.message).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates required reason field', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}`,
        token,
        {
          method: 'DELETE',
          body: JSON.stringify({}),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('POST /api-v1/admin/users/admin/create', () => {
    it('creates admin user successfully', async () => {
      const { token } = await createAdminAndToken({ role: 'super-admin' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/admin/create`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            username: 'newadmin',
            email: 'newadmin@example.com',
            password: 'SecurePass123!',
            role: 'staff',
            businessName: 'New Business',
          }),
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.admin).toBeDefined();
      expect(body.data.admin.username).toBe('newadmin');
      expect(body.data.admin.email).toBe('newadmin@example.com');
      expect(body.data.admin.role).toBe('staff');
      expect(body.data.admin.businessName).toBe('New Business');
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates required fields', async () => {
      const { token } = await createAdminAndToken({ role: 'super-admin' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/admin/create`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            username: 'newadmin',
            // Missing required fields
          }),
        }
      );

      await expectError(response, 400);
    });

    it('validates unique username', async () => {
      const { token } = await createAdminAndToken({ role: 'super-admin' });

      // Create first admin
      await authenticatedAdminRequest(`${baseURL}/api-v1/admin/users/admin/create`, token, {
        method: 'POST',
        body: JSON.stringify({
          username: 'testadmin',
          email: 'admin1@example.com',
          password: 'SecurePass123!',
          role: 'staff',
        }),
      });

      // Try to create duplicate username
      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/admin/create`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            username: 'testadmin', // duplicate
            email: 'admin2@example.com',
            password: 'SecurePass123!',
            role: 'staff',
          }),
        }
      );

      await expectError(response, 409);
    });
  });

  describe('PUT /api-v1/admin/users/admin/:id', () => {
    it('updates admin user successfully', async () => {
      const { token } = await createAdminAndToken({ role: 'super-admin' });

      // First create an admin
      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/admin/create`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            username: 'updateadmin',
            email: 'update@example.com',
            password: 'SecurePass123!',
            role: 'staff',
            businessName: 'Old Business',
          }),
        }
      );

      const createBody = await createResponse.json();
      const adminId = createBody.data.admin.id;

      // Now update the admin
      const updateResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/admin/${adminId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            role: 'admin',
            businessName: 'Updated Business',
            isActive: true,
          }),
        }
      );

      const updateBody = await expectSuccess(updateResponse, 200);
      expect(updateBody.data.admin.role).toBe('admin');
      expect(updateBody.data.admin.businessName).toBe('Updated Business');
      expect(updateBody.data.auditLogId).toBeDefined();
    });
  });

  describe('GET /api-v1/admin/users/stats', () => {
    it('returns comprehensive user statistics', async () => {
      const { token } = await createAdminAndToken();

      // Create users with different statuses
      await seedUser({ verificationStatus: 'verified' });
      await seedUser({ verificationStatus: 'verified' });
      await seedUser({ verificationStatus: 'unverified' });
      await seedUser({ isMuted: true });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.total).toBeGreaterThanOrEqual(4);
      expect(body.data.stats.verified).toBe(2);
      expect(body.data.stats.unverified).toBe(1);
      expect(body.data.stats.muted).toBe(1);
      expect(body.data.stats.byLevel).toBeDefined();
      expect(body.data.stats.byRole).toBeDefined();
      expect(body.data.stats.growth).toBeDefined();
      expect(body.data.stats.growth.today).toBeDefined();
      expect(body.data.stats.growth.week).toBeDefined();
      expect(body.data.stats.growth.month).toBeDefined();
    });
  });

  describe('GET /api-v1/admin/users/export', () => {
    it('initiates user export successfully', async () => {
      const { token } = await createAdminAndToken();

      await seedUser({ email: 'export1@example.com' });
      await seedUser({ email: 'export2@example.com' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/export?format=csv&fields=email,name`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.downloadUrl).toBeDefined();
      expect(body.data.expiresAt).toBeDefined();
      expect(body.data.fileSize).toBeDefined();
      expect(body.data.recordCount).toBeGreaterThanOrEqual(2);
    });

    it('supports different export formats', async () => {
      const { token } = await createAdminAndToken();

      const formats = ['csv', 'xlsx', 'pdf'];

      for (const format of formats) {
        const response = await authenticatedAdminRequest(
          `${baseURL}/api-v1/admin/users/export?format=${format}`,
          token
        );

        const body = await expectSuccess(response, 200);
        expect(body.data.downloadUrl).toMatch(new RegExp(`\\.${format}`));
      }
    });

    it('validates export format', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/export?format=invalid`,
        token
      );

      await expectError(response, 400);
    });
  });
});

