// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    quantity:  { type: Number, required: true, min: 1 },
    imageUrl:  { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    items:           { type: [orderItemSchema], required: true },
    customerName:    { type: String, required: true, trim: true },
    customerPhone:   { type: String, required: true, trim: true },
    customerAddress: { type: String, required: true, trim: true },
    city:            { type: String, default: '' },
    shippingPrice:   { type: Number, default: 0 },
    notes:           { type: String, default: '' },
    totalPrice:      { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

// Indexes
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
