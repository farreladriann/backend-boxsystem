import express from 'express';
import { AuthController } from '../controllers/authController';
import { protectAll } from '../middlewares/protect';

const router = express.Router();

// POST /ogout
// This route handles user logout (currently commented out)
router.post('/login', AuthController.loginWithEmail);

router.get('/profile', protectAll, AuthController.getUserData);

router.get('/logout', protectAll, AuthController.logout);

router.patch('/role', protectAll, AuthController.changeRole);

export default router;
