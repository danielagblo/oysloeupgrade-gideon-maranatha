import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createTestServer, closeTestServer } from "../test-helpers";

describe("Health API", () => {
  let server: any;
  let baseURL: string;

  beforeAll(async () => {
    const testServer = await createTestServer();
    server = testServer.server;
    baseURL = testServer.baseURL;
  });

  afterAll(async () => {
    await closeTestServer(server);
  });

  describe("GET /health", () => {
    it("returns 200 with health status", async () => {
      const response = await fetch(`${baseURL}/health`);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.status).toBe("ok");
      expect(body.timestamp).toBeDefined();
    });
  });

  describe("GET /", () => {
    it("returns 404 for root endpoint (no route defined)", async () => {
      const response = await fetch(`${baseURL}/`);

      expect(response.status).toBe(404);
    });
  });
});
