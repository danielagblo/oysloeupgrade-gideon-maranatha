import { expect } from "bun:test";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { createApp } from "../src/app.js";
import { AppDataSource } from "../src/config/database.js";
import { AdminUser } from "../src/entities/AdminUser.js";
import { Category } from "../src/entities/Category.js";
import { Coupon } from "../src/entities/Coupon.js";
import { NotificationHistory } from "../src/entities/NotificationHistory.js";
import { Product } from "../src/entities/Product.js";
import { User } from "../src/entities/User.js";
import { Wallet } from "../src/entities/Wallet.js";
import { initDb } from "./setup.js";

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "debug";
process.env.JWT_SECRET =
  "test-jwt-secret-key-that-is-at-least-32-characters-long";
process.env.SESSION_SECRET =
  "test-session-secret-key-that-is-at-least-32-characters-long";
process.env.ARKESEL_API_KEY = "test-arkesel-key";
process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
process.env.GOOGLE_CALLBACK_URL = "http://localhost:3000/auth/google/callback";
process.env.DB_PASSWORD = "postgres";

import type { Server } from "node:http";
import type { Application } from "express";

export interface TestServer {
  app: Application;
  server: Server;
  baseURL: string;
  port: number;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

export interface TestProduct {
  id: string;
  name: string;
  price: number;
  description?: string;
  categoryId?: string;
  userId?: string;
}

export interface TestAdminUser {
  id: number;
  username: string;
  email?: string;
  password: string;
  role: "super-admin" | "admin" | "staff" | "support";
  isActive?: boolean;
  businessName?: string;
  token?: string;
}

export async function initTestDb() {
  await initDb();
  return AppDataSource;
}

export async function resetDb() {
  const db = await initTestDb();

  const entities = db.entityMetadatas;

  await db.query("SET session_replication_role = replica;");

  for (const entity of entities) {
    try {
      await db.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`
      );
    } catch (error) {
      console.warn(`Could not truncate table ${entity.tableName}:`, error);
    }
  }

  await db.query("SET session_replication_role = DEFAULT;");
}

export async function createTestServer(): Promise<TestServer> {
  await initTestDb();

  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to get server port");
  }
  const { port } = address;
  const baseURL = `http://127.0.0.1:${port}`;

  return { app, server, baseURL, port };
}

export async function closeTestServer(server: Server) {
  if (server && typeof server.close === "function") {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
}

export async function seedUser(
  userData: Partial<TestUser> = {}
): Promise<TestUser> {
  const db = await initTestDb();

  const defaultUser = {
    id: randomUUID(),
    email: `test${randomUUID().slice(0, 8)}@example.com`,
    password: "TestPassword123!",
    ...userData,
  };

  const hashedPassword = await bcrypt.hash(defaultUser.password, 12);

  let name = "Test User";
  if (
    defaultUser.firstName !== undefined ||
    defaultUser.lastName !== undefined
  ) {
    const first = defaultUser.firstName || "";
    const last = defaultUser.lastName || "";
    name = `${first} ${last}`.trim() || "Test User";
  } else if (defaultUser.name !== undefined) {
    name = defaultUser.name;
  }

  const user = new User();
  user.id = defaultUser.id;
  user.email = defaultUser.email;
  user.passwordHash = hashedPassword;
  user.name = name;
  user.emailVerified = true;
  user.createdAt = new Date();
  user.updatedAt = new Date();

  await db.getRepository(User).save(user);

  return {
    id: user.id,
    email: user.email,
    password: defaultUser.password,
    firstName: user.name.split(" ")[0] || "",
    lastName: user.name.split(" ").slice(1).join(" ") || "",
    name: user.name,
  };
}

export async function seedProduct(
  productData: Partial<TestProduct> = {}
): Promise<TestProduct> {
  const db = await initTestDb();

  let userId = productData.userId;
  if (!userId) {
    const defaultUser = await seedUser();
    userId = defaultUser.id;
  }

  let categoryId = productData.categoryId;
  if (!categoryId) {
    let category = await db.getRepository(Category).findOne({
      where: { name: "Electronics" },
    });

    if (!category) {
      category = new Category();
      category.id = randomUUID();
      category.name = "Electronics";
      category.description = "Electronic products";
      category.slug = "electronics";
      await db.getRepository(Category).save(category);
    }

    categoryId = category.id;
  }

  const defaultProduct = {
    id: randomUUID(),
    name: "Test Product",
    price: 29.99,
    description: "A test product for testing",
    categoryId: categoryId,
    userId: userId,
    ...productData,
  };

  const product = new Product();
  product.id = defaultProduct.id;
  product.name = defaultProduct.name;
  product.price = defaultProduct.price;
  product.description = defaultProduct.description;
  product.categoryId = defaultProduct.categoryId;
  product.userId = defaultProduct.userId;
  product.status = "active";
  product.createdAt = new Date();
  product.updatedAt = new Date();

  await db.getRepository(Product).save(product);

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description,
    categoryId: product.categoryId,
    userId: product.userId,
  };
}

export async function seedCoupon(couponData: Partial<Coupon> = {}) {
  const db = await initTestDb();

  const defaultCoupon = {
    id: randomUUID(),
    code: "TEST10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 50,
    maxDiscountAmount: 100,
    usageLimit: 100,
    usedCount: 0,
    isActive: true,
    ...couponData,
  };

  const coupon = new Coupon();
  Object.assign(coupon, defaultCoupon);
  coupon.createdAt = new Date();
  coupon.updatedAt = new Date();

  await db.getRepository(Coupon).save(coupon);

  return coupon;
}

export async function seedWallet(walletData: Partial<Wallet> = {}) {
  const db = await initTestDb();

  let userId = walletData.userId;
  if (!userId) {
    const defaultUser = await seedUser();
    userId = defaultUser.id;
  }

  const defaultWallet = {
    id: randomUUID(),
    userId: userId,
    balance: 1000,
    currency: "USD",
    ...walletData,
  };

  const wallet = new Wallet();
  Object.assign(wallet, defaultWallet);
  wallet.createdAt = new Date();
  wallet.updatedAt = new Date();

  await db.getRepository(Wallet).save(wallet);

  return wallet;
}

import type { NotificationType } from "../src/entities/NotificationHistory";

export async function seedNotification(
  data: Partial<NotificationHistory> & {
    userId: string;
    type?: NotificationType;
  }
) {
  const db = await initTestDb();

  const notification = new NotificationHistory();
  notification.userId = data.userId;
  notification.type = data.type ?? "welcome";
  notification.title = data.title || "Test Notification";
  notification.body = data.body || "This is a test notification";
  notification.data = data.data;
  notification.isRead = data.isRead ?? false;
  notification.readAt = data.readAt;

  const saved = await db.getRepository(NotificationHistory).save(notification);
  return saved;
}

export async function loginUser(
  email: string,
  password: string,
  baseURL: string
): Promise<string> {
  const response = await fetch(`${baseURL}/api-v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = (await response.json()) as { data: { token: string } };
  return data.data.token;
}

export async function createUserAndToken(
  userData: Partial<TestUser> = {},
  baseURL: string
): Promise<{ user: TestUser; token: string }> {
  const user = await seedUser(userData);
  const token = await loginUser(user.email, user.password, baseURL);

  return { user, token };
}

export async function authenticatedRequest(
  url: string,
  token: string,
  options: RequestInit = {}
) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function truncateTable(tableName: string) {
  const db = await initTestDb();
  await db.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
}

export function createAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function expectError(
  response: Response,
  status: number,
  codeOrPattern?: string
) {
  const body = await response.text();
  if (response.status !== status) {
    console.error(
      `Expected status ${status}, got ${response.status}. Response body:`,
      body
    );
  }
  expect(response.status).toBe(status);
  const jsonBody = JSON.parse(body) as {
    success: boolean;
    error?: { code?: string };
    message?: string;
  };
  expect(jsonBody.success).toBe(false);
  if (codeOrPattern) {
    const code = jsonBody?.error?.code || jsonBody?.message;
    expect(String(code)).toMatch(new RegExp(codeOrPattern));
  }
}

export async function expectSuccess(response: Response, status: number) {
  const body = await response.text();
  if (response.status !== status) {
    console.error(
      `Expected status ${status}, got ${response.status}. Response body:`,
      body
    );
    try {
      const parsedBody = JSON.parse(body) as { error?: unknown };
      if (parsedBody.error) {
        console.error("Error details:", parsedBody.error);
      }
    } catch {}
  }
  expect(response.status).toBe(status);
  const jsonBody = JSON.parse(body) as {
    success: boolean;
    [key: string]: unknown;
  };
  expect(jsonBody.success).toBe(true);
  return jsonBody;
}

export async function seedAdminUser(
  adminData: Partial<TestAdminUser> = {}
): Promise<TestAdminUser> {
  const db = await initTestDb();

  const defaultAdmin = {
    username: `admin${randomUUID().slice(0, 8)}`,
    email: `admin${randomUUID().slice(0, 8)}@example.com`,
    password: "AdminPass123!",
    role: "admin" as const,
    isActive: true,
    businessName: "Test Business",
    ...adminData,
  };

  const hashedPassword = await bcrypt.hash(defaultAdmin.password, 12);

  const permissions =
    defaultAdmin.role === "super-admin"
      ? [
          "user:read",
          "user:update",
          "user:delete",
          "user:verify",
          "user:mute",
          "ads:read",
          "ads:moderate",
          "ads:delete",
          "support:read",
          "support:manage",
          "content:manage",
          "system:config",
          "system:reports",
        ]
      : defaultAdmin.role === "admin"
      ? [
          "user:read",
          "user:update",
          "user:verify",
          "user:mute",
          "ads:read",
          "ads:moderate",
          "ads:delete",
          "support:read",
          "support:manage",
          "content:manage",
          "system:reports",
        ]
      : defaultAdmin.role === "staff"
      ? [
          "user:read",
          "ads:read",
          "ads:moderate",
          "support:read",
          "support:manage",
        ]
      : defaultAdmin.role === "support"
      ? ["support:read", "support:manage"]
      : [];

  const admin = new AdminUser();
  admin.username = defaultAdmin.username;
  admin.email = defaultAdmin.email;
  admin.passwordHash = hashedPassword;
  admin.role = defaultAdmin.role;
  admin.permissions = permissions;
  admin.isActive = defaultAdmin.isActive!;
  admin.businessName = defaultAdmin.businessName;
  admin.createdAt = new Date();
  admin.updatedAt = new Date();

  const savedAdmin = await db.getRepository(AdminUser).save(admin);

  return {
    id: savedAdmin.id,
    username: savedAdmin.username,
    email: savedAdmin.email,
    password: defaultAdmin.password,
    role: savedAdmin.role,
    isActive: savedAdmin.isActive,
    businessName: savedAdmin.businessName,
  };
}

export async function loginAdminUser(
  username: string,
  password: string,
  baseURL: string
): Promise<string> {
  const response = await fetch(`${baseURL}/api-v1/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(`Admin login failed: ${response.status}`);
  }

  const data = (await response.json()) as { data: { token: string } };
  return data.data.token;
}

export async function createAdminAndToken(
  adminData: Partial<TestAdminUser> = {},
  baseURL: string
): Promise<{ admin: TestAdminUser; token: string }> {
  const admin = await seedAdminUser(adminData);
  const token = await loginAdminUser(admin.username, admin.password, baseURL);

  return { admin, token };
}

export async function authenticatedAdminRequest(
  url: string,
  token: string,
  options: RequestInit = {}
) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function cleanupTestDb() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
