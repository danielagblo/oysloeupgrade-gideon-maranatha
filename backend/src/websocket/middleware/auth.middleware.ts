import type { Socket } from "socket.io";
import { AppDataSource } from "../../config/database.js";
import { verifyToken } from "../../utils/jwt.js";
import { logError, logInfo } from "../../utils/logger.js";

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    deleted: boolean;
  };
}

export async function authenticateSocket(
  socket: AuthenticatedSocket
): Promise<boolean> {
  try {
    const token =
      socket.handshake.auth?.token ||
      (typeof socket.handshake.query.token === "string"
        ? socket.handshake.query.token
        : undefined) ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      logError("No token provided in WebSocket connection");
      return false;
    }

    let decoded: { userId: string; email: string; level: string };
    try {
      decoded = verifyToken(token);
    } catch (error) {
      logError(`Invalid token in WebSocket connection: ${error}`);
      return false;
    }

    const userRepository = AppDataSource.getRepository("User");
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });

    if (!user) {
      logError(`User not found for token: ${decoded.userId}`);
      return false;
    }

    if (user.deleted || !user.isActive) {
      logError(`User account is inactive or deleted: ${user.id}`);
      return false;
    }

    socket.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      deleted: user.deleted,
    };
    logInfo(`WebSocket authenticated for user: ${user.email}`);
    return true;
  } catch (error) {
    logError(`WebSocket authentication error: ${error}`);
    return false;
  }
}

export function requireAuth(socket: AuthenticatedSocket): {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  deleted: boolean;
} {
  if (!socket.user) {
    throw new Error("Socket not authenticated");
  }
  return socket.user;
}
