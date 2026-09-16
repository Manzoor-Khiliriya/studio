const TimeLog = require("../models/TimeLog");
const TimeAdjustmentRequest = require("../models/TimeAdjustment");
const { applyProficiency } = require("../utils/userHelpers");
const { now } = require("../utils/dateHelper");
const moment = require("moment-timezone");
const TIMEZONE = "Asia/Kolkata";

exports.getEligibleLogs = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const cutoff = moment()
      .tz(TIMEZONE)
      .subtract(Number(days), "days")
      .toDate();

    const logs = await TimeLog.find({
      user: req.user._id,
      isRunning: false,
      stopReason: { $in: ["inactivity", "midnight"] },
      hasAdjustmentRequest: false,
      endTime: { $gte: cutoff },
    })
      .populate({
        path: "task",
        select: "title project",
        populate: { path: "project", select: "title projectCode" },
      })
      .sort({ endTime: -1 })
      .lean();

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.requestAdjustment = async (req, res) => {
  try {
    const { timeLogId, requestedEndTime, reason } = req.body;
    const userId = req.user._id;

    if (!timeLogId || !requestedEndTime || !reason?.trim()) {
      return res
        .status(400)
        .json({ error: "timeLogId, requestedEndTime and reason are required" });
    }

    const log = await TimeLog.findOne({ _id: timeLogId, user: userId });
    if (!log) return res.status(404).json({ error: "Time log not found" });

    if (log.stopReason === "manual") {
      return res.status(400).json({
        error:
          "This session was stopped manually and isn't eligible for correction",
      });
    }

    if (log.hasAdjustmentRequest) {
      return res
        .status(400)
        .json({ error: "A request already exists for this session" });
    }

    const requested = moment.tz(requestedEndTime, TIMEZONE).toDate();
    if (!moment(requested).isValid() || requested <= new Date(log.endTime)) {
      return res.status(400).json({
        error: "Requested end time must be after the recorded stop time",
      });
    }

    const nextLog = await TimeLog.findOne({
      user: userId,
      startTime: { $gt: log.startTime },
    }).sort({ startTime: 1 });

    if (nextLog && requested > new Date(nextLog.startTime)) {
      return res.status(400).json({
        error: "Requested end time overlaps with your next recorded session",
      });
    }

    const adjustment = await TimeAdjustmentRequest.create({
      timeLog: log._id,
      user: userId,
      task: log.task,
      originalEndTime: log.endTime,
      requestedEndTime: requested,
      reason: reason.trim(),
    });

    log.hasAdjustmentRequest = true;
    await log.save();

    res.status(201).json(adjustment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getMyAdjustmentRequests = async (req, res) => {
  try {
    const requests = await TimeAdjustmentRequest.find({ user: req.user._id })
      .populate("task", "title")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAdjustmentRequests = async (req, res) => {
  try {
    const { status } = req.query; // "Pending" | "Approved" | "Rejected" | undefined
    const filter = status ? { status } : {};

    const requests = await TimeAdjustmentRequest.find(filter)
      .populate({
        path: "user",
        select: "name",
        populate: { path: "employee", select: "employeeCode" },
      })
      .populate("task", "title")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.reviewAdjustmentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, adminNote } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      return res
        .status(400)
        .json({ error: "decision must be 'Approved' or 'Rejected'" });
    }

    const request = await TimeAdjustmentRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "Pending") {
      return res
        .status(400)
        .json({ error: "This request has already been reviewed" });
    }

    if (decision === "Approved") {
      const log = await TimeLog.findById(request.timeLog);
      if (!log)
        return res
          .status(404)
          .json({ error: "Underlying time log no longer exists" });

      const rawSeconds = Math.max(
        0,
        Math.floor((request.requestedEndTime - new Date(log.startTime)) / 1000),
      );

      if (log.logType === "work") {
        const { adjustedSeconds } = await applyProficiency(
          log.user,
          rawSeconds,
        );
        log.rawDurationSeconds = rawSeconds;
        log.durationSeconds = adjustedSeconds;
      } else {
        log.rawDurationSeconds = rawSeconds;
        log.durationSeconds = rawSeconds;
      }

      log.endTime = request.requestedEndTime;
      log.stopReason = "manual";
      await log.save();
    }

    request.status = decision;
    request.reviewedBy = req.user._id;
    request.reviewedAt = now();
    if (adminNote) request.adminNote = adminNote.trim();
    await request.save();

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
