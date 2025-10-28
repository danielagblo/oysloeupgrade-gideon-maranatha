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
  seedUser,
  expectError,
  expectSuccess,
} from "../test-helpers";

describe("Auth API", () => {
  let server: any;
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

  describe("POST /api-v1/auth/register", () => {
    it("creates user with valid data", async () => {
      const response = await fetch(`${baseURL}/api-v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          phone: "+1234567890",
          password: "SecurePass123!",
        }),
      });

      const body = await expectSuccess(response, 201);
      expect(body.data.user.email).toBe("test@example.com");
      expect(body.data.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    });

    it("rejects duplicate email", async () => {
      await seedUser({ email: "test@example.com" });

      const response = await fetch(`${baseURL}/api-v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          phone: "+1234567890",
          password: "SecurePass123!",
        }),
      });

      await expectError(response, 409);
    });

    it("validates required fields", async () => {
      const response = await fetch(`${baseURL}/api-v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      await expectError(response, 400);
    });

    it("validates email format", async () => {
      const response = await fetch(`${baseURL}/api-v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Test",
          lastName: "User",
          email: "invalid-email",
          phone: "+1234567890",
          password: "SecurePass123!",
        }),
      });

      await expectError(response, 400);
    });

    it("validates password strength", async () => {
      const response = await fetch(`${baseURL}/api-v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          phone: "+1234567890",
          password: "weak",
        }),
      });

      await expectError(response, 400);
    });
  });

  describe("POST /api-v1/auth/login", () => {
    it("authenticates valid credentials", async () => {
      const user = await seedUser({
        email: "test@example.com",
        password: "TestPass123!",
      });

      const response = await fetch(`${baseURL}/api-v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          password: "TestPass123!",
        }),
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.token).toBeDefined();
      expect(body.data.user.email).toBe(user.email);
    });

    it("rejects invalid credentials", async () => {
      const user = await seedUser({
        email: "test@example.com",
        password: "TestPass123!",
      });

      const response = await fetch(`${baseURL}/api-v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          password: "WrongPassword",
        }),
      });

      await expectError(response, 401);
    });

    it("rejects non-existent user", async () => {
      const response = await fetch(`${baseURL}/api-v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "TestPass123!",
        }),
      });

      await expectError(response, 401);
    });

    it("validates required fields", async () => {
      const response = await fetch(`${baseURL}/api-v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      await expectError(response, 400);
    });
  });

  describe("POST /api-v1/auth/logout", () => {
    it("logs out authenticated user", async () => {
      const user = await seedUser({
        email: "test@example.com",
        password: "TestPass123!",
      });

      const loginResponse = await fetch(`${baseURL}/api-v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "TestPass123!",
        }),
      });

      const loginBody = await loginResponse.json();
      const token = loginBody.data.token;

      const response = await fetch(`${baseURL}/api-v1/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      await expectSuccess(response, 200);
    });

    it("rejects logout without token", async () => {
      const response = await fetch(`${baseURL}/api-v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      await expectError(response, 401);
    });

    it("rejects logout with invalid token", async () => {
      const response = await fetch(`${baseURL}/api-v1/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
      });

      await expectError(response, 401);
    });
  });

  describe("GET /api-v1/auth/session", () => {
    it("returns session for authenticated user", async () => {
      const user = await seedUser({
        email: "test@example.com",
        password: "TestPass123!",
      });

      const loginResponse = await fetch(`${baseURL}/api-v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "TestPass123!",
        }),
      });

      const loginBody = await loginResponse.json();
      const token = loginBody.data.token;

      const response = await fetch(`${baseURL}/api-v1/auth/session`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.user.email).toBe("test@example.com");
    });

    it("rejects session request without token", async () => {
      const response = await fetch(`${baseURL}/api-v1/auth/session`, {
        method: "GET",
      });

      await expectError(response, 401);
    });

    it("rejects session request with invalid token", async () => {
      const response = await fetch(`${baseURL}/api-v1/auth/session`, {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      await expectError(response, 401);
    });
  });
});
