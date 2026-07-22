import { Router } from 'express';
import { authenticate, requireAdmin, requireRider, requireCustomer } from '../middleware/auth';
import * as f from '../controllers/features.controller';

const router = Router();

// ─── PUBLIC (no auth) ─────────────────────────────────────────────────────────
router.get('/track/:token',         f.getPublicTracking);
router.post('/webhook/whatsapp',    f.whatsappWebhook);
router.get('/webhook/whatsapp',     f.whatsappVerify);
router.post('/ussd',                f.ussdHandler);

// ─── ETA & CARBON PREVIEW (public) ───────────────────────────────────────────
router.get('/eta/estimate',         f.getEtaEstimate);
router.get('/carbon/preview',       f.getCarbonPreview);
router.get('/ghanapost/:code',      f.resolveGhanaPostCode);

// ─── CUSTOMER ROUTES ──────────────────────────────────────────────────────────
router.use(authenticate);

router.post('/orders/:id/pin',            requireCustomer, f.generateDeliveryPin);
router.post('/orders/:id/tracking-link',  requireCustomer, f.createTrackingLink);
router.post('/orders/multi-stop',         requireCustomer, f.createMultiStopOrder);
router.post('/orders/:id/pool',           requireCustomer, f.optInToPool);
router.get('/orders/:id/pool',            requireCustomer, f.getPoolStatus);
router.get('/subscription',               requireCustomer, f.getSubscription);
router.post('/subscription',              requireCustomer, f.purchaseSubscription);

// ─── RIDER ROUTES ─────────────────────────────────────────────────────────────
router.post('/orders/:id/pin/verify',     requireRider, f.verifyDeliveryPin);
router.get('/rider/game-stats',           requireRider, f.getRiderGameStats);
router.post('/rider/fuel',                requireRider, f.addFuelExpense);
router.get('/rider/fuel',                 requireRider, f.getFuelExpenses);
router.get('/rider/schedule',             requireRider, f.getSchedule);
router.post('/rider/schedule',            requireRider, f.saveSchedule);
router.post('/rider/sos',                 requireRider, f.triggerSos);

// ─── MERCHANT ROUTES ──────────────────────────────────────────────────────────
router.post('/merchant/apply',            authenticate, f.applyMerchant);
router.get('/merchant/profile',           authenticate, f.getMerchantProfile);
router.get('/merchant/orders',            authenticate, f.getMerchantOrders);
router.get('/merchant/stats',             authenticate, f.getMerchantStats);

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
router.get('/admin/fraud',                requireAdmin, f.getFraudFlags);
router.patch('/admin/fraud/:id',          requireAdmin, f.reviewFraudFlag);
router.get('/admin/sos',                  requireAdmin, f.getActiveSos);
router.patch('/admin/sos/:id/ack',        requireAdmin, f.acknowledgeSos);
router.get('/admin/heatmap',              requireAdmin, f.getDemandHeatmap);

export default router;
