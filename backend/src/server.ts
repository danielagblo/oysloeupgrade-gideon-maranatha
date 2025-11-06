import { createApp } from './app.js';
import { closeDatabase, initializeDatabase } from './config/database.js';
import { config } from './config/env.js';
import { initializeFirebase } from './config/firebase.js';
import { closeRedis } from './config/redis.js';
import { logError, logInfo } from './utils/logger.js';
import { setupWebSocket } from './websocket/index.js';

const startServer = async () => {
  try {
    logInfo('Connecting to database...');
    await initializeDatabase();

    logInfo('Initializing Firebase...');
    await initializeFirebase();

    const app = createApp();

    const server = app.listen(config.server.port, () => {
      logInfo(`Server running on port ${config.server.port}`);
      logInfo(`Environment: ${config.server.env}`);
      logInfo(`API base: /api-${config.server.apiVersion}`);
    });

    logInfo('Setting up WebSocket server...');
    setupWebSocket(server);

    const gracefulShutdown = async (signal: string) => {
      logInfo(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logInfo('HTTP server closed');

        try {
          await closeDatabase();
          await closeRedis();
          logInfo('All connections closed');
          process.exit(0);
        } catch (error) {
          logError('Error during shutdown', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logError('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    });

    process.on('uncaughtException', (error) => {
      logError('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    logError('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
