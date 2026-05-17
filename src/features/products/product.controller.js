const path = require('path');
const fs = require('fs');
const Joi = require('joi');
const Product = require('./product.model');

// Helper: حذف ملف الصورة المرفوعة محلياً إن وُجد
function deleteLocalImage(imageUrl) {
    if (!imageUrl || imageUrl.startsWith('http')) return; // رابط خارجي، تجاهل
    // Note: __dirname is src/features/products. Go up to smile-shop/public
    const filePath = path.join(__dirname, '../../../public', imageUrl);
    fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
            console.error('[WARN] Failed to delete image file:', filePath, err.message);
        }
    });
}

const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(['الكل', ...categories.filter(Boolean).sort()]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 12, minPrice, maxPrice, sort } = req.query;
        const safeCategory = typeof category === 'string' ? category.trim() : '';
        const safeSearch = typeof search === 'string' ? search.trim() : '';
        if (safeCategory && /[$.]/.test(safeCategory)) {
            return res.status(400).json({ message: 'الفئة تحتوي على أحرف غير مسموحة' });
        }
        if (safeSearch && /[$.]/.test(safeSearch)) {
            return res.status(400).json({ message: 'نص البحث يحتوي على أحرف غير مسموحة' });
        }

        let baseQuery = Product.find();
        if (safeCategory && safeCategory !== 'الكل') {
            baseQuery = baseQuery.where('category').equals(safeCategory);
        }
        if (safeSearch) {
            baseQuery = baseQuery.where({ $text: { $search: safeSearch } });
        }

        const { value: priceValues, error: priceError } = Joi.object({
            minPrice: Joi.number().min(0).optional(),
            maxPrice: Joi.number().min(0).optional()
        }).validate({ minPrice, maxPrice }, { convert: true, abortEarly: true });
        if (priceError) {
            return res.status(400).json({ message: 'قيم السعر غير صالحة' });
        }
        const min = priceValues.minPrice;
        const max = priceValues.maxPrice;
        if (min !== undefined && max !== undefined && min > max) {
            return res.status(400).json({ message: 'الحد الأدنى للسعر يجب أن يكون أقل من الحد الأعلى' });
        }
        if (min !== undefined || max !== undefined) {
            if (min !== undefined) baseQuery = baseQuery.where('price').gte(min);
            if (max !== undefined) baseQuery = baseQuery.where('price').lte(max);
        }

        const pageNum  = parseInt(page) || 1;
        const limitNum = Math.min(parseInt(limit) || 12, 100);
        const skip     = (pageNum - 1) * limitNum;

        let sortBy = { createdAt: -1 };
        if (sort === 'newest') sortBy = { createdAt: -1 };
        if (sort === 'price_asc') sortBy = { price: 1, createdAt: -1 };
        if (sort === 'price_desc') sortBy = { price: -1, createdAt: -1 };
        if (sort === 'top') sortBy = { soldCount: -1, createdAt: -1 };

        const [products, totalItems] = await Promise.all([
            baseQuery.clone().sort(sortBy).skip(skip).limit(limitNum),
            baseQuery.clone().countDocuments()
        ]);

        res.json({
            data: products,
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

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const old = await Product.findById(req.params.id);
        if (!old) return res.status(404).json({ message: 'المنتج غير موجود' });

        if (old.imageUrl && old.imageUrl !== req.body.imageUrl) {
            deleteLocalImage(old.imageUrl);
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id, req.body, { new: true, runValidators: true }
        );
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });

        deleteLocalImage(product.imageUrl);

        res.json({ success: true, message: 'تم حذف المنتج وملف صورته بنجاح' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getCategories,
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
