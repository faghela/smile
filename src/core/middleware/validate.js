// middleware/validate.js
const Joi = require('joi');

const productSchema = Joi.object({
    name: Joi.string().required().trim().messages({
        'string.empty': 'اسم المنتج مطلوب'
    }),
    description: Joi.string().required().messages({
        'string.empty': 'الوصف مطلوب'
    }),
    price: Joi.number().min(0).required().messages({
        'number.base': 'السعر يجب أن يكون رقماً',
        'number.min': 'السعر لا يمكن أن يكون سالباً'
    }),
    category: Joi.string().allow('', null).default('عام'),
    imageUrl: Joi.string().allow('', null),
    stock: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'المخزون يجب أن يكون رقماً',
        'number.min': 'المخزون لا يمكن أن يكون سالباً'
    })
});

const orderItemSchema = Joi.object({
    productId: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    quantity: Joi.number().integer().min(1).required(),
    imageUrl: Joi.string().allow('', null),
    stock: Joi.number().integer().min(0).allow(null) // يسمح به لكنه غير مطلوب (السعر يأتي من DB)
});

const orderSchema = Joi.object({
    items: Joi.array().items(orderItemSchema).min(1).required().messages({
        'array.min': 'يجب إضافة منتج واحد على الأقل للطلب'
    }),
    customerName: Joi.string().required().trim().messages({
        'string.empty': 'الاسم الكامل مطلوب'
    }),
    customerPhone: Joi.string().pattern(/^[\d\+\-\s]+$/).required().messages({
        'string.empty': 'رقم الهاتف مطلوب',
        'string.pattern.base': 'رقم الهاتف غير صالح'
    }),
    customerAddress: Joi.string().required().trim().messages({
        'string.empty': 'العنوان مطلوب'
    }),
    city: Joi.string().allow('', null), // المدينة المختارة للتوصيل
    notes: Joi.string().allow('', null)
});

const escapeHTML = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
};

const sanitizeObject = (obj) => {
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = escapeHTML(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
        }
    }
};

const validateProduct = (req, res, next) => {
    const { error, value } = productSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = error.details.map(d => d.message).join(', ');
        return res.status(400).json({ message: messages });
    }
    sanitizeObject(value);
    req.body = value; // Replace with validated/defaulted values
    next();
};

const validateOrder = (req, res, next) => {
    const { error, value } = orderSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = error.details.map(d => d.message).join(', ');
        return res.status(400).json({ message: messages });
    }
    sanitizeObject(value);
    req.body = value;
    next();
};

module.exports = { validateProduct, validateOrder, escapeHTML, sanitizeObject };
