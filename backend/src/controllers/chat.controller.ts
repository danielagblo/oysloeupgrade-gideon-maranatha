import type { Request, Response } from 'express';
import { ChatService } from '../services/chat.service.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { logError } from '../utils/logger.js';

export class ChatController {
  private chatService = new ChatService();

  async getChatroomId(req: Request, res: Response) {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        throw new BadRequestError('Email parameter is required');
      }

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      if (email === req.user.email) {
        throw new BadRequestError('Cannot create chatroom with yourself');
      }

      const otherUser = await this.chatService.findUserByEmail(email);
      if (!otherUser) {
        throw new NotFoundError('User not found');
      }

      const chatroom = await this.chatService.getOrCreatePrivateChatroom(req.user.id, otherUser.id);

      if (!chatroom) {
        throw new BadRequestError('Failed to create chatroom');
      }

      res.json({
        success: true,
        data: { chatroomId: chatroom.roomId },
      });
    } catch (error) {
      logError('Error getting chatroom ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get chatroom ID',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
