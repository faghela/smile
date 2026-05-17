const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const adminAuth = require('../../core/middleware/auth');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'محاولات تسجيل دخول كثيرة جداً، يرجى الانتظار 15 دقيقة.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', loginLimiter, adminController.login);
router.get('/stats', adminAuth, adminController.getStats);
router.get('/stats/top-products', adminAuth, adminController.getTopProducts);
router.get('/stats/monthly', adminAuth, adminController.getMonthlyStats);

module.exports = router;
