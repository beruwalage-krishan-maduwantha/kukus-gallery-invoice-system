const express = require('express');
const { body } = require('express-validator');
const { login, getMe, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], login);

router.get('/me', auth, getMe);

router.put('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], changePassword);

module.exports = router;
