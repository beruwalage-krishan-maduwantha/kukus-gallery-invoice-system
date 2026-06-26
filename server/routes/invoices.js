const express = require('express');
const { body } = require('express-validator');
const { getInvoices, getInvoice, createInvoice, updateInvoice, updateStatus, addAdvancePayment, deleteInvoice } = require('../controllers/invoiceController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

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
