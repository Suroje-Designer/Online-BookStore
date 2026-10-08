const express = require('express');
const { getStats } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, admin, getStats);

module.exports = router;
