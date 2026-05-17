// models/Product.js
const mongoose = require('mongoose');

const productSpecSchema = new mongoose.Schema({
    label: {
        type: String,
        trim: true
    },
    value: {
        type: String,
        trim: true
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        default: 'عام',
        trim: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    images: {
        type: [String],
        default: []
    },
    specs: {
        type: [productSpecSchema],
        default: []
    },
    ratingAverage: {
        type: Number,
        default: 0
    },
    ratingCount: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        default: 0
    },
    soldCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Indexes
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ soldCount: -1 });

module.exports = mongoose.model('Product', productSchema);
