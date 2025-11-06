import { Router } from 'express';
import { z } from 'zod';
import { ChatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = Router();
const chatController = new ChatController();

const getChatroomIdSchema = z.object({
  query: z.object({
    email: z.string().email(),
  }),
});

router.get(
  '/room-id',
  authenticate,
  validateRequest(getChatroomIdSchema),
  chatController.getChatroomId.bind(chatController)
);

export default router;
