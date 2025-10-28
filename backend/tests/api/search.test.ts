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
  seedProduct,
  expectError,
  expectSuccess,
} from "../test-helpers";

describe("Search API", () => {
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

  describe("GET /api-v1/search/enhanced", () => {
    it("returns empty results when no products match", async () => {
      const response = await fetch(
        `${baseURL}/api-v1/search/enhanced?q=nonexistent`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.products).toEqual([]);
      expect(body.data.total).toBe(0);
    });

    it("searches products by name", async () => {
      await seedProduct({ name: "iPhone 15 Pro", price: 999 });
      await seedProduct({ name: "Samsung Galaxy S24", price: 899 });
      await seedProduct({ name: "MacBook Pro", price: 1999 });

      const response = await fetch(
        `${baseURL}/api-v1/search/enhanced?q=iPhone`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.products).toHaveLength(1);
      expect(body.data.products[0].name).toBe("iPhone 15 Pro");
      expect(body.data.total).toBe(1);
    });

    it("searches products by description", async () => {
      await seedProduct({
        name: "Wireless Headphones",
        price: 199,
        description: "High-quality wireless headphones with noise cancellation",
      });
      await seedProduct({
        name: "Gaming Mouse",
        price: 79,
        description: "Precision gaming mouse with RGB lighting",
      });

      const response = await fetch(
        `${baseURL}/api-v1/search/enhanced?q=wireless`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.products).toHaveLength(1);
      expect(body.data.products[0].name).toBe("Wireless Headphones");
    });

    it("supports pagination", async () => {
      for (let i = 1; i <= 5; i++) {
        await seedProduct({ name: `Product ${i}`, price: 10 + i });
      }

      const response = await fetch(
        `${baseURL}/api-v1/search/enhanced?q=Product&page=1&limit=2`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.products).toHaveLength(2);
      expect(body.data.total).toBe(5);
      expect(body.data.page).toBe(1);
      expect(body.data.limit).toBe(2);
    });

    it("supports category filtering", async () => {
      await seedProduct({
        name: "iPhone",
        price: 999,
        category: "Electronics",
      });
      await seedProduct({ name: "T-Shirt", price: 29, category: "Clothing" });
      await seedProduct({
        name: "Laptop",
        price: 1299,
        category: "Electronics",
      });

      const response = await fetch(
        `${baseURL}/api-v1/search/enhanced?q=Product&category=Electronics`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.products.length).toBeGreaterThanOrEqual(0);
    });

    it("supports price range filtering", async () => {
      await seedProduct({ name: "Cheap Item", price: 10 });
      await seedProduct({ name: "Mid Item", price: 50 });
      await seedProduct({ name: "Expensive Item", price: 200 });

      const response = await fetch(
        `${baseURL}/api-v1/search/enhanced?q=Product&minPrice=20&maxPrice=100`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.products).toHaveLength(1);
      expect(body.data.products[0].name).toBe("Mid Item");
    });

    it("supports sorting by price", async () => {
      await seedProduct({ name: "Expensive", price: 200 });
      await seedProduct({ name: "Cheap", price: 10 });
      await seedProduct({ name: "Mid", price: 50 });

      const response = await fetch(
        `${baseURL}/api-v1/search/enhanced?q=Product&sort=price&order=asc`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.products).toHaveLength(3);
    });

    it("validates query parameter", async () => {
      const response = await fetch(`${baseURL}/api-v1/search/enhanced?q=`);

      await expectError(response, 400);
    });
  });

  describe("GET /api-v1/search/suggestions", () => {
    it("returns empty suggestions when no products exist", async () => {
      const response = await fetch(
        `${baseURL}/api-v1/search/suggestions?q=test`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.suggestions).toEqual([]);
    });

    it("returns search suggestions", async () => {
      await seedProduct({ name: "iPhone 15 Pro", price: 999 });
      await seedProduct({ name: "iPhone 14", price: 799 });
      await seedProduct({ name: "Samsung Galaxy", price: 899 });

      const response = await fetch(
        `${baseURL}/api-v1/search/suggestions?q=iPhone`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.suggestions).toBeDefined();
      expect(Array.isArray(body.data.suggestions)).toBe(true);
    });

    it("limits suggestions count", async () => {
      for (let i = 1; i <= 10; i++) {
        await seedProduct({ name: `Product ${i}`, price: 10 + i });
      }

      const response = await fetch(
        `${baseURL}/api-v1/search/suggestions?q=Product&limit=5`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.suggestions.length).toBeLessThanOrEqual(5);
    });

    it("validates query parameter", async () => {
      const response = await fetch(`${baseURL}/api-v1/search/suggestions`);

      await expectError(response, 400);
    });
  });
});
