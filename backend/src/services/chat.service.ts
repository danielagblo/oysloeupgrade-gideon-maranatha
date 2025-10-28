import { AppDataSource } from "../config/database.js";
import { Chatroom } from "../entities/Chatroom.js";
import { ChatroomMember } from "../entities/ChatroomMember.js";
import { Message } from "../entities/Message.js";
import { User } from "../entities/User.js";
import { logError, logInfo } from "../utils/logger.js";

export interface ChatroomWithMetadata {
  id: string;
  name: string;
  isGroup: boolean;
  unread: number;
  createdAt: Date;
  otherUser?: string;
  otherUserAvatar?: string;
  lastMessage?: {
    text: string;
    createdAt: Date;
    sender: string;
  };
}

export class ChatService {
  private get chatroomRepository() {
    return AppDataSource.getRepository(Chatroom);
  }

  private get messageRepository() {
    return AppDataSource.getRepository(Message);
  }

  private get memberRepository() {
    return AppDataSource.getRepository(ChatroomMember);
  }

  private get userRepository() {
    return AppDataSource.getRepository(User);
  }

  async getOrCreatePrivateChatroom(
    user1Id: string,
    user2Id: string
  ): Promise<Chatroom | null> {
    try {
      const existingRoom = await this.chatroomRepository
        .createQueryBuilder("room")
        .leftJoin("room.members", "member1")
        .leftJoin("room.members", "member2")
        .where("room.isGroup = false")
        .andWhere("member1.user_id = :user1Id", { user1Id })
        .andWhere("member2.user_id = :user2Id", { user2Id })
        .getOne();

      if (existingRoom) {
        return existingRoom;
      }

      const roomId = this.generatePrivateRoomId(user1Id, user2Id);
      const roomName = `private_${roomId}`;

      const chatroom = this.chatroomRepository.create({
        roomId,
        name: roomName,
        isGroup: false,
      });

      const savedRoom = await this.chatroomRepository.save(chatroom);

      const member1 = this.memberRepository.create({
        chatroomId: savedRoom.id,
        userId: user1Id,
      });

      const member2 = this.memberRepository.create({
        chatroomId: savedRoom.id,
        userId: user2Id,
      });

      await this.memberRepository.save([member1, member2]);

      logInfo(
        `Created private chatroom between users ${user1Id} and ${user2Id}`
      );
      return savedRoom;
    } catch (error) {
      logError(`Error creating private chatroom: ${error}`);
      return null;
    }
  }

  async getChatHistory(roomId: string, limit: number = 50): Promise<Message[]> {
    try {
      return await this.messageRepository.find({
        where: { roomId },
        relations: ["sender"],
        order: { createdAt: "DESC" },
        take: limit,
      });
    } catch (error) {
      logError(`Error fetching chat history: ${error}`);
      return [];
    }
  }

