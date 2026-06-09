import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import * as auth from '../controllers/auth.controller';

const router = Router();

router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('email').optional().isEmail().normalizeEmail({ gmail_remove_dots: false }),
    body('phone').optional().isMobilePhone('any'),
  ],
  validate,
  auth.register
);

router.post(
  '/login',
  [
    body('password').notEmpty().withMessage('Password is required'),
    body('email').optional().isEmail().normalizeEmail({ gmail_remove_dots: false }),
    body('phone').optional().isMobilePhone('any'),
  ],
  validate,
  auth.login
);

router.post('/refresh', auth.refreshToken);
router.post('/logout', auth.logout);
router.post('/send-otp', auth.sendOtp);
router.post('/verify-otp', auth.verifyOtp);
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], validate, auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);

export default router;
