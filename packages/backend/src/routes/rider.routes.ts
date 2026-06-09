import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRider } from '../middleware/auth';
import * as rider from '../controllers/rider.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

// Public — available to customers
router.get('/nearby', rider.getNearbyRiders);

// Rider-only
router.get('/me', requireRider, rider.getMyProfile);
router.patch('/me/availability', requireRider, rider.setAvailability);
router.patch('/me/location', requireRider, rider.updateLocation);
router.patch('/me/motorcycle', requireRider, rider.updateMotorcycleDetails);
router.get('/me/earnings', requireRider, rider.getEarnings);
router.post('/me/withdraw', requireRider, rider.requestWithdrawal);
router.post(
  '/me/documents',
  requireRider,
  upload.fields([
    { name: 'ghanaCard', maxCount: 1 },
    { name: 'driversLicense', maxCount: 1 },
    { name: 'motorcyclePhoto', maxCount: 1 },
    { name: 'motorcycleReg', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  rider.uploadDocuments
);

export default router;
