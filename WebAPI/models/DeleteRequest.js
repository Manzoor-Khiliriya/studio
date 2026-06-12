const mongoose = require("mongoose");

const deleteRequestSchema = new mongoose.Schema({
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    approvals: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    rejections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
}, { timestamps: true });

module.exports = mongoose.model("DeleteRequest", deleteRequestSchema);