const express = require('express');
const { getOrders, updateOrderStatus, approveOrder } = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', getOrders);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/approve', approveOrder);

module.exports = router;
