import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as admin from '../controllers/admin.controller';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/dashboard', admin.getDashboardStats);
router.get('/analytics/orders-chart', admin.getOrdersChart);
router.get('/users', admin.listUsers);
router.patch('/users/:id/suspend', admin.suspendUser);
router.patch('/users/:id/activate', admin.activateUser);
router.patch('/users/:id', admin.updateUser);
router.get('/riders', admin.listRiders);
router.patch('/riders/:id/approve', admin.approveRider);
router.patch('/riders/:id/reject', admin.rejectRider);
router.patch('/riders/:id', admin.updateRider);
router.get('/orders', admin.listOrders);
router.get('/reports', admin.listReports);
router.get('/withdrawals', admin.listWithdrawals);
router.patch('/withdrawals/:id/process', admin.processWithdrawal);
router.get('/pricing', admin.getPricing);
router.patch('/pricing', admin.updatePricing);

export default router;
