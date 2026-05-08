import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimit, ...authController.register);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', authRateLimit, ...authController.login);
router.post('/refresh', ...authController.refresh);
router.post('/logout', ...authController.logout);
router.post('/forgot-password', authRateLimit, ...authController.forgotPassword);
router.post('/reset-password', ...authController.resetPassword);
router.get('/me', requireAuth, authController.me);

export default router;
