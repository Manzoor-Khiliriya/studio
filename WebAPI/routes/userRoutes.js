const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");


router.post("/",authenticate, authorize("Admin"), userController.createUser);
router.get("/", authenticate, authorize("Admin"), userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.put("/:id",authenticate, authorize("Admin"),userController.updateUser);
router.delete("/:id",authenticate, authorize("Admin"), userController.deleteUser);
router.patch("/status/:id", authenticate, authorize("Admin"), userController.changeUserStatus);

module.exports = router;