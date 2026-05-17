const express = require('express');
const router = express.Router();
const shippingController = require('./shipping.controller');
const adminAuth = require('../../core/middleware/auth');

router.get('/', shippingController.getShippingZones);
router.post('/', adminAuth, shippingController.createShippingZone);
router.put('/:id', adminAuth, shippingController.updateShippingZone);
router.delete('/:id', adminAuth, shippingController.deleteShippingZone);

module.exports = router;
