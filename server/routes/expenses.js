const express = require('express');
const { getExpenses, getExpense, createExpense, updateExpense, deleteExpense, getAttachment } = require('../controllers/expenseController');
const { auth, requireSection } = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.use(requireSection('expenses'));

router.get('/', getExpenses);
router.get('/:id/attachment', getAttachment);
router.get('/:id', getExpense);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
