const Notification = require("../models/Notification");

const emitEvent = (req, event, data, userId = null) => {
  const io = req.app.get("socketio");
  if (!io) return;

  if (userId) {
    io.to(userId.toString()).emit(event, data);
  } else {
    io.emit(event, data);
  }
};

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    emitEvent(req, "notificationsRead", { userId: req.user._id }, req.user._id);

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    emitEvent(req, "notificationDeleted", req.params.id, req.user._id);

    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};