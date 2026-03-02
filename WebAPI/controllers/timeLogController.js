const TimeLog = require("../models/TimeLog");
const Task = require("../models/Task");
const Employee = require("../models/Employee");
const Project = require("../models/Project");
const mongoose = require("mongoose");

exports.startTimer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskId } = req.body;
    const userId = req.user._id;

    if (!taskId) throw new Error("Task ID is required.");

    const employee = await Employee.findOne({ user: userId });
    if (!employee) throw new Error("Employee profile not found for this user.");

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: employee._id
    });

    if (!task) throw new Error("Task not found or not assigned to your employee profile.");

    const today = new Date().toISOString().split("T")[0];

    // 1. Check Daily Limit
    const logs = await TimeLog.find({ user: userId, dateString: today, logType: "work" });
    const hoursToday = logs.reduce((sum, l) => sum + (l.durationSeconds / 3600 || 0), 0);

    if (hoursToday >= employee.dailyWorkLimit) {
      throw new Error(`Daily limit reached (${employee.dailyWorkLimit} hrs). Please contact admin.`);
    }

    // 2. Stop any existing running timers (Auto-switch)
    const activeLog = await TimeLog.findOne({ user: userId, isRunning: true });
    if (activeLog) {
        const now = new Date();
        const duration = Math.floor((now.getTime() - new Date(activeLog.startTime).getTime()) / 1000);
        activeLog.endTime = now;
        activeLog.isRunning = false;
        activeLog.durationSeconds = Math.max(0, duration);
        await activeLog.save({ session });
    }

    // 3. Create new Work Log
    const log = await TimeLog.create([{
      user: userId,
      task: taskId,
      startTime: new Date(),
      isRunning: true,
      logType: "work",
      dateString: today
    }], { session });

    if (task.liveStatus === "To be started") {
      task.liveStatus = "In progress";
      await task.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json(log[0]);

  } catch (err) {
    await session.abortTransaction();
    const message = err.name === "CastError" ? "Invalid Task ID format" : err.message;
    res.status(400).json({ error: message });
  } finally {
    session.endSession();
  }
};

exports.togglePause = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split("T")[0];

    const active = await TimeLog.findOne({ user: userId, isRunning: true });
    if (!active) return res.status(404).json({ message: "No active timer found." });

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(active.startTime).getTime()) / 1000);

    // Close Current Log
    active.endTime = now;
    active.isRunning = false;
    active.durationSeconds = Math.max(0, diffInSeconds);
    await active.save();

    // Switch types: if was "work" -> "break", if was "break" -> "work"
    const newType = active.logType === "work" ? "break" : "work";

    const newLog = await TimeLog.create({
      user: userId,
      task: active.task,
      startTime: new Date(),
      logType: newType,
      isRunning: true,
      dateString: today
    });

    res.json({ status: newType, log: newLog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.stopTimer = async (req, res) => {
  try {
    const log = await TimeLog.findOne({ user: req.user._id, isRunning: true });
    if (!log) return res.status(400).json({ message: "No active timer found." });

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(log.startTime).getTime()) / 1000);

    log.endTime = now;
    log.isRunning = false;
    log.durationSeconds = Math.max(0, diffInSeconds);
    await log.save();

    res.json({ message: "Session Terminated", log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyLogs = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const logs = await TimeLog.find({
      user: req.user._id,
      dateString: today
    })
      .populate("task", "title projectNumber")
      .sort({ startTime: -1 });

    const activeLog = logs.find(l => l.isRunning);

    const totalSeconds = logs
      .filter(l => l.logType === "work")
      .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

    const hoursWorkedToday = +(totalSeconds / 3600).toFixed(2);

    res.json({
      activeTaskId: activeLog?.task?._id || null,
      status: activeLog ? activeLog.logType : "idle",
      hoursWorkedToday,
      logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTaskPerformanceReport = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Build Project Filter (Search by Project Code or Title)
    const projectQuery = {};
    if (search) {
      projectQuery.$or = [
        { project_code: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } }
      ];
    }

    // 2. Aggregate from Project Collection
    const report = await Project.aggregate([
      { $match: projectQuery },
      { $sort: { createdAt: -1 } },
      
      // Pagination at Project Level
      { $skip: skip },
      { $limit: Number(limit) },

      // 3. Lookup Tasks for each Project
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "project",
          as: "taskList"
        }
      },

      // 4. Filter for only active tasks (optional, remove if you want all)
      {
        $addFields: {
          taskList: {
            $filter: {
              input: "$taskList",
              as: "task",
              cond: { $ne: ["$$task.status", "Completed"] }
            }
          }
        }
      },

      // 5. Lookup Timelogs for these tasks
      {
        $lookup: {
          from: "timelogs",
          localField: "taskList._id",
          foreignField: "task",
          as: "allLogs"
        }
      },

      // 6. Calculate Metrics for each Task and Project totals
      {
        $project: {
          project_code: 1,
          title: 1,
          clientName: 1,
          taskList: {
            $map: {
              input: "$taskList",
              as: "t",
              in: {
                _id: "$$t._id",
                title: "$$t.title",
                status: "$$t.status",
                allocatedTime: "$$t.allocatedTime",
                // Sum work hours for THIS specific task
                totalWorkHours: {
                  $round: [
                    {
                      $divide: [
                        {
                          $reduce: {
                            input: {
                              $filter: {
                                input: "$allLogs",
                                as: "log",
                                cond: { 
                                  $and: [
                                    { $eq: ["$$log.task", "$$t._id"] },
                                    { $eq: ["$$log.logType", "work"] }
                                  ]
                                }
                              }
                            },
                            initialValue: 0,
                            in: { $add: ["$$value", { $ifNull: ["$$this.durationSeconds", 0] }] }
                          }
                        },
                        3600
                      ]
                    },
                    2
                  ]
                }
              }
            }
          }
        }
      },

      // 7. Add Project-level Totals
      {
        $addFields: {
          totalBudget: { $sum: "$taskList.allocatedTime" },
          totalConsumed: { $sum: "$taskList.totalWorkHours" }
        }
      }
    ]);

    // 8. Get Total Count for Pagination
    const totalProjects = await Project.countDocuments(projectQuery);

    res.json({
      projects: report,
      pagination: {
        totalProjects,
        totalPages: Math.ceil(totalProjects / limit),
        currentPage: Number(page)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.stopAllLiveSessions = async (req, res) => {
  try {
    const now = new Date();
    const activeLogs = await TimeLog.find({ isRunning: true });

    const updatePromises = activeLogs.map(log => {
      const duration = Math.floor((now - new Date(log.startTime)) / 1000);
      log.endTime = now;
      log.isRunning = false;
      log.durationSeconds = Math.max(0, duration);
      return log.save();
    });

    await Promise.all(updatePromises);

    res.json({
      message: `Global shutdown complete. ${activeLogs.length} sessions recorded.`,
      stoppedCount: activeLogs.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clearAllLogs = async (req, res) => {
  try {
    // Admin operation to mark logs as "archived" from the dashboard view
    await TimeLog.updateMany(
      { isRunning: false, clearedByAdmin: { $ne: true } },
      { $set: { clearedByAdmin: true } }
    );
    res.json({ message: "Admin dashboard logs cleared." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};