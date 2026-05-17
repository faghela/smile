const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const adminAuth = require('../../core/middleware/auth');
const { validateProduct } = require('../../core/middleware/validate');

router.get('/categories', productController.getCategories);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

router.post('/', adminAuth, validateProduct, productController.createProduct);
router.put('/:id', adminAuth, validateProduct, productController.updateProduct);
router.delete('/:id', adminAuth, productController.deleteProduct);

module.exports = router;
