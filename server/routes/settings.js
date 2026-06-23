const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/', getSettings);
router.put('/', adminOnly, updateSettings);

module.exports = router;
