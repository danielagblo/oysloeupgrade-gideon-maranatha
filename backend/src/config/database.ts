import 'reflect-metadata';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { logError, logInfo } from '../utils/logger.js';
import { config } from './env.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.name,
  synchronize: false,
  logging: config.database.logging,
  entities: [join(__dirname, '..', 'entities', '**', '*.{ts,js}')],
  subscribers: [],
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logInfo('Database connection established');

    const pendingMigrations = await AppDataSource.showMigrations();
    if (pendingMigrations) {
      logInfo('Running pending migrations...');
      await AppDataSource.runMigrations();
      logInfo('Migrations completed');
    }
  } catch (error) {
    logError('Database connection failed:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logInfo('Database connection closed');
  }
};
