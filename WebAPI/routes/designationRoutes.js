const express = require("express");
const router = express.Router();
const {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} = require("../controllers/designationController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.use(authenticate);

router.get("/", authorize("Admin"), getDesignations);
router.post("/", authorize("Admin"), createDesignation);
router.put("/:id", authorize("Admin"), updateDesignation);
router.delete("/:id", authorize("Admin"), deleteDesignation);

module.exports = router;