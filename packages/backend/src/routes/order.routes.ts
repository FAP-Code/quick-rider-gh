import { Router } from 'express';
import { authenticate, requireRider, requireCustomer } from '../middleware/auth';
import * as order from '../controllers/order.controller';

const router = Router();

router.use(authenticate);

router.get('/estimate', order.estimateOrder);
router.post('/', requireCustomer, order.createOrder);
router.get('/', order.getOrders);
router.get('/:id', order.getOrder);
router.patch('/:id/accept', requireRider, order.acceptOrder);
router.patch('/:id/status', order.updateOrderStatus);

export default router;
