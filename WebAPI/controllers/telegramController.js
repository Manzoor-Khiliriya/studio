const crypto = require("crypto");
const User = require("../models/User");

exports.connectTelegram = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.telegramConnectToken = token;

    user.telegramConnectTokenExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await user.save();

    const botUsername = process.env.TELEGRAM_BOT_USERNAME;

    if (!botUsername) {
      return res.status(500).json({
        message: "Telegram bot username is not configured",
      });
    }

    const telegramUrl =
      `https://t.me/${botUsername}?start=${token}`;

    return res.status(200).json({
      message: "Telegram connection link generated",
      telegramUrl,
    });
  } catch (error) {
    console.error("Connect Telegram error:", error);

    return res.status(500).json({
      message: "Failed to generate Telegram connection link",
    });
  }
};