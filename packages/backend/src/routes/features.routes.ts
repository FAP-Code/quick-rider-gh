/**
 * features.routes.ts
 *
 * Mount this router at /api/v1 in index.ts:
 *   import featuresRoutes from './routes/features.routes';
 *   app.use('/api/v1', featuresRoutes);
 *
 * All paths below are relative to that mount point.
 * Static /orders sub-routes are declared BEFORE parameterised ones to prevent
 * Express from capturing static segments (e.g. "eta-estimate") as order IDs.
 */

import { Router } from 'express';
import { authenticate, requireRider, requireCustomer, requireAdmin } from '../middleware/auth';
import {
  generateDeliveryPin,
  verifyDeliveryPin,
  createTrackingLink,
  getPublicTracking,
  getRiderGameStats,
  addFuelExpense,
  getFuelExpenses,
  getSchedule,
  saveSchedule,
  optInToPool,
  getPoolStatus,
  getSubscription,
  purchaseSubscription,
  applyMerchant,
  getMerchantProfile,
  getMerchantOrders,
  getMerchantStats,
  whatsappWebhook,
  whatsappVerify,
  ussdHandler,
  triggerSos,
  acknowledgeSos,
  getActiveSos,
  getEtaEstimate,
  getCarbonPreview,
  resolveGhanaPostCode,
  createMultiStopOrder,
  getDemandHeatmap,
  getFraudFlags,
  reviewFraudFlag,
} from '../controllers/features.controller';

const router = Router();

// ─── ETA / CARBON / MULTI-STOP — static /orders routes FIRST ─────────────────
// Must precede /orders/:id/* so Express does not match these as order IDs.
router.get('/orders/eta-estimate',   authenticate, requireCustomer, getEtaEstimate);
router.get('/orders/carbon-preview', authenticate, requireCustomer, getCarbonPreview);
router.post('/orders/multi-stop',    authenticate, requireCustomer, createMultiStopOrder);

// ─── ORDER: PIN DELIVERY ─────────────────────────────────────────────────────
router.post('/orders/:id/pin',        authenticate, requireCustomer, generateDeliveryPin);
router.post('/orders/:id/verify-pin', authenticate, requireRider,   verifyDeliveryPin);

// ─── ORDER: SHAREABLE TRACKING LINK ──────────────────────────────────────────
router.post('/orders/:id/tracking-link', authenticate, requireCustomer, createTrackingLink);
router.get('/track/:token', getPublicTracking);                          // public — no auth

// ─── ORDER: COMMUNITY POOLING ─────────────────────────────────────────────────
router.post('/orders/:id/pool-opt-in', authenticate, requireCustomer, optInToPool);
router.get('/orders/:id/pool',         authenticate, requireCustomer, getPoolStatus);

// ─── RIDER ────────────────────────────────────────────────────────────────────
router.get('/rider/game-stats',   authenticate, requireRider, getRiderGameStats);
router.post('/rider/fuel',        authenticate, requireRider, addFuelExpense);
router.get('/rider/fuel',         authenticate, requireRider, getFuelExpenses);
router.get('/rider/schedule',     authenticate, requireRider, getSchedule);
router.post('/rider/schedule',    authenticate, requireRider, saveSchedule);
router.post('/rider/sos-escalate', authenticate, requireRider, triggerSos);

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────
router.get('/customer/subscription',  authenticate, requireCustomer, getSubscription);
router.post('/customer/subscription', authenticate, requireCustomer, purchaseSubscription);

// ─── MERCHANT PORTAL ─────────────────────────────────────────────────────────
router.post('/merchant/apply',  authenticate, requireCustomer, applyMerchant);
router.get('/merchant/profile', authenticate, requireCustomer, getMerchantProfile);
router.get('/merchant/orders',  authenticate, requireCustomer, getMerchantOrders);
router.get('/merchant/stats',   authenticate, requireCustomer, getMerchantStats);

// ─── WHATSAPP (no auth — Twilio calls these directly) ─────────────────────────
router.post('/whatsapp/webhook', whatsappWebhook);
router.get('/whatsapp/webhook',  whatsappVerify);

// ─── USSD (no auth — Africa's Talking calls this directly) ───────────────────
router.post('/ussd', ussdHandler);

// ─── LOCATION UTILITIES ───────────────────────────────────────────────────────
router.get('/location/ghanapost', resolveGhanaPostCode); // public — no auth

// ─── ADMIN: SOS ──────────────────────────────────────────────────────────────
router.post('/admin/sos/:id/acknowledge', authenticate, requireAdmin, acknowledgeSos);
router.get('/admin/sos',                  authenticate, requireAdmin, getActiveSos);

// ─── ADMIN: HEATMAP ──────────────────────────────────────────────────────────
router.get('/admin/heatmap', authenticate, requireAdmin, getDemandHeatmap);

// ─── ADMIN: FRAUD ────────────────────────────────────────────────────────────
router.get('/admin/fraud',              authenticate, requireAdmin, getFraudFlags);
router.post('/admin/fraud/:id/review',  authenticate, requireAdmin, reviewFraudFlag);

export default router;
