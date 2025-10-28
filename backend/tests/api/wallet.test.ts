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
  seedWallet,
  expectError,
  expectSuccess,
} from "../test-helpers";

describe("Wallet API", () => {
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

  describe("GET /api-v1/wallet/balance", () => {
    it("returns wallet balance for authenticated user", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);
      await seedWallet({ userId: user.id, balance: 1500 });

      const response = await fetch(`${baseURL}/api-v1/wallet/balance`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.balance).toBe("1500.00");
      expect(body.data.currency).toBe("USD");
    });

    it("returns zero balance for user without wallet", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/wallet/balance`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.balance).toBe("0.00");
    });

    it("rejects balance request without authentication", async () => {
      const response = await fetch(`${baseURL}/api-v1/wallet/balance`, {
        method: "GET",
      });

      await expectError(response, 401);
    });

    it("rejects balance request with invalid token", async () => {
      const response = await fetch(`${baseURL}/api-v1/wallet/balance`, {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      await expectError(response, 401);
    });
  });

  describe("POST /api-v1/wallet/transfer", () => {
    it("transfers funds to wallet", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);
      const { user: recipientUser } = await createUserAndToken({}, baseURL);
      await seedWallet({ userId: user.id, balance: 100 });

      const response = await fetch(`${baseURL}/api-v1/wallet/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toUserId: recipientUser.id,
          amount: 50,
          reason: "Test transfer",
        }),
      });

      const body = await expectSuccess(response, 200);
      expect(body.message).toBe("Transfer completed successfully");
      expect(body.data.newBalance).toBe("50.00");
      expect(body.data.transaction.amount).toBe(50);
      expect(body.data.transaction.type).toBe("transfer");
    });

    it("rejects transfer with insufficient funds", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);
      const { user: recipientUser } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/wallet/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toUserId: recipientUser.id,
          amount: 999999,
          reason: "Large transfer",
        }),
      });

      await expectError(response, 409, "Insufficient wallet balance");
    });

    it("rejects self transfer", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/wallet/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toUserId: user.id,
          amount: 10,
          reason: "Self",
        }),
      });

      await expectError(response, 400, "Cannot transfer to the same user");
    });

    it("prevents double-spend on sequential transfers", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);
      const { user: recipientUser } = await createUserAndToken({}, baseURL);
      await seedWallet({ userId: user.id, balance: 100 });

      const first = await fetch(`${baseURL}/api-v1/wallet/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toUserId: recipientUser.id,
          amount: 60,
          reason: "First",
        }),
      });
      await expectSuccess(first, 200);

      const second = await fetch(`${baseURL}/api-v1/wallet/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toUserId: recipientUser.id,
          amount: 60,
          reason: "Second",
        }),
      });

      await expectError(second, 409, "Insufficient wallet balance");
    });

    it("validates transfer amount is positive", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/wallet/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toUserId: "00000000-0000-0000-0000-000000000000",
          amount: -10,
          reason: "Test transfer",
        }),
      });

      await expectError(response, 400);
    });

    it("validates required fields", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/wallet/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      await expectError(response, 400);
    });

    it("rejects transfer without authentication", async () => {
      const response = await fetch(`${baseURL}/api-v1/wallet/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: "00000000-0000-0000-0000-000000000000",
          amount: 50,
          reason: "Test transfer",
        }),
      });

      await expectError(response, 401);
    });
  });
});
