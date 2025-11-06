import type { Server as SocketIOServer } from 'socket.io';
import { ChatService } from '../../services/chat.service.js';
import { logError, logInfo } from '../../utils/logger.js';
import { notificationHelper } from '../../utils/notification-helper.js';
import { toRoomKey, toUserRoomKey } from '../../utils/rooms.js';
import { isUserInRoom } from '../../utils/websocket-helper.js';
import {
  type AuthenticatedSocket,
  authenticateSocket,
  requireAuth,
} from '../middleware/auth.middleware.js';

async function logRoomMembers(io: SocketIOServer, roomKey: string): Promise<void> {
  try {
    const sockets = await io.in(roomKey).fetchSockets();
    const ids = sockets.map((s) => s.id);
    logInfo(`[rooms] ${roomKey} has ${ids.length} sockets: [${ids.join(', ')}]`);
  } catch (error) {
    logError(`Error fetching room members: ${error}`);
  }
}

export class ChatHandler {
  private chatService = new ChatService();

  initializeHandlers(io: SocketIOServer): void {
    io.on('connection', async (socket: AuthenticatedSocket) => {
      try {
        const isAuthenticated = await authenticateSocket(socket);
        if (!isAuthenticated) {
          socket.disconnect();
          return;
        }

        const user = requireAuth(socket);
        logInfo(`User ${user.email} connected to WebSocket`);

        logInfo(`Registering event handlers for user: ${user.email}`);
        this.registerChatCore(socket, user);
        this.registerChatrooms(socket, user);
        this.registerUnreadCount(socket, user);
        logInfo(`Event handlers registered for user: ${user.email}`);

        socket.onAny((eventName, ...args) => {
          logInfo(`Received event: ${eventName} with args: ${JSON.stringify(args)}`);
        });

        socket.on('disconnect', (reason) => {
          logInfo(`User ${user.email} disconnected: ${reason}`);
        });
      } catch (error) {
        logError(`WebSocket connection error: ${error}`);
        socket.disconnect();
      }
    });
  }

  private registerChatCore(
    socket: AuthenticatedSocket,
    _user: { id: string; email: string; name: string }
  ): void {
    socket.on(
      'join_room',
      async (
        data: { roomId?: string; roomName?: string },
        ack?: (res: { ok: boolean; error?: string }) => void
      ) => {
        try {
          logInfo(`Received join_room event: ${JSON.stringify(data)}`);
          const roomId = data.roomId ?? data.roomName;
          if (!roomId) {
            logError('No roomId or roomName provided');
            ack?.({ ok: false, error: 'roomId or roomName required' });
            return;
          }
          logInfo(`Processing join_room for roomId: ${roomId}`);
          await this.handleJoinRoom(socket, roomId);
          ack?.({ ok: true });
        } catch (error) {
          logError(`Join room error: ${error}`);
          ack?.({ ok: false, error: String(error) });
        }
      }
    );

    socket.on(
      'send_message',
      async (
        data: {
          message: string;
          roomId: string;
          messageType?: string;
        },
        ack?: (res: { ok: boolean; error?: string }) => void
      ) => {
        try {
          await this.handleSendMessage(socket, data);
          ack?.({ ok: true });
        } catch (error) {
          logError(`Send message error: ${error}`);
          ack?.({ ok: false, error: String(error) });
        }
      }
    );

    socket.on('typing', async (data: { roomId: string }) => {
      await this.handleTyping(socket, data.roomId, true);
    });

    socket.on('stop_typing', async (data: { roomId: string }) => {
      await this.handleTyping(socket, data.roomId, false);
    });

    socket.on('join_private_chat', async (data: { otherUserEmail: string }) => {
      await this.handleJoinPrivateChat(socket, data.otherUserEmail);
    });
  }

  private registerChatrooms(
    socket: AuthenticatedSocket,
    user: { id: string; email: string; name: string }
  ): void {
    socket.join('chatrooms_updates');

    this.sendChatroomsList(socket, user.id);

    socket.on('get_chatrooms', async (ack?: (res: { ok: boolean; error?: string }) => void) => {
      try {
        await this.sendChatroomsList(socket, user.id);
        ack?.({ ok: true });
      } catch (error) {
        logError(`Chatrooms list error: ${error}`);
        ack?.({ ok: false, error: String(error) });
      }
    });
  }

