const express = require('express');
const { body } = require('express-validator');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', getProducts);
router.get('/:id', getProduct);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('defaultPrice').isNumeric().withMessage('Price must be a number')
], createProduct);

router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
