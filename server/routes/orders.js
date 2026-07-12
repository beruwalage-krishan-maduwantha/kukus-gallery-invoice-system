const express = require('express');
const { getOrders, updateOrderStatus, approveOrder, deleteOrder, updateJobSheet, getJobSheetImage } = require('../controllers/orderController');
const { auth, requireSection } = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.use(requireSection('orders'));

router.get('/', getOrders);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/approve', approveOrder);
router.put('/:id/jobsheet', updateJobSheet);
router.get('/:id/jobsheet-image/:kind', getJobSheetImage);
router.delete('/:id', deleteOrder);

module.exports = router;
