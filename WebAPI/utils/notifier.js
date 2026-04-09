const nodemailer = require("nodemailer");
const Notification = require("../models/Notification");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendNotification = async (recipient, data, io) => {
  try {
    const { message, type, taskId, subject, htmlContent, password, otp } = data; // Added otp

    // 1. Create DB Notification for the Bell Icon
    // Note: We usually DON'T save OTPs to the notification table for security, 
    // but we can save a log that a reset was requested.
    const newNotif = await Notification.create({
      recipient: recipient._id,
      type: type || "task",
      message: message,
      taskId: taskId || null,
    });

    // 2. Push Real-time Toast via Socket.io
    if (io) {
      io.to(recipient._id.toString()).emit("notification", {
        _id: newNotif._id,
        message: message,
        type: type || "task",
        createdAt: newNotif.createdAt,
      });
    }

    // 3. Select Email Template
    let finalHtml = htmlContent;
    let finalSubject = subject || "System Notification";

    if (type === "reset" && otp) {
      finalSubject = "🔐 Password Reset Verification Code";
      finalHtml = `
        <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 30px; border-radius: 20px; max-width: 500px;">
          <h2 style="color: #f97316; margin-bottom: 20px;">Password Reset</h2>
          <p style="color: #475569;">You requested to reset your password. Use the code below to proceed:</p>
          <div style="background: #fff7ed; padding: 20px; text-align: center; border-radius: 12px; margin: 25px 0;">
            <h1 style="color: #f97316; letter-spacing: 8px; margin: 0; font-size: 32px;">${otp}</h1>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>`;
    } else if (type === "system" && password) {
      finalSubject = "🚀 Your Account Credentials";
      finalHtml = `<div style="font-family: sans-serif; border: 1px solid #f97316; padding: 20px; border-radius: 15px;">
          <h2>Welcome, ${recipient.name}!</h2>
          <p>Login with: <br> <b>Email:</b> ${recipient.email} <br> <b>Password:</b> ${password}</p>
        </div>`;
    } else if (!htmlContent) {
      finalHtml = `<p>${message}</p>`;
    } else if (type === "leave") {
      const isApproved = message.includes("Approved");
      finalSubject = isApproved ? "✅ Leave Request Approved" : "❌ Leave Request Rejected";
      finalHtml = `
    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 30px; border-radius: 20px; max-width: 500px;">
      <h2 style="color: ${isApproved ? '#22c55e' : '#ef4444'}; margin-bottom: 20px;">
        Leave ${isApproved ? 'Approved' : 'Rejected'}
      </h2>
      <p style="color: #475569;">Hi ${recipient.name},</p>
      <p style="color: #475569;">${message}</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
        Please log in to view your leave details.
      </p>
    </div>`;
    }

    // 4. Send Email
    await transporter.sendMail({
      from: `"sanddstudioadmin" <${process.env.EMAIL_USER}>`,
      to: recipient.email,
      subject: finalSubject,
      html: finalHtml,
    });

  } catch (error) {
    console.error("Email/Notification Error:", error);
  }
};

module.exports = sendNotification;