const express = require('express');
const { body } = require('express-validator');
const { getCreditNotes, getCustomerCredits, createCreditNote, updateCreditNote, deleteCreditNote } = require('../controllers/creditNoteController');
const { auth, requireSection } = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.use(requireSection('creditNotes'));

router.get('/', getCreditNotes);
router.get('/by-customer', getCustomerCredits);

router.post('/', [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('reason').trim().notEmpty().withMessage('Reason is required')
], createCreditNote);

router.put('/:id', updateCreditNote);
router.delete('/:id', deleteCreditNote);

module.exports = router;
