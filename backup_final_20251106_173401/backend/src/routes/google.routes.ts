import { Router } from 'express';
import passport from 'passport';
import { handleGoogleCallback, handleGoogleFailure } from '../controllers/google.controller.js';

const router = Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api-v1/auth/google/failure',
  }),
  handleGoogleCallback
);

router.get('/google/failure', handleGoogleFailure);

export default router;