  private registerUnreadCount(
    socket: AuthenticatedSocket,
    user: { id: string; email: string; name: string }
  ): void {
    const unreadRoomKey = toUserRoomKey(user.id, 'unread');
    socket.join(unreadRoomKey);

    this.sendUnreadCount(socket, user.id);

    socket.on('get_unread_count', async (ack?: (res: { ok: boolean; error?: string }) => void) => {
      try {
        await this.sendUnreadCount(socket, user.id);
        ack?.({ ok: true });
      } catch (error) {
        logError(`Unread count error: ${error}`);
        ack?.({ ok: false, error: String(error) });
      }
    });

    socket.on('unread_count_update', async () => {
      await this.sendUnreadCount(socket, user.id);
    });
  }

  private async handleJoinRoom(socket: AuthenticatedSocket, roomId: string): Promise<void> {
    try {
      const user = requireAuth(socket);

      logInfo(`Attempting to ensure room exists: ${roomId}`);
      const chatroom = await this.chatService.ensureRoom(roomId);
      if (!chatroom) {
        logError(`Failed to ensure room: ${roomId}`);
        socket.emit('error', { message: 'Chatroom not found' });
        return;
      }
      logInfo(`Room ensured: ${roomId} -> ${chatroom.id}`);

      const roomKey = toRoomKey(roomId);
      socket.join(roomKey);

      await logRoomMembers(socket.nsp.server, roomKey);

      logInfo(`Socket ${socket.id} is now in rooms: [${Array.from(socket.rooms).join(', ')}]`);
      const history = await this.chatService.getChatHistory(chatroom.id, 50);
      const historyData = {
        type: 'chat_history',
        messages: history.reverse().map((msg) => ({
          id: msg.id,
          sender: msg.sender?.name || 'Unknown',
          email: msg.sender?.email || '',
          content: msg.content,
          timestamp: msg.createdAt.toISOString(),
        })),
      };

      socket.emit('chat_history', historyData);
      logInfo(`Sent chat history to ${user.email}: ${historyData.messages.length} messages`);

      await this.chatService.markMessagesAsRead(chatroom.id, user.id);

      await this.notifyUnreadCountUpdates(socket, user.id);

      logInfo(`User ${user.email} joined room ${roomKey}`);
    } catch (error) {
      logError(`Error joining room: ${error}`);
      throw error;
    }
  }

