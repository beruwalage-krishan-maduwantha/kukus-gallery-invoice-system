const express = require('express');
const { body } = require('express-validator');
const { getInvoices, getInvoice, createInvoice, updateInvoice, updateStatus, addAdvancePayment, deleteInvoice } = require('../controllers/invoiceController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/next-order-number/:type', async (req, res) => {
  try {
    const Counter = require('../models/Counter');
    const type = req.params.type;
    const prefix = type === 'sm' ? 'SM' : 'BLK';
    const counter = await Counter.findOne({ _id: `order_${type}` });
    const next = (counter?.seq || 0) + 1;
    res.json({ orderNumber: `${prefix}${String(next).padStart(3, '0')}` });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/', getInvoices);
router.get('/:id', getInvoice);

router.post('/', [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.name').notEmpty().withMessage('Product name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Price must be positive')
], createInvoice);

router.put('/:id', updateInvoice);
router.patch('/:id/status', [
  body('status').isIn(['Draft', 'Sent', 'Advance Paid', 'Paid', 'Overdue', 'Cancelled']).withMessage('Invalid status')
], updateStatus);

router.post('/:id/advance', addAdvancePayment);
router.delete('/:id', deleteInvoice);

module.exports = router;
