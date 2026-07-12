const express = require('express');
const { body } = require('express-validator');
const { getQuotations, getQuotation, createQuotation, updateQuotation, updateStatus, convertToInvoice, deleteQuotation } = require('../controllers/quotationController');
const { auth, requireSection } = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.use(requireSection('quotations'));

router.get('/', getQuotations);
router.get('/:id', getQuotation);

router.post('/', [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.name').notEmpty().withMessage('Product name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Price must be positive')
], createQuotation);

router.put('/:id', updateQuotation);
router.patch('/:id/status', [
  body('status').isIn(['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted']).withMessage('Invalid status')
], updateStatus);
router.post('/:id/convert', convertToInvoice);
router.delete('/:id', deleteQuotation);

module.exports = router;
