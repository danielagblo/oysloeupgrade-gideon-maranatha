import type { Server as SocketIOServer } from 'socket.io';
import { logInfo } from './logger.js';

let ioInstance: SocketIOServer | null = null;

export function initializeWebSocketHelper(io: SocketIOServer): void {
  ioInstance = io;
  logInfo('WebSocket helper initialized');
}

export async function isUserInRoom(_userId: string, roomId: string): Promise<boolean> {
  if (!ioInstance) {
    logInfo('WebSocket not initialized, assuming user is offline');
    return false;
  }

  try {
    const roomKey = `room:${roomId}`;
    const socketsInRoom = await ioInstance.in(roomKey).allSockets();

    return socketsInRoom.size > 0;
  } catch (error) {
    logInfo(`Error checking user room membership: ${error}`);
    return false;
  }
}

export async function getUserSocketIds(_userId: string): Promise<string[]> {
  if (!ioInstance) {
    return [];
  }

  try {

    const sockets = await ioInstance.fetchSockets();
    return sockets.map((socket) => socket.id);
  } catch (error) {
    logInfo(`Error getting user socket IDs: ${error}`);
    return [];
  }
}

export async function isUserOnline(userId: string): Promise<boolean> {
  const socketIds = await getUserSocketIds(userId);
  return socketIds.length > 0;
}

export async function getRoomMembers(roomId: string): Promise<string[]> {
  if (!ioInstance) {
    return [];
  }

  try {
    const roomKey = `room:${roomId}`;
    const socketsInRoom = await ioInstance.in(roomKey).allSockets();
    return Array.from(socketsInRoom);
  } catch (error) {
    logInfo(`Error getting room members: ${error}`);
    return [];
  }
}
