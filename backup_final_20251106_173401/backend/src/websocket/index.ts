import type { Server as HTTPServer } from 'node:http';
import { logInfo } from '../utils/logger.js';
import { AdminHandler } from './handlers/admin.handler.js';
import { ChatHandler } from './handlers/chat.handler.js';
import { initializeWebSocket } from './server.js';

export function setupWebSocket(server: HTTPServer): void {
  try {
    const io = initializeWebSocket(server);

    const chatHandler = new ChatHandler();
    chatHandler.initializeHandlers(io);

    const adminHandler = new AdminHandler();
    adminHandler.initializeHandlers(io);

    logInfo('WebSocket setup completed successfully');
  } catch (error) {
    logInfo(`WebSocket setup failed: ${error}`);
    throw error;
  }
}
