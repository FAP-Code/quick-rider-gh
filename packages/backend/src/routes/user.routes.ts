import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import * as user from '../controllers/user.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

router.get('/me', user.getProfile);
router.patch('/me', user.updateProfile);
router.post('/me/photo', upload.single('photo'), user.uploadProfilePhoto);
router.get('/me/addresses', user.getSavedAddresses);
router.post('/me/addresses', user.addSavedAddress);
router.delete('/me/addresses/:id', user.deleteSavedAddress);
router.get('/me/notifications', user.getNotifications);
router.patch('/me/notifications/read', user.markNotificationsRead);
router.post('/me/ratings', user.submitRating);

export default router;
