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
  createUserAndToken,
  expectError,
  expectSuccess,
} from "../test-helpers";

describe("Products API", () => {
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

  describe("GET /api-v1/products/", () => {
    it("returns empty list when no products exist", async () => {
      const response = await fetch(`${baseURL}/api-v1/products/`);

      const body = await expectSuccess(response, 200);
      expect(body.data.products).toEqual([]);
      expect(body.data.pagination.total).toBe(0);
    });

    it("returns list of products", async () => {
      await seedProduct({ name: "Test Product 1", price: 29.99 });
      await seedProduct({ name: "Test Product 2", price: 39.99 });

      const response = await fetch(`${baseURL}/api-v1/products/`);

      const body = await expectSuccess(response, 200);
      expect(body.data.products).toHaveLength(2);
      expect(body.data.pagination.total).toBe(2);

      const productNames = body.data.products.map(
        (p: { name: string }) => p.name
      );
      expect(productNames).toContain("Test Product 1");
      expect(productNames).toContain("Test Product 2");
    });

    it("supports pagination", async () => {
      for (let i = 1; i <= 5; i++) {
        await seedProduct({ name: `Product ${i}`, price: 10 + i });
      }

      const response = await fetch(
        `${baseURL}/api-v1/products/?page=1&limit=2`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.products).toHaveLength(2);
      expect(body.data.pagination.total).toBe(5);
      expect(body.data.pagination.page).toBe(1);
      expect(body.data.pagination.limit).toBe(2);
    });

    it("supports search query", async () => {
      await seedProduct({ name: "Electronics Gadget", price: 99.99 });
      await seedProduct({ name: "Clothing Item", price: 29.99 });

      const response = await fetch(
        `${baseURL}/api-v1/products/?search=Electronics`
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.products).toHaveLength(1);
      expect(body.data.products[0].name).toBe("Electronics Gadget");
    });
  });

  describe("GET /api-v1/products/:id", () => {
    it("returns product by id", async () => {
      const product = await seedProduct({
        name: "Test Product",
        price: 29.99,
        description: "A test product",
      });

      const response = await fetch(`${baseURL}/api-v1/products/${product.id}`);

      const body = await expectSuccess(response, 200);
      expect(body.data.product.id).toBe(product.id);
      expect(body.data.product.name).toBe("Test Product");
      expect(body.data.product.price).toBe("29.99");
      expect(body.data.product.description).toBe("A test product");
    });

    it("returns 404 for non-existent product", async () => {
      const response = await fetch(
        `${baseURL}/api-v1/products/00000000-0000-0000-0000-000000000000`
      );

      await expectError(response, 404);
    });

    it("validates product id format", async () => {
      const response = await fetch(`${baseURL}/api-v1/products/invalid-id`);

      await expectError(response, 400);
    });
  });

  describe("POST /api-v1/products/", () => {
    it("creates product with valid data", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "New Product",
          price: 49.99,
          description: "A new product",
          category: "Electronics",
        }),
      });

      const body = await expectSuccess(response, 201);
      expect(body.data.product.name).toBe("New Product");
      expect(body.data.product.price).toBe(49.99);
      expect(body.data.product.description).toBe("A new product");
      expect(body.data.product.categoryId).toBeDefined();
    });

    it("rejects creation without authentication", async () => {
      const response = await fetch(`${baseURL}/api-v1/products/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Product",
          price: 49.99,
        }),
      });

      await expectError(response, 401);
    });

    it("validates required fields", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      await expectError(response, 400);
    });

    it("validates price is positive", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(`${baseURL}/api-v1/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "New Product",
          price: -10,
        }),
      });

      await expectError(response, 400);
    });
  });

  describe("PUT /api-v1/products/:id", () => {
    it("updates product with valid data", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);
      const product = await seedProduct({
        name: "Original Product",
        price: 29.99,
        userId: user.id,
      });

      const response = await fetch(`${baseURL}/api-v1/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "Updated Product",
          price: 39.99,
          description: "Updated description",
        }),
      });

      const body = await expectSuccess(response, 200);
      expect(body.data.product.name).toBe("Updated Product");
      expect(body.data.product.price).toBe(39.99);
      expect(body.data.product.description).toBe("Updated description");
    });

    it("rejects update without authentication", async () => {
      const product = await seedProduct({ name: "Test Product" });

      const response = await fetch(`${baseURL}/api-v1/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Product",
        }),
      });

      await expectError(response, 401);
    });

    it("returns 404 for non-existent product", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(
        `${baseURL}/api-v1/products/00000000-0000-0000-0000-000000000000`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: "Updated Product",
          }),
        }
      );

      await expectError(response, 404);
    });
  });

  describe("DELETE /api-v1/products/:id", () => {
    it("deletes product", async () => {
      const { user, token } = await createUserAndToken({}, baseURL);
      const product = await seedProduct({
        name: "Product to Delete",
        userId: user.id,
      });

      const response = await fetch(`${baseURL}/api-v1/products/${product.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await expectSuccess(response, 200);

      const getResponse = await fetch(
        `${baseURL}/api-v1/products/${product.id}`
      );
      await expectError(getResponse, 404);
    });

    it("rejects deletion without authentication", async () => {
      const product = await seedProduct({ name: "Test Product" });

      const response = await fetch(`${baseURL}/api-v1/products/${product.id}`, {
        method: "DELETE",
      });

      await expectError(response, 401);
    });

    it("returns 404 for non-existent product", async () => {
      const { token } = await createUserAndToken({}, baseURL);

      const response = await fetch(
        `${baseURL}/api-v1/products/00000000-0000-0000-0000-000000000000`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await expectError(response, 404);
    });
  });
});
