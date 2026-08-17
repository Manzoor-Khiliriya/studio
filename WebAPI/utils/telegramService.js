const { TelegramBot } = require("node-telegram-bot-api");
const User = require("../models/User");

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn("TELEGRAM_BOT_TOKEN is not configured");
}

const bot = token
  ? new TelegramBot(token, { polling: true })
  : null;

const sendTelegramMessage = async (chatId, message) => {
  if (!bot) {
    console.log("Telegram bot is not configured");
    return;
  }

  if (!chatId) {
    console.log("No Telegram chat ID");
    return;
  }

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
    });

    console.log(`Telegram message sent to ${chatId}`);
  } catch (error) {
    console.error(
      "Telegram send error:",
      error.response?.body || error.message
    );
  }
};

// Handle Telegram /start command
if (bot) {
  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    try {
      const chatId = msg.chat.id;
      const connectToken = match?.[1];

      console.log("Telegram /start received");
      console.log("Chat ID:", chatId);
      console.log("Connect token:", connectToken);

      if (!connectToken) {
        await bot.sendMessage(
          chatId,
          "Please connect Telegram from your HRMS profile."
        );
        return;
      }

      const user = await User.findOne({
        telegramConnectToken: connectToken,
        telegramConnectTokenExpires: {
          $gt: new Date(),
        },
      });

      if (!user) {
        await bot.sendMessage(
          chatId,
          "❌ This Telegram connection link is invalid or expired.\n\nPlease generate a new connection link from your HRMS profile."
        );
        return;
      }

      user.telegramChatId = String(chatId);
      user.telegramConnectToken = null;
      user.telegramConnectTokenExpires = null;

      await user.save();

      await bot.sendMessage(
        chatId,
        `✅ <b>Telegram Connected Successfully!</b>\n\nHi ${user.name}, your HRMS Telegram notifications are now enabled.`,
        {
          parse_mode: "HTML",
        }
      );

      console.log(
        `Telegram connected successfully for ${user.email}`
      );
    } catch (error) {
      console.error(
        "Telegram connection error:",
        error.response?.body || error.message
      );
    }
  });
}

module.exports = {
  bot,
  sendTelegramMessage,
};