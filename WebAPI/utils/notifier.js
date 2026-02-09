const nodemailer = require("nodemailer");
const Notification = require("../models/Notification");

/**
 * Sends a dual-channel notification (Email + Socket) and saves to DB
 * @param {Object} user - The recipient User object (must have .email and ._id)
 * @param {Object} task - The Task object
 * @param {Object} io - The Socket.io instance from req.app.get('socketio')
 */
const sendTaskNotification = async (user, task, io) => {
  try {
    const messageText = `New Mission Assigned: ${task.title} (#${task.projectNumber})`;

    // 1. SAVE TO DATABASE (For History)
    const newNotif = await Notification.create({
      recipient: user._id,
      type: "task",
      message: messageText,
      taskId: task._id,
    });

    // 2. REAL-TIME SOCKET EMIT (For Instant Pop-up)
    if (io) {
      // Emit to the user's private room
      io.to(user._id.toString()).emit("notification", {
        _id: newNotif._id,
        message: messageText,
        type: "task",
        createdAt: newNotif.createdAt,
        read: false,
      });
    }

    // 3. EMAIL DISPATCH (For Offline Alerts)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use Gmail App Password
      },
    });

    await transporter.sendMail({
      from: '"Command Center" <noreply@yourproject.com>',
      to: user.email,
      subject: `⚠️ New Assignment: ${task.projectNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #f97316; padding: 20px; border-radius: 15px;">
          <h2 style="color: #f97316;">New Mission Authorized</h2>
          <p>Hello <b>${user.name}</b>,</p>
          <p>You have been assigned a new mission critical task.</p>
          <div style="background: #fff7ed; padding: 15px; border-radius: 10px; border: 1px solid #ffedd5;">
            <p style="margin: 0;"><b>Mission:</b> ${task.title}</p>
            <p style="margin: 5px 0;"><b>ID:</b> ${task.projectNumber}</p>
            <p style="margin: 0;"><b>Priority:</b> ${task.priority}</p>
          </div>
          <p>Please log in to your dashboard to begin execution.</p>
        </div>
      `,
    });

    console.log(`Notification sent to ${user.email}`);
  } catch (error) {
    console.error("Notification Engine Error:", error);
  }
};

module.exports = sendTaskNotification;