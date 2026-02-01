const express = require('express');
const router = express.Router();
const { getHolidays, addHoliday, deleteHoliday, bulkAddHolidays } = require('../controllers/holidayController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Public/Employee can view, but only Admin can edit
router.get('/', authenticate, getHolidays);
router.post('/', authenticate, authorize("Admin"), addHoliday);
router.post('/bulk', authenticate, authorize("Admin"), bulkAddHolidays);
router.delete('/:id', authenticate, authorize("Admin"), deleteHoliday);

module.exports = router;