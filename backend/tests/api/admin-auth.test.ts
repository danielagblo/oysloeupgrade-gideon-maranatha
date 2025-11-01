import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import {
  createTestServer,
  closeTestServer,
  resetDb,
  seedAdminUser,
  expectError,
  expectSuccess,
} from "../test-helpers";

describe("Admin Authentication API", () => {
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

  describe("POST /api-v1/admin/auth/login", () => {
    it("authenticates valid admin credentials", async () => {
      const adminUser = await seedAdminUser({
        username: "testadmin",
        password: "AdminPass123!",
        role: "admin",
        email: "admin@example.com",
        businessName: "Test Business"
      });

      const response = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser.username,
          password: "AdminPass123!",
        }),
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.admin).toBeDefined();
      expect(body.data.admin.id).toBe(adminUser.id);
      expect(body.data.admin.username).toBe(adminUser.username);
      expect(body.data.admin.email).toBe(adminUser.email);
      expect(body.data.admin.role).toBe("admin");
      expect(body.data.admin.businessName).toBe("Test Business");
      expect(body.data.token).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      expect(body.data.permissions).toBeInstanceOf(Array);
      expect(body.data.permissions.length).toBeGreaterThan(0);
      expect(body.data.expiresIn).toBeDefined();
    });

    it("rejects invalid credentials", async () => {
      const adminUser = await seedAdminUser();

      const response = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser.username,
          password: "WrongPassword",
        }),
      });

      await expectError(response, 401);
    });

    it("rejects non-existent admin user", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "nonexistent",
          password: "AdminPass123!",
        }),
      });

      await expectError(response, 401);
    });

    it("rejects inactive admin user", async () => {
      const adminUser = await seedAdminUser({ isActive: false });

      const response = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser.username,
          password: adminUser.password,
        }),
      });

      await expectError(response, 401);
    });

    it("validates required fields", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      await expectError(response, 400);
    });

    it("validates username format", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "",
          password: "AdminPass123!",
        }),
      });

      await expectError(response, 400);
    });

    it("returns different permissions for different roles", async () => {
      const staffAdmin = await seedAdminUser({
        username: "staffadmin",
        role: "staff"
      });
      const superAdmin = await seedAdminUser({
        username: "superadmin",
        role: "super-admin"
      });

      // Test staff permissions
      const staffResponse = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: staffAdmin.username,
          password: staffAdmin.password,
        }),
      });

      const staffBody = await expectSuccess(staffResponse, 200);
      expect(staffBody.data.admin.role).toBe("staff");

      // Test super-admin permissions
      const superResponse = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: superAdmin.username,
          password: superAdmin.password,
        }),
      });

      const superBody = await expectSuccess(superResponse, 200);
      expect(superBody.data.admin.role).toBe("super-admin");
      expect(superBody.data.permissions.length).toBeGreaterThan(staffBody.data.permissions.length);
    });
  });

  describe("POST /api-v1/admin/auth/logout", () => {
    it("logs out authenticated admin", async () => {
      const adminUser = await seedAdminUser();

      // First login
      const loginResponse = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser.username,
          password: adminUser.password,
        }),
      });

      const loginBody = await loginResponse.json();
      const token = loginBody.data.token;

      // Then logout
      const response = await fetch(`${baseURL}/api-v1/admin/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.message).toBeDefined();
    });

    it("rejects logout without token", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      await expectError(response, 401);
    });

    it("rejects logout with invalid token", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
      });

      await expectError(response, 401);
    });
  });

  describe("GET /api-v1/admin/auth/session", () => {
    it("returns session for authenticated admin", async () => {
      const adminUser = await seedAdminUser({
        role: "admin",
        businessName: "Test Corp"
      });

      // Login first
      const loginResponse = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser.username,
          password: adminUser.password,
        }),
      });

      const loginBody = await loginResponse.json();
      const token = loginBody.data.token;

      // Get session
      const response = await fetch(`${baseURL}/api-v1/admin/auth/session`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.admin).toBeDefined();
      expect(body.data.admin.id).toBe(adminUser.id);
      expect(body.data.admin.username).toBe(adminUser.username);
      expect(body.data.admin.role).toBe("admin");
      expect(body.data.admin.businessName).toBe("Test Corp");
      expect(body.data.permissions).toBeInstanceOf(Array);
    });

    it("rejects session request without token", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/auth/session`, {
        method: "GET",
      });

      await expectError(response, 401);
    });

    it("rejects session request with invalid token", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/auth/session`, {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      await expectError(response, 401);
    });
  });

  describe("POST /api-v1/admin/auth/verify-role", () => {
    it("verifies admin has required permissions", async () => {
      const adminUser = await seedAdminUser({ role: "admin" });

      // Login first
      const loginResponse = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser.username,
          password: adminUser.password,
        }),
      });

      const loginBody = await loginResponse.json();
      const token = loginBody.data.token;

      // Verify role
      const response = await fetch(`${baseURL}/api-v1/admin/auth/verify-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requiredPermissions: ["user:read", "ads:read"],
        }),
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.hasAccess).toBe(true);
      expect(body.data.missingPermissions).toBeUndefined();
    });

    it("rejects when admin lacks required permissions", async () => {
      const staffUser = await seedAdminUser({ role: "staff" });

      // Login first
      const loginResponse = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: staffUser.username,
          password: staffUser.password,
        }),
      });

      const loginBody = await loginResponse.json();
      const token = loginBody.data.token;

      // Try to verify super-admin only permissions
      const response = await fetch(`${baseURL}/api-v1/admin/auth/verify-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requiredPermissions: ["system:config"],
        }),
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.hasAccess).toBe(false);
      expect(body.data.missingPermissions).toBeInstanceOf(Array);
      expect(body.data.missingPermissions).toContain("system:config");
    });

    it("rejects verify-role without token", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/auth/verify-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredPermissions: ["user:read"],
        }),
      });

      await expectError(response, 401);
    });

    it("validates required fields", async () => {
      const adminUser = await seedAdminUser();

      // Login first
      const loginResponse = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser.username,
          password: adminUser.password,
        }),
      });

      const loginBody = await loginResponse.json();
      const token = loginBody.data.token;

      const response = await fetch(`${baseURL}/api-v1/admin/auth/verify-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      await expectError(response, 400);
    });
  });

  describe("POST /api-v1/admin/auth/refresh-token", () => {
    it("refreshes token with valid refresh token", async () => {
      const adminUser = await seedAdminUser();

      // Login first to get tokens
      const loginResponse = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser.username,
          password: adminUser.password,
        }),
      });

      const loginBody = await loginResponse.json();
      const refreshToken = loginBody.data.refreshToken;

      // Refresh token
      const response = await fetch(`${baseURL}/api-v1/admin/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: refreshToken,
        }),
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.token).toBeDefined();
      expect(body.data.expiresIn).toBeDefined();
      expect(body.data.token).not.toBe(loginBody.data.token); // Should be different
    });

    it("rejects invalid refresh token", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: "invalid-refresh-token",
        }),
      });

      await expectError(response, 401);
    });

    it("validates required fields", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      await expectError(response, 400);
    });
  });
});