  private async handleSendMessage(
    socket: AuthenticatedSocket,
    data: { message: string; roomId: string; messageType?: string }
  ): Promise<void> {
    try {
      const user = requireAuth(socket);

      const chatroom = await this.chatService.findRoom(data.roomId);
      if (!chatroom) {
        socket.emit('error', { message: 'Chatroom not found' });
        return;
      }

      type MessageType = 'text' | 'image' | 'audio';
      const messageType: MessageType = (data.messageType as MessageType) ?? 'text';

      const savedMessage = await this.chatService.saveMessage(
        chatroom.id,
        user.id,
        data.message,
        messageType
      );

      if (!savedMessage) {
        socket.emit('error', { message: 'Failed to save message' });
        return;
      }

      const messageData = {
        type: 'chat_message',
        message: data.message,
        username: user.name,
        email: user.email,
        timestamp: savedMessage.createdAt.toISOString(),
      };

      const roomKey = toRoomKey(data.roomId);
      logInfo(`Broadcasting message to room: ${roomKey}`);
      socket.to(roomKey).emit('chat_message', messageData);
      socket.emit('chat_message', messageData);

      socket.to('chatrooms_updates').emit('chatrooms_update', { type: 'chatrooms_update' });

      await this.notifyUnreadCountUpdates(socket, user.id);

      await this.sendChatNotifications(chatroom.id, user, data.message, savedMessage.id);

      logInfo(`Message sent by ${user.email} in room ${roomKey}`);
    } catch (error) {
      logError(`Error sending message: ${error}`);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleTyping(
    socket: AuthenticatedSocket,
    roomId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const user = requireAuth(socket);

      const typingData = {
        type: isTyping ? 'typing_notification' : 'stop_typing_notification',
        is_typing: isTyping,
        username: user.email,
      };

      const roomKey = toRoomKey(roomId);

      const roomSize = (await socket.nsp.adapter.sockets(new Set([roomKey]))).size;
      logInfo(
        `Typing in ${roomKey} — members=${roomSize}, from=${socket.id}, isTyping=${isTyping}`
      );

      socket.to(roomKey).emit(isTyping ? 'typing' : 'stop_typing', typingData);
    } catch (error) {
      logError(`Error handling typing: ${error}`);
    }
  }

  private async handleJoinPrivateChat(
    socket: AuthenticatedSocket,
    otherUserEmail: string
  ): Promise<void> {
    try {
      const user = requireAuth(socket);

      const otherUser = await this.chatService.findUserByEmail(otherUserEmail);

      if (!otherUser) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      if (otherUser.id === user.id) {
        socket.emit('error', { message: 'Cannot chat with yourself' });
        return;
      }

      const chatroom = await this.chatService.getOrCreatePrivateChatroom(user.id, otherUser.id);

      if (!chatroom) {
        socket.emit('error', { message: 'Failed to create chatroom' });
        return;
      }

      const roomKey = toRoomKey(chatroom.roomId);
      socket.join(roomKey);

      const history = await this.chatService.getChatHistory(chatroom.id, 50);
      socket.emit('chat_history', {
        type: 'chat_history',
        messages: history.reverse().map((msg) => ({
          id: msg.id,
          sender: msg.sender?.name || 'Unknown',
          email: msg.sender?.email || '',
          content: msg.content,
          timestamp: msg.createdAt.toISOString(),
        })),
      });

      await this.chatService.markMessagesAsRead(chatroom.id, user.id);

      logInfo(`User ${user.email} joined private chat with ${otherUserEmail}`);
    } catch (error) {
      logError(`Error joining private chat: ${error}`);
      socket.emit('error', { message: 'Failed to join private chat' });
    }
  }

  private async sendChatroomsList(socket: AuthenticatedSocket, userId: string): Promise<void> {
    try {
      const chatrooms = await this.chatService.getChatroomsForUser(userId);

      socket.emit('chatrooms_list', {
        type: 'chatrooms_list',
        chatrooms,
      });
    } catch (error) {
      logError(`Error sending chatrooms list: ${error}`);
    }
  }

  private async sendUnreadCount(socket: AuthenticatedSocket, userId: string): Promise<void> {
    try {
      const count = await this.chatService.getTotalUnreadCount(userId);

      socket.emit('unread_count', {
        type: 'unread_count',
        count,
      });
    } catch (error) {
      logError(`Error sending unread count: ${error}`);
    }
  }

  private async notifyUnreadCountUpdates(
    socket: AuthenticatedSocket,
    userId: string
  ): Promise<void> {
    try {
      const unreadRoomKey = toUserRoomKey(userId, 'unread');
      socket.to(unreadRoomKey).emit('unread_count_update', {
        type: 'unread_count_update',
      });
    } catch (error) {
      logError(`Error notifying unread count updates: ${error}`);
    }
  }

  private async sendChatNotifications(
    roomId: string,
    sender: { id: string; name: string; email: string },
    message: string,
    messageId: string
  ): Promise<void> {
    try {
      const roomMembers = await this.chatService.getRoomMembers(roomId);

      const recipients = roomMembers.filter((member) => member.id !== sender.id);

      for (const recipient of recipients) {
        try {
          const isOnline = await isUserInRoom(recipient.id, roomId);

          if (!isOnline) {
            await notificationHelper.notifyNewMessage(
              recipient.id,
              sender.name,
              message,
              roomId,
              sender.id,
              messageId
            );
          }
        } catch (error) {
          logError(`Error sending chat notification to user ${recipient.id}: ${error}`);
        }
      }
    } catch (error) {
      logError(`Error sending chat notifications: ${error}`);
    }
  }
}
