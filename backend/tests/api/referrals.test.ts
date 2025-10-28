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
  expectError,
  expectSuccess,
} from "../test-helpers";

describe("Referrals API", () => {
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

  describe("GET /api-v1/referrals/stats", () => {
    it("returns referral stats for authenticated user", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/referrals/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.referralCode).toBeDefined();
      expect(body.data.totalReferrals).toBe(0);
      expect(body.data.totalPointsEarned).toBe(0);
      expect(body.data.availablePoints).toBe("0");
    });

    it("rejects referral stats request without authentication", async () => {
      const response = await fetch(`${baseURL}/api-v1/referrals/stats`, {
        method: "GET",
      });

      await expectError(response, 401);
    });

    it("rejects referral stats request with invalid token", async () => {
      const response = await fetch(`${baseURL}/api-v1/referrals/stats`, {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      await expectError(response, 401);
    });
  });

  describe("POST /api-v1/referrals/redeem", () => {
    it("redeems referral points successfully", async () => {
      const { user: referrer, token: referrerToken } = await createUserAndToken(
        {},
        baseURL
      );
      const { user: referee, token: refereeToken } = await createUserAndToken(
        {},
        baseURL
      );

      const generateResponse = await fetch(
        `${baseURL}/api-v1/referrals/generate-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${referrerToken}`,
          },
        }
      );

      if (!generateResponse.ok) {
        const errorBody = await generateResponse.text();
        throw new Error(
          `Referral code generation failed: ${generateResponse.status} ${errorBody}`
        );
      }

      const statsResponse = await fetch(`${baseURL}/api-v1/referrals/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${referrerToken}`,
        },
      });

      const statsBody = await statsResponse.json();
      const referralCode = statsBody.data.referralCode;

      const createResponse = await fetch(`${baseURL}/api-v1/referrals/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${referrerToken}`,
        },
        body: JSON.stringify({
          referrerId: referrer.id,
          referredUserId: referee.id,
          referralCode: referralCode,
        }),
      });

      if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        throw new Error(
          `Referral creation failed: ${createResponse.status} ${errorBody}`
        );
      }

      const confirmResponse = await fetch(
        `${baseURL}/api-v1/referrals/confirm/${referee.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${referrerToken}`,
          },
        }
      );

      if (!confirmResponse.ok) {
        const errorBody = await confirmResponse.text();
        throw new Error(
          `Referral confirmation failed: ${confirmResponse.status} ${errorBody}`
        );
      }

      const response = await fetch(`${baseURL}/api-v1/referrals/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${referrerToken}`,
        },
        body: JSON.stringify({
          points: 2500,
          reason: "Test redemption",
        }),
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.redemption).toBeDefined();
      expect(body.data.walletCredit).toBeDefined();
    });

    it("rejects duplicate redemption flow (insufficient points on second attempt)", async () => {
      const { user: referrer, token: referrerToken } = await createUserAndToken(
        {},
        baseURL
      );
      const { user: referee, token: refereeToken } = await createUserAndToken(
        {},
        baseURL
      );

      const gen = await fetch(`${baseURL}/api-v1/referrals/generate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${referrerToken}`,
        },
      });
      if (!gen.ok) throw new Error(`gen failed ${gen.status}`);

      const statsResponse = await fetch(`${baseURL}/api-v1/referrals/stats`, {
        method: "GET",
        headers: { Authorization: `Bearer ${referrerToken}` },
      });
      const statsBody = await statsResponse.json();
      const referralCode = statsBody.data.referralCode;

      const createResponse = await fetch(`${baseURL}/api-v1/referrals/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${referrerToken}`,
        },
        body: JSON.stringify({
          referrerId: referrer.id,
          referredUserId: referee.id,
          referralCode,
        }),
      });
      if (!createResponse.ok)
        throw new Error(`create failed ${createResponse.status}`);

      const confirmResponse = await fetch(
        `${baseURL}/api-v1/referrals/confirm/${referee.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${referrerToken}`,
          },
        }
      );
      if (!confirmResponse.ok)
        throw new Error(`confirm failed ${confirmResponse.status}`);

      const first = await fetch(`${baseURL}/api-v1/referrals/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${referrerToken}`,
        },
        body: JSON.stringify({ points: 2500, reason: "First" }),
      });
      await expectSuccess(first, 200);

      const second = await fetch(`${baseURL}/api-v1/referrals/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${referrerToken}`,
        },
        body: JSON.stringify({ points: 2500, reason: "Second" }),
      });

      await expectError(second, 400);
    });

    it("rejects insufficient points", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/referrals/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          points: 5000,
          reason: "Test redemption",
        }),
      });

      await expectError(response, 400);
    });

    it("rejects minimum points requirement", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/referrals/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          points: 1000,
          reason: "Test redemption",
        }),
      });

      await expectError(response, 400);
    });

    it("validates required fields", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/referrals/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      await expectError(response, 400);
    });

    it("rejects redemption without authentication", async () => {
      const response = await fetch(`${baseURL}/api-v1/referrals/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralCode: "SOME_CODE",
        }),
      });

      await expectError(response, 401);
    });
  });
});
