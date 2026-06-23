const express = require('express');
const { body } = require('express-validator');
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', getCustomers);
router.get('/:id', getCustomer);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required')
], createCustomer);

router.put('/:id', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required')
], updateCustomer);

router.delete('/:id', deleteCustomer);

module.exports = router;
