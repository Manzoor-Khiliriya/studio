const express = require("express");
const router = express.Router();
const holidayController = require("../controllers/holidayController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

router.get("/", holidayController.getHolidays);

router.post("/", authorize(ROLE.ADMIN), holidayController.addHoliday);
router.post("/bulk", authorize(ROLE.ADMIN), holidayController.bulkAddHolidays);

router.put("/:id", authorize(ROLE.ADMIN), holidayController.updateHoliday);

router.delete("/:id", authorize(ROLE.ADMIN), holidayController.deleteHoliday);

module.exports = router;
