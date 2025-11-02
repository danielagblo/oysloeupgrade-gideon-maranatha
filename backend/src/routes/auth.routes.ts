import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import type { AuthService } from '../services/auth.service.js';
import {
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
  passwordResetSchema,
  registerSchema,
} from '../validators/auth.validator.js';

export function createAuthRoutes(authService: AuthService) {
  const router = Router();
  const authController = new AuthController(authService);

  router.post('/register', validate(registerSchema), authController.register.bind(authController));

  router.post('/login', validate(loginSchema), authController.login.bind(authController));

  router.post('/otp/send', validate(otpSendSchema), authController.sendOTP.bind(authController));

  router.post(
    '/otp/verify',
    validate(otpVerifySchema),
    authController.verifyOTP.bind(authController)
  );

  router.post(
    '/password/reset',
    authenticate,
    validate(passwordResetSchema),
    authController.resetPassword.bind(authController)
  );

  router.post('/logout', authenticate, authController.logout.bind(authController));

  router.get('/session', authenticate, authController.getSession.bind(authController));

  return router;
}
