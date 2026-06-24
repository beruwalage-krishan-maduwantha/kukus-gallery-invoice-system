const express = require('express');
const { getReport } = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.get('/', getReport);

module.exports = router;
