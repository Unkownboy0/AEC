import { Router } from 'express';
import { AuthController } from './auth.controller';
import { UsersController } from '../users/users.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new AuthController();
const usersController = new UsersController();

router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.post('/refresh', controller.refresh);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

// Protected routes
router.get('/me', requireAuth, controller.getMe);
router.post('/change-password', requireAuth, controller.changePassword);
router.post('/logout-all', requireAuth, controller.logoutAll);

// Self-service profile update — available to ALL authenticated roles
// Frontend calls PUT /auth/profile, which proxies to the users updateProfile service
router.put('/profile', requireAuth, usersController.updateProfile);
router.patch('/profile', requireAuth, usersController.updateProfile);

export default router;
