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
  seedCoupon,
  expectError,
  expectSuccess,
} from "../test-helpers";

describe("Coupons API", () => {
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

  describe("GET /api-v1/coupons/", () => {
    it("returns empty list when no coupons exist", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/coupons/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.coupons).toEqual([]);
    });

    it("returns list of active coupons", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      await seedCoupon({
        code: "SAVE10",
        discountType: "percentage",
        discountValue: 10,
        isActive: true,
      });
      await seedCoupon({
        code: "SAVE20",
        discountType: "fixed",
        discountValue: 20,
        isActive: true,
      });
      await seedCoupon({
        code: "EXPIRED",
        discountType: "percentage",
        discountValue: 15,
        isActive: false,
      });

      const response = await fetch(`${baseURL}/api-v1/coupons/?isActive=true`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.coupons).toHaveLength(2);
      expect(
        body.data.coupons.find((c: any) => c.code === "SAVE10")
      ).toBeDefined();
      expect(
        body.data.coupons.find((c: any) => c.code === "SAVE20")
      ).toBeDefined();
      expect(
        body.data.coupons.find((c: any) => c.code === "EXPIRED")
      ).toBeUndefined();
    });

    it("supports pagination", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      for (let i = 1; i <= 5; i++) {
        await seedCoupon({
          code: `COUPON${i}`,
          discountType: "percentage",
          discountValue: 10 + i,
        });
      }

      const response = await fetch(
        `${baseURL}/api-v1/coupons/?page=1&limit=2&isActive=true`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.coupons).toHaveLength(2);
      expect(body.data.pagination.total).toBe(5);
      expect(body.data.pagination.page).toBe(1);
      expect(body.data.pagination.limit).toBe(2);
    });
  });

  describe("POST /api-v1/coupons/redeem", () => {
    it("applies valid coupon", async () => {
      const { token } = await createUserAndToken({}, baseURL);
      await seedCoupon({
        code: "SAVE10",
        discountType: "percentage",
        discountValue: 10,
        minOrderAmount: 50,
        isActive: true,
      });

      const response = await fetch(`${baseURL}/api-v1/coupons/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: "SAVE10",
          orderAmount: 100,
          orderId: "00000000-0000-0000-0000-000000000000",
        }),
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.discountAmount).toBeDefined();
      expect(body.data.coupon.code).toBe("SAVE10");
    });

    it("rejects invalid coupon code", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/coupons/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: "INVALID",
          orderAmount: 100,
          orderId: "00000000-0000-0000-0000-000000000000",
        }),
      });

      await expectError(response, 404);
    });

    it("rejects inactive coupon", async () => {
      const { token } = await createUserAndToken({}, baseURL);
      await seedCoupon({
        code: "INACTIVE",
        discountType: "percentage",
        discountValue: 10,
        isActive: false,
      });

      const response = await fetch(`${baseURL}/api-v1/coupons/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: "INACTIVE",
          orderAmount: 100,
          orderId: "00000000-0000-0000-0000-000000000000",
        }),
      });

      await expectError(response, 400);
    });

    it("rejects coupon when order amount is below minimum", async () => {
      const { token } = await createUserAndToken({}, baseURL);
      await seedCoupon({
        code: "SAVE10",
        discountType: "percentage",
        discountValue: 10,
        minOrderAmount: 100,
        isActive: true,
      });

      const response = await fetch(`${baseURL}/api-v1/coupons/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: "SAVE10",
          orderAmount: 50,
          orderId: "00000000-0000-0000-0000-000000000000",
        }),
      });

      await expectError(response, 400);
    });

    it("validates required fields", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/coupons/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      await expectError(response, 400);
    });

    it("rejects application without authentication", async () => {
      const response = await fetch(`${baseURL}/api-v1/coupons/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "SAVE10",
          orderAmount: 100,
        }),
      });

      await expectError(response, 401);
    });
  });

  describe("POST /api-v1/coupons/", () => {
    it("creates coupon with valid data", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/coupons/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: "NEWCOUPON",
          description: "A new test coupon",
          discountType: "percent",
          discountValue: 15,
          minOrderAmount: 75,
          maxDiscountAmount: 50,
          usageLimit: 100,
          validFrom: new Date().toISOString(),
          validUntil: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          isActive: true,
        }),
      });

      const body = await expectSuccess(response, 201);
      expect(body.data.coupon.code).toBe("NEWCOUPON");
      expect(body.data.coupon.discountType).toBe("percent");
      expect(body.data.coupon.discountValue).toBe(15);
      expect(body.data.coupon.minOrderAmount).toBe(75);
    });

    it("validates required fields", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/coupons/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      await expectError(response, 400);
    });

    it("validates discount value is positive", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/coupons/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: "BADCOUPON",
          discountType: "percentage",
          discountValue: -10,
        }),
      });

      await expectError(response, 400);
    });

    it("rejects creation without authentication", async () => {
      const response = await fetch(`${baseURL}/api-v1/coupons/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "NEWCOUPON",
          discountType: "percentage",
          discountValue: 15,
        }),
      });

      await expectError(response, 401);
    });
  });
});
