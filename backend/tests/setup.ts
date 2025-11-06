import 'reflect-metadata';
import { AppDataSource } from '../src/config/database.js';

export async function initDb() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();

    console.log(
      'Registered entities:',
      AppDataSource.options.entities!.map((e: unknown) => (typeof e === 'function' ? e.name : e))
    );
  }
}

export async function closeDb() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
