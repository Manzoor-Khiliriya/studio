const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.use(authenticate);

// Admin-only user management
router.post("/", authorize("Admin"), userController.createUser);
router.get("/", authorize("Admin"), userController.getAllUsers);
router.get("/:id", authorize("Admin"), userController.getUserById);
router.put("/:id", authorize("Admin"), userController.updateUser);
router.delete("/:id", authorize("Admin"), userController.deleteUser);
router.patch("/status/:id", authorize("Admin"), userController.changeUserStatus);

module.exports = router;
