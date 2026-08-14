const express = require("express");
const router = express.Router();

const { authenticate } = require("../middlewares/authMiddleware");
const telegramController = require("../controllers/telegramController");

router.use(authenticate);

router.get("/connect", telegramController.connectTelegram);

module.exports = router;