const express = require('express');
const { getReport } = require('../controllers/reportController');
const { auth, requireSection } = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.use(requireSection('reports'));
router.get('/', getReport);

module.exports = router;
