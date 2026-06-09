const express = require("express");
const router = express.Router();
const {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} = require("../controllers/designationController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

router.get("/", authorize(ROLE.ADMIN), getDesignations);
router.post("/", authorize(ROLE.ADMIN), createDesignation);
router.put("/:id", authorize(ROLE.ADMIN), updateDesignation);
router.delete("/:id", authorize(ROLE.ADMIN), deleteDesignation);

module.exports = router;