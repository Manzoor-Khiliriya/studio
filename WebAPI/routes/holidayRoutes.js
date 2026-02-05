const express = require("express");
const router = express.Router();
const holidayController = require("../controllers/holidayController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.use(authenticate);

router.get("/", holidayController.getHolidays);

router.post("/", authorize("Admin"), holidayController.addHoliday);
router.post("/bulk", authorize("Admin"), holidayController.bulkAddHolidays);

router.put("/:id", authorize("Admin"), holidayController.updateHoliday);

router.delete("/:id", authorize("Admin"), holidayController.deleteHoliday);

module.exports = router;
