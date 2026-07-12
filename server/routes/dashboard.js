const express = require('express');
const { getStats } = require('../controllers/dashboardController');
const { auth, requireSection } = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.use(requireSection('dashboard'));
router.get('/stats', getStats);

module.exports = router;
