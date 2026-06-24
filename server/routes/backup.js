const express = require('express');
const { exportBackup, importBackup, getDbStats } = require('../controllers/backupController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.use(adminOnly);

router.get('/export', exportBackup);
router.post('/import', importBackup);
router.get('/stats', getDbStats);

module.exports = router;
