// models/ShippingZone.js
const mongoose = require('mongoose');

const shippingZoneSchema = new mongoose.Schema({
    city:  { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ShippingZone', shippingZoneSchema);
