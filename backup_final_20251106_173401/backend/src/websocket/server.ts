import type { Server as HTTPServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config/env.js';
import { logInfo } from '../utils/logger.js';

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: Array.isArray(config.cors.origin)
        ? config.cors.origin
        : config.cors.origin.split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  logInfo('WebSocket server initialized');
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket server not initialized. Call initializeWebSocket() first.');
  }
  return io;
}

export function closeWebSocket(): void {
  if (io) {
    io.close();
    io = null;
    logInfo('WebSocket server closed');
  }
}
