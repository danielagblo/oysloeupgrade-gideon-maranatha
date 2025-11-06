import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { RouteDiscovery } from "./route-discovery.ts";
import { registerWebSocketEndpoints } from "../src/schemas/websocket-registry.ts";

import {
  User,
  CreateUserBody,
  UpdateUserBody,
  LoginBody,
  UserWithWallet,
  Product,
  CreateProductBody,
  UpdateProductBody,
  ProductWithDetails,
  ProductQueryParams,
  ErrorSchema,
  TokenResponse,
  HealthCheckResponse,
  PaginatedResponse,
  SuccessResponse,
} from "../src/schemas/index.js";

async function generateOpenAPISpec() {
  const registry = new OpenAPIRegistry();

  registry.register("User", User);
  registry.register("CreateUserBody", CreateUserBody);
  registry.register("UpdateUserBody", UpdateUserBody);
  registry.register("LoginBody", LoginBody);
  registry.register("UserWithWallet", UserWithWallet);
  registry.register("Product", Product);
  registry.register("CreateProductBody", CreateProductBody);
  registry.register("UpdateProductBody", UpdateProductBody);
  registry.register("ProductWithDetails", ProductWithDetails);
  registry.register("ProductQueryParams", ProductQueryParams);
  registry.register("Error", ErrorSchema);
  registry.register("TokenResponse", TokenResponse);
  registry.register("HealthCheckResponse", HealthCheckResponse);

  registry.register(
    "SuccessResponse",
    SuccessResponse(z.any().describe("Response data"))
  );

  registry.register("PaginatedProducts", PaginatedResponse(Product));
  registry.register(
    "PaginatedProductsWithDetails",
    PaginatedResponse(ProductWithDetails)
  );

  registry.register("SuccessUser", SuccessResponse(User));
  registry.register("SuccessUserWithWallet", SuccessResponse(UserWithWallet));
  registry.register("SuccessProduct", SuccessResponse(Product));
  registry.register(
    "SuccessProductWithDetails",
    SuccessResponse(ProductWithDetails)
  );
  registry.register("SuccessToken", SuccessResponse(TokenResponse));

  console.log(" Discovering routes automatically...");
  const routeDiscovery = new RouteDiscovery("src");
  await routeDiscovery.registerWithOpenAPI(registry, "/api-v1");

  registerWebSocketEndpoints(registry);

  const generator = new OpenApiGeneratorV3(registry.definitions);

  const doc = generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Oysloe Marketplace API",
      version: "1.0.0",
      description:
        "A comprehensive marketplace API for buying and selling products with user management, authentication, and product catalog features.",
      contact: {
        name: "Oysloe Team",
        email: "support@oysloe.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "https://api.oysloe.com",
        description: "Production server",
      },
      {
        url: "https://staging-api.oysloe.com",
        description: "Staging server",
      },
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      {
        name: "System",
        description: "System health and status endpoints",
      },
      {
        name: "Authentication",
        description: "User authentication and authorization",
      },
      {
        name: "Users",
        description: "User profile management",
      },
      {
        name: "Products",
        description: "Product catalog management",
      },
      {
        name: "Wallet",
        description: "Wallet and payment management",
      },
      {
        name: "Coupons",
        description: "Coupon and discount management",
      },
      {
        name: "Referrals",
        description: "Referral system management",
      },
      {
        name: "Reviews",
        description: "Product reviews and ratings",
      },
      {
        name: "FCM",
        description: "Firebase Cloud Messaging for push notifications",
      },
      {
        name: "Chat",
        description: "Real-time messaging system",
      },
    ],
  });

  doc.components = {
    ...doc.components,
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token obtained from login endpoint",
      },
    },
  };

  const outDir = path.join(process.cwd(), "spec");
  mkdirSync(outDir, { recursive: true });

  writeFileSync(
    path.join(outDir, "openapi.json"),
    JSON.stringify(doc, null, 2)
  );

  writeFileSync(
    path.join(outDir, "openapi.yaml"),
    yaml.dump(doc, { noRefs: true })
  );

  console.log(" OpenAPI specification generated successfully!");
  console.log(" JSON: spec/openapi.json");
  console.log(" YAML: spec/openapi.yaml");
  console.log(" You can now serve the documentation at /docs");
}

generateOpenAPISpec().catch(console.error);