  async saveMessage(
    roomId: string,
    senderId: string,
    content: string,
    messageType: "text" | "audio" | "image" = "text"
  ): Promise<Message | null> {
    try {
      const message = this.messageRepository.create({
        roomId,
        senderId,
        content,
        messageType,
        isRead: false,
      });

      const savedMessage = await this.messageRepository.save(message);
      logInfo(`Message saved in room ${roomId} by user ${senderId}`);
      return savedMessage;
    } catch (error) {
      logError(`Error saving message: ${error}`);
      return null;
    }
  }

  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    try {
      await this.messageRepository
        .createQueryBuilder()
        .update(Message)
        .set({ isRead: true })
        .where("room_id = :roomId", { roomId })
        .andWhere("sender_id != :userId", { userId })
        .execute();

      logInfo(`Marked messages as read for user ${userId} in room ${roomId}`);
    } catch (error) {
      logError(`Error marking messages as read: ${error}`);
    }
  }

  async getChatroomsForUser(userId: string): Promise<ChatroomWithMetadata[]> {
    try {
      const chatrooms = await this.chatroomRepository
        .createQueryBuilder("room")
        .leftJoin("room.members", "member")
        .where("member.user_id = :userId", { userId })
        .orderBy("room.created_at", "DESC")
        .getMany();

      const result: ChatroomWithMetadata[] = [];

      for (const room of chatrooms) {
        const unreadCount = await this.messageRepository.count({
          where: {
            roomId: room.id,
            isRead: false,
          },
        });

        let otherUser: string | undefined;
        let otherUserAvatar: string | undefined;

        if (!room.isGroup) {
          const otherMember = (await this.memberRepository
            .createQueryBuilder("member")
            .leftJoin("member.user", "user")
            .where("member.chatroom_id = :roomId", { roomId: room.id })
            .andWhere("member.user_id != :userId", { userId })
            .select(["user.name", "user.avatar"])
            .getOne()) as { user?: { name: string; avatar?: string } } | null;

          if (otherMember?.user) {
            otherUser = otherMember.user.name;
            otherUserAvatar = otherMember.user.avatar || "";
          }
        }

        const lastMessage = await this.messageRepository
          .createQueryBuilder("message")
          .leftJoin("message.sender", "sender")
          .where("message.roomId = :roomId", { roomId: room.id })
          .orderBy("message.createdAt", "DESC")
          .select(["message.content", "message.createdAt", "sender.name"])
          .getOne();

        const roomData: ChatroomWithMetadata = {
          id: room.id,
          name: room.name,
          isGroup: room.isGroup,
          unread: unreadCount,
          createdAt: room.createdAt,
          otherUser,
          otherUserAvatar,
          lastMessage: lastMessage
            ? {
                text: lastMessage.content,
                createdAt: lastMessage.createdAt,
                sender: lastMessage.sender?.name || "Unknown",
              }
            : undefined,
        };

        result.push(roomData);
      }

      return result;
    } catch (error) {
      logError(`Error fetching chatrooms for user: ${error}`);
      return [];
    }
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const chatrooms = await this.chatroomRepository
        .createQueryBuilder("room")
        .leftJoin("room.members", "member")
        .where("member.user_id = :userId", { userId })
        .getMany();

      let totalUnread = 0;

      for (const room of chatrooms) {
        const unreadCount = await this.messageRepository.count({
          where: {
            roomId: room.id,
            isRead: false,
          },
        });
        totalUnread += unreadCount;
      }

      return totalUnread;
    } catch (error) {
      logError(`Error calculating unread count: ${error}`);
      return 0;
    }
  }

  private generatePrivateRoomId(user1Id: string, user2Id: string): string {
    const minId = user1Id < user2Id ? user1Id : user2Id;
    const maxId = user1Id < user2Id ? user2Id : user1Id;
    const random = Math.random().toString(36).substring(2, 8);
    return `${minId}_${maxId}_${random}`;
  }

  async findRoom(roomId: string): Promise<Chatroom | null> {
    try {
      let room = await this.chatroomRepository.findOne({
        where: { roomId },
      });

      if (!room && this.isValidUUID(roomId)) {
        room = await this.chatroomRepository.findOne({
          where: { id: roomId },
        });
      }

      return room;
    } catch (error) {
      logError(`Error finding room: ${error}`);
      return null;
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  async ensureRoom(roomId: string): Promise<Chatroom | null> {
    try {
      let room = await this.findRoom(roomId);

      if (room) {
        return room;
      }

      room = this.chatroomRepository.create({
        roomId,
        name: `Room ${roomId}`,
        isGroup: true,
      });

      const savedRoom = await this.chatroomRepository.save(room);
      logInfo(`Created new room: ${roomId} with ID: ${savedRoom.id}`);
      return savedRoom;
    } catch (error) {
      logError(`Error ensuring room: ${error}`);
      return null;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { email, deleted: false, isActive: true },
      });
      return user;
    } catch (error) {
      logError(`Error finding user by email: ${error}`);
      return null;
    }
  }

  async getRoomMembers(roomId: string): Promise<User[]> {
    try {
      const members = await this.memberRepository
        .createQueryBuilder("member")
        .leftJoinAndSelect("member.user", "user")
        .where("member.chatroomId = :roomId", { roomId })
        .andWhere("user.deleted = false")
        .andWhere("user.isActive = true")
        .select(["user.id", "user.name", "user.email", "user.phone"])
        .getMany();

      return members.map((member) => member.user).filter(Boolean) as User[];
    } catch (error) {
      logError(`Error getting room members: ${error}`);
      return [];
    }
  }
}
