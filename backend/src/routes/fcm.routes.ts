import { Router } from 'express';
import { FCMController } from '../controllers/fcm.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const fcmController = new FCMController();

router.use(authenticate);

router.post('/register', (req, res) => fcmController.registerDevice(req, res));

router.delete('/device/:token', (req, res) => fcmController.removeDevice(req, res));

router.get('/devices', (req, res) => fcmController.getUserDevices(req, res));

router.post('/test', (req, res) => fcmController.testNotification(req, res));

export default router;
