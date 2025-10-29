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
  createUserAndToken,
  seedNotification,
  expectError,
  expectSuccess,
} from "../test-helpers";

describe("Notifications API", () => {
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

  describe("GET /api-v1/notifications/history", () => {
    it("returns empty list when no notifications exist", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/notifications/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.notifications).toEqual([]);
      expect(body.data.total).toBe(0);
    });

    it("returns user notifications with correct totals", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);

      await seedNotification({ userId: user.id, title: "Welcome", body: "Hi" });
      await seedNotification({
        userId: user.id,
        title: "Wallet",
        body: "Credited",
      });
      await seedNotification({
        userId: user.id,
        title: "Order",
        body: "Shipped",
        isRead: true,
        readAt: new Date(),
      });

      const response = await fetch(`${baseURL}/api-v1/notifications/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.notifications.length).toBe(3);
      expect(body.data.total).toBe(3);
    });

    it("supports pagination", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);
      for (let i = 0; i < 5; i++) {
        await seedNotification({
          userId: user.id,
          title: `N${i}`,
          body: `B${i}`,
        });
      }

      const response = await fetch(
        `${baseURL}/api-v1/notifications/history?page=1&limit=2`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.notifications.length).toBe(2);
      expect(body.data.total).toBe(5);
      expect(body.data.page).toBe(1);
      expect(body.data.limit).toBe(2);
      expect(body.data.hasMore).toBe(true);
    });

    it("supports unread filter", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);
      await seedNotification({ userId: user.id, title: "U1", body: "u1" });
      await seedNotification({
        userId: user.id,
        title: "R1",
        body: "r1",
        isRead: true,
        readAt: new Date(),
      });

      const response = await fetch(
        `${baseURL}/api-v1/notifications/history?unreadOnly=true`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.notifications.length).toBe(1);
      expect(body.data.notifications[0].isRead).toBe(false);
    });

    it("rejects notifications request without authentication", async () => {
      const response = await fetch(`${baseURL}/api-v1/notifications/history`, {
        method: "GET",
      });

      await expectError(response, 401);
    });

    it("rejects notifications request with invalid token", async () => {
      const response = await fetch(`${baseURL}/api-v1/notifications/history`, {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      await expectError(response, 401);
    });
  });

  describe("PUT /api-v1/notifications/:id/read", () => {
    it("marks notification as read", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);
      const n = await seedNotification({
        userId: user.id,
        title: "U1",
        body: "u1",
      });

      const response = await fetch(
        `${baseURL}/api-v1/notifications/${n.id}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.message).toBe("Notification marked as read");

      const unreadResp = await fetch(
        `${baseURL}/api-v1/notifications/unread-count`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const unreadBody = await expectSuccess(unreadResp, 200);
      expect(unreadBody.data.unreadCount).toBe(0);
    });

    it("rejects mark as read without authentication", async () => {
      const response = await fetch(
        `${baseURL}/api-v1/notifications/test-id/read`,
        {
          method: "PUT",
        }
      );

      await expectError(response, 401);
    });

    it("rejects mark as read with invalid token", async () => {
      const response = await fetch(
        `${baseURL}/api-v1/notifications/00000000-0000-0000-0000-000000000000/read`,
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer invalid-token",
          },
        }
      );

      await expectError(response, 401, "INVALID_TOKEN");
    });

    it("validates notification ID format", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(
        `${baseURL}/api-v1/notifications/invalid-id/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await expectError(response, 400);
    });
  });

  describe("PUT /api-v1/notifications/mark-all-read", () => {
    it("marks all notifications as read", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);
      await seedNotification({ userId: user.id, title: "U1", body: "u1" });

      const response = await fetch(
        `${baseURL}/api-v1/notifications/mark-all-read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.message).toMatch(/marked as read/);
    });

    it("rejects mark all as read without authentication", async () => {
      const response = await fetch(
        `${baseURL}/api-v1/notifications/mark-all-read`,
        {
          method: "PUT",
        }
      );

      await expectError(response, 401);
    });

    it("rejects mark all as read with invalid token", async () => {
      const response = await fetch(
        `${baseURL}/api-v1/notifications/mark-all-read`,
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer invalid-token",
          },
        }
      );

      await expectError(response, 401, "INVALID_TOKEN");
    });
  });
});
