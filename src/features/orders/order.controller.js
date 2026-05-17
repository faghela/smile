const Order = require('./order.model');
const Product = require('../products/product.model');
const ShippingZone = require('../shipping/shippingZone.model');

const createOrder = async (req, res) => {
    const { items, customerName, customerPhone, customerAddress, city, notes } = req.body;
    let totalPrice = 0;
    let shippingPrice = 0;
    const itemsToUpdate = [];

    if (city && city.trim()) {
        const zone = await ShippingZone.findOne({ city: city.trim() });
        if (zone) shippingPrice = zone.price;
    }

    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product)
            return res.status(404).json({ message: `المنتج "${item.name}" غير موجود` });
        if (product.stock < item.quantity)
            return res.status(400).json({
                message: `الكمية المطلوبة من "${product.name}" غير كافية. المتوفر: ${product.stock}`
            });
        
        totalPrice += product.price * item.quantity;
        itemsToUpdate.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            imageUrl: product.imageUrl
        });
    }

    const deductedProducts = [];
    try {
        for (const item of itemsToUpdate) {
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: item.productId, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity, soldCount: item.quantity } },
                { new: true }
            );

            if (!updatedProduct) {
                throw new Error(`لم نتمكن من حجز الكمية للمنتج "${item.name}" لتغير المخزون بشكل مفاجئ.`);
            }
            deductedProducts.push(item);
        }

        const order = new Order({ 
            items: itemsToUpdate, 
            customerName, customerPhone, customerAddress, city: city || '', 
            shippingPrice,
            notes, 
            totalPrice: totalPrice + shippingPrice
        });
        await order.save();
        
        res.status(201).json({ success: true, order, message: 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.' });

    } catch (err) {
        for (const item of deductedProducts) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity, soldCount: -item.quantity } }).catch(e => {
                console.error(`[CRITICAL] Failed to rollback stock for product ${item.productId}:`, e);
            });
        }
        res.status(500).json({ message: err.message });
    }
};

const checkNewOrders = async (req, res) => {
    try {
        const { lastCheck } = req.query;
        if (!lastCheck) return res.json({ newOrders: 0 });
        const date = new Date(parseInt(lastCheck));
        const newOrders = await Order.countDocuments({ createdAt: { $gt: date } });
        res.json({ newOrders });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const exportOrders = async (req, res) => {
    try {
        const { status, from, to } = req.query;
        const query = {};

        if (status && status !== 'all') query.status = status;
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to)   query.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
        }

        const BATCH = 500;
        let skip = 0;
        let csvRows = '\uFEFFرقم الطلب,العميل,رقم الهاتف,العنوان,إجمالي السعر,الحالة,تاريخ الطلب,المنتجات\n';

        while (true) {
            const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(BATCH).lean();
            if (!orders.length) break;

            orders.forEach(o => {
                const date = new Date(o.createdAt).toLocaleDateString('ar-IQ');
                const name    = `"${(o.customerName    || '').replace(/"/g, '""')}"`;
                const phone   = `"${(o.customerPhone   || '').replace(/"/g, '""')}"`;
                const address = `"${(o.customerAddress || '').replace(/"/g, '""')}"`;
                const items   = `"${o.items.map(i => `${i.name} (${i.quantity})`).join(' - ')}"`;
                csvRows += `"${o._id}",${name},${phone},${address},${o.totalPrice},${o.status},${date},${items}\n`;
            });

            skip += BATCH;
            if (orders.length < BATCH) break;
        }

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.attachment(`orders_${new Date().toISOString().slice(0,10)}.csv`);
        return res.send(csvRows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const trackOrders = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone || phone.trim().length < 7) {
            return res.status(400).json({ message: 'يرجى إدخال رقم هاتف صالح' });
        }
        const orders = await Order.find({ customerPhone: phone.trim() })
            .sort({ createdAt: -1 })
            .select('-__v')
            .lean();
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 15, status } = req.query;
        const query = {};
        if (status && status !== 'all') query.status = status;

        const pageNum = parseInt(page) || 1;
        const limitNum = Math.min(parseInt(limit) || 15, 100);
        const skip = (pageNum - 1) * limitNum;

        const [orders, totalItems] = await Promise.all([
            Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            Order.countDocuments(query)
        ]);

        res.json({
            data: orders,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalItems / limitNum),
                totalItems,
                limit: limitNum
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateOrderStatus = async (req, res) => {
    const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            message: `حالة غير صالحة. القيم المسموحة: ${VALID_STATUSES.join(', ')}`
        });
    }

    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id, { status }, { new: true }
        );
        if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });
        res.json({ success: true, order });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });

        if (order.status === 'pending' || order.status === 'processing') {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } }).catch(e => {
                    console.error(`[WARN] Failed to refund stock for product ${item.productId}:`, e);
                });
            }
        }

        res.json({ success: true, message: 'تم حذف الطلب وإرجاع المخزون (إن لزم الأمر)' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createOrder,
    checkNewOrders,
    exportOrders,
    trackOrders,
    getOrders,
    updateOrderStatus,
    deleteOrder
};
