const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

router.post("/heartbeat", userController.heartbeat);

router.get("/delete-requests/pending", authorize(ROLE.ADMIN), userController.getPendingDeleteRequests);
router.post("/delete-request/respond", authorize(ROLE.ADMIN), userController.respondToDeleteRequest);

router.post("/", authorize(ROLE.ADMIN), userController.createUser);
router.get("/", authorize(ROLE.ADMIN), userController.getAllUsers);
router.get("/departments", authorize(ROLE.ADMIN), userController.getUsersByDepartments);
router.get("/:id", authorize(ROLE.ADMIN), userController.getUserById);
router.put("/:id", authorize(ROLE.ADMIN), userController.updateUser);
router.delete("/:id", authorize(ROLE.ADMIN), userController.deleteUser);
router.patch("/status/:id", authorize(ROLE.ADMIN), userController.changeUserStatus);

module.exports = router;