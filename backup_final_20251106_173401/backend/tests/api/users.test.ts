import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import {
  closeTestServer,
  createTestServer,
  createUserAndToken,
  expectError,
  expectSuccess,
  resetDb,
} from '../test-helpers';

describe('Users API', () => {
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

  describe('GET /api-v1/users/profile', () => {
    it('returns user profile for authenticated user', async () => {
      const { user: _user, token } = await createUserAndToken(
        {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        baseURL
      );

      const response = await fetch(`${baseURL}/api-v1/users/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.data.user.firstName).toBe('John');
      expect(body.data.user.lastName).toBe('Doe');
    });

    it('rejects profile request without authentication', async () => {
      const response = await fetch(`${baseURL}/api-v1/users/profile`, {
        method: 'GET',
      });

      await expectError(response, 401);
    });

    it('rejects profile request with invalid token', async () => {
      const response = await fetch(`${baseURL}/api-v1/users/profile`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      await expectError(response, 401);
    });
  });

  describe('PUT /api-v1/users/profile', () => {
    it('updates user profile with valid data', async () => {
      const { user: _user, token } = await createUserAndToken(
        {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        baseURL
      );

      const response = await fetch(`${baseURL}/api-v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          preferredNotificationPhone: `+123456789${Math.floor(Math.random() * 10)}`,
        }),
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.user.firstName).toBe('Jane');
      expect(body.data.user.lastName).toBe('Smith');
      expect(body.data.user.preferredNotificationPhone).toMatch(/^\+123456789\d$/);
    });

    it('validates phone number format', async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: '123',
        }),
      });

      await expectError(response, 400);
    });

    it('validates firstName is not empty', async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: '',
        }),
      });

      await expectError(response, 400);
    });

    it('rejects update without authentication', async () => {
      const response = await fetch(`${baseURL}/api-v1/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Jane',
        }),
      });

      await expectError(response, 401);
    });

    it('rejects update with invalid token', async () => {
      const response = await fetch(`${baseURL}/api-v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token',
        },
        body: JSON.stringify({
          firstName: 'Jane',
        }),
      });

      await expectError(response, 401);
    });
  });
});
