const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');

const JWT_SECRET      = process.env.JWT_SECRET;
const ADMIN_USERNAME  = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD;

const login = async (req, res) => {
    const { username, password } = req.body;
    
    let isMatch = false;
    if (username === ADMIN_USERNAME) {
        if (ADMIN_PASSWORD.startsWith('$2')) {
            isMatch = await bcrypt.compare(password, ADMIN_PASSWORD);
        } else {
            isMatch = (password === ADMIN_PASSWORD);
            if (isMatch) console.warn('[WARN] You are using a plain text admin password. Please consider hashing it for better security.');
        }
    }

    if (isMatch) {
        const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, message: 'تم تسجيل الدخول بنجاح' });
    } else {
        res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
};

const getStats = async (req, res) => {
    try {
        const [totalProducts, orderStats, dailyStats] = await Promise.all([
            Product.countDocuments(),
            Order.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        revenue: { 
                            $sum: { 
                                $cond: [{ $ne: ['$status', 'cancelled'] }, '$totalPrice', 0] 
                            } 
                        }
                    }
                }
            ]),
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 6)) },
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' }
                        },
                        revenue: { $sum: '$totalPrice' }
                    }
                }
            ])
        ]);

        let totalOrders = 0;
        let totalRevenue = 0;
        let pendingOrders = 0;

        orderStats.forEach(stat => {
            totalOrders += stat.count;
            totalRevenue += stat.revenue;
            if (stat._id === 'pending') pendingOrders = stat.count;
        });

        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' });
            
            const year = d.getUTCFullYear();
            const month = d.getUTCMonth() + 1;
            const day = d.getUTCDate();
            
            const dayData = dailyStats.find(s => s._id.year === year && s._id.month === month && s._id.day === day);
            last7Days.push({ label, revenue: dayData ? dayData.revenue : 0 });
        }

        res.json({ totalProducts, totalOrders, totalRevenue, pendingOrders, last7Days });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getTopProducts = async (req, res) => {
    try {
        const results = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.name' },
                    imageUrl: { $first: '$items.imageUrl' },
                    totalQty: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalQty: -1 } },
            { $limit: 5 }
        ]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMonthlyStats = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const results = await Order.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    revenue: { $sum: '$totalPrice' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
        const formatted = results.map(r => ({
            label: `${months[r._id.month - 1]} ${r._id.year}`,
            revenue: r.revenue,
            count: r.count
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    login,
    getStats,
    getTopProducts,
    getMonthlyStats
};
