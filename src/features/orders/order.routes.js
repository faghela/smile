const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const adminAuth = require('../../core/middleware/auth');
const { validateOrder } = require('../../core/middleware/validate');
const rateLimit = require('express-rate-limit');

const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { message: 'لقد أرسلت طلبات كثيرة، يرجى الانتظار قبل إرسال طلب جديد.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/', orderLimiter, validateOrder, orderController.createOrder);
router.get('/track', orderController.trackOrders);

router.get('/check-new', adminAuth, orderController.checkNewOrders);
router.get('/export', adminAuth, orderController.exportOrders);
router.get('/', adminAuth, orderController.getOrders);
router.put('/:id/status', adminAuth, orderController.updateOrderStatus);
router.delete('/:id', adminAuth, orderController.deleteOrder);

module.exports = router;
