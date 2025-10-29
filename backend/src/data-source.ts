import "reflect-metadata";
import { DataSource } from "typeorm";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config/env.js";
import { ENTITIES } from "./entities/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.name,
  synchronize: false,
  logging: config.database.logging,
  entities: config.server.isProduction
    ? [...ENTITIES] // In production, use bundled ENTITIES array
    : [join(__dirname, "entities", "**", "*.{ts,js}")], // In development, use glob pattern
  migrations: [join(__dirname, "migrations", "*.{ts,js}")],
  subscribers: [],
  ssl: config.server.isProduction ? { rejectUnauthorized: false } : false,
});
