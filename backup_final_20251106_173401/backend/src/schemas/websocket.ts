import { z } from 'zod';

export const WebSocketResponse = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
});

export const JoinRoomRequest = z
  .object({
    roomId: z.string().optional(),
    roomName: z.string().optional(),
  })
  .refine((data) => data.roomId || data.roomName, {
    message: 'Either roomId or roomName must be provided',
  });

export const JoinRoomResponse = WebSocketResponse;

export const ChatMessage = z.object({
  id: z.string().uuid(),
  sender: z.string(),
  email: z.string().email(),
  content: z.string(),
  timestamp: z.string().datetime(),
});

export const ChatHistoryResponse = z.object({
  type: z.literal('chat_history'),
  messages: z.array(ChatMessage),
});

export const SendMessageRequest = z.object({
  message: z.string().min(1).max(1000),
  roomId: z.string(),
  messageType: z.enum(['text', 'image', 'file', 'system']).default('text'),
});

export const SendMessageResponse = WebSocketResponse;

export const ChatMessageEvent = z.object({
  type: z.literal('chat_message'),
  message: z.string(),
  username: z.string(),
  email: z.string().email(),
  timestamp: z.string().datetime(),
});

export const TypingRequest = z.object({
  roomId: z.string(),
});

export const TypingResponse = WebSocketResponse;

export const TypingNotificationEvent = z.object({
  type: z.literal('typing_notification'),
  is_typing: z.boolean(),
  username: z.string(),
});

export const StopTypingNotificationEvent = z.object({
  type: z.literal('stop_typing_notification'),
  is_typing: z.boolean(),
  username: z.string(),
});

export const JoinPrivateChatRequest = z.object({
  otherUserEmail: z.string().email(),
});

export const JoinPrivateChatResponse = WebSocketResponse;

export const ChatroomMetadata = z.object({
  id: z.string().uuid(),
  roomId: z.string(),
  name: z.string(),
  isGroup: z.boolean(),
  unreadCount: z.number().int().min(0),
  lastMessage: z
    .object({
      content: z.string(),
      timestamp: z.string().datetime(),
      sender: z.string(),
    })
    .optional(),
  otherUser: z.string().optional(),
  otherUserAvatar: z.string().optional(),
});

export const ChatroomsListResponse = z.object({
  type: z.literal('chatrooms_list'),
  chatrooms: z.array(ChatroomMetadata),
});

export const UnreadCountResponse = z.object({
  type: z.literal('unread_count'),
  count: z.number().int().min(0),
});

export const UnreadCountUpdateEvent = z.object({
  type: z.literal('unread_count_update'),
});

export const WebSocketErrorEvent = z.object({
  type: z.literal('error'),
  message: z.string(),
});

export const WebSocketConnectionInfo = z.object({
  socketId: z.string(),
  transport: z.enum(['websocket', 'polling']),
  authenticated: z.boolean(),
  userId: z.string().uuid().optional(),
  userEmail: z.string().email().optional(),
});

export const WebSocketEvent = z.discriminatedUnion('type', [
  ChatHistoryResponse,
  ChatMessageEvent,
  TypingNotificationEvent,
  StopTypingNotificationEvent,
  ChatroomsListResponse,
  UnreadCountResponse,
  UnreadCountUpdateEvent,
  WebSocketErrorEvent,
]);

export const WebSocketRequest = z.discriminatedUnion('event', [
  z.object({ event: z.literal('join_room'), data: JoinRoomRequest }),
  z.object({ event: z.literal('send_message'), data: SendMessageRequest }),
  z.object({ event: z.literal('typing'), data: TypingRequest }),
  z.object({ event: z.literal('stop_typing'), data: TypingRequest }),
  z.object({
    event: z.literal('join_private_chat'),
    data: JoinPrivateChatRequest,
  }),
  z.object({ event: z.literal('get_chatrooms'), data: z.object({}) }),
  z.object({ event: z.literal('get_unread_count'), data: z.object({}) }),
]);

export const WebSocketConfig = z.object({
  url: z.string().url(),
  transports: z.array(z.enum(['websocket', 'polling'])),
  timeout: z.number().int().positive().default(5000),
  reconnection: z.boolean().default(true),
  reconnectionAttempts: z.number().int().positive().default(5),
  reconnectionDelay: z.number().int().positive().default(1000),
});

export const WebSocketAuth = z.object({
  token: z.string(),
});

export const RoomKey = z.object({
  roomId: z.string(),
  normalizedKey: z.string(),
  isPrivate: z.boolean(),
  participants: z.array(z.string().uuid()),
});

export const MessageStatus = z.object({
  messageId: z.string().uuid(),
  status: z.enum(['sent', 'delivered', 'read']),
  timestamp: z.string().datetime(),
  userId: z.string().uuid(),
});

export const TypingStatus = z.object({
  userId: z.string().uuid(),
  roomId: z.string(),
  isTyping: z.boolean(),
  timestamp: z.string().datetime(),
});

export const WebSocketStats = z.object({
  totalConnections: z.number().int().min(0),
  activeRooms: z.number().int().min(0),
  messagesPerSecond: z.number().min(0),
  averageLatency: z.number().min(0),
  uptime: z.number().int().min(0),
});
