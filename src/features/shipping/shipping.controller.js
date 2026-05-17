const ShippingZone = require('./shippingZone.model');
const { escapeHTML } = require('../../core/middleware/validate');

const getShippingZones = async (req, res) => {
    try {
        const zones = await ShippingZone.find().sort({ city: 1 });
        res.json(zones);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createShippingZone = async (req, res) => {
    try {
        const { city, price } = req.body;
        if (!city || city.trim().length < 2) return res.status(400).json({ message: 'اسم المدينة مطلوب' });
        if (price === undefined || price < 0)  return res.status(400).json({ message: 'سعر التوصيل مطلوب' });
        const safeCity = escapeHTML(city.trim());
        const zone = await ShippingZone.create({ city: safeCity, price: Number(price) });
        res.status(201).json(zone);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'هذه المدينة موجودة بالفعل' });
        res.status(400).json({ message: err.message });
    }
};

const updateShippingZone = async (req, res) => {
    try {
        const { city, price } = req.body;
        const safeCity = city ? escapeHTML(city.trim()) : undefined;
        const zone = await ShippingZone.findByIdAndUpdate(
            req.params.id,
            { city: safeCity, price: Number(price) },
            { new: true, runValidators: true }
        );
        if (!zone) return res.status(404).json({ message: 'المنطقة غير موجودة' });
        res.json(zone);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'هذه المدينة موجودة بالفعل' });
        res.status(400).json({ message: err.message });
    }
};

const deleteShippingZone = async (req, res) => {
    try {
        const zone = await ShippingZone.findByIdAndDelete(req.params.id);
        if (!zone) return res.status(404).json({ message: 'المنطقة غير موجودة' });
        res.json({ message: `تم حذف "${zone.city}" بنجاح` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getShippingZones,
    createShippingZone,
    updateShippingZone,
    deleteShippingZone
};
