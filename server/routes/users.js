const express = require('express');
const { getUsers, createUser, updateUser, resetPassword } = require('../controllers/userController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.use(adminOnly);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/reset-password', resetPassword);

module.exports = router;
