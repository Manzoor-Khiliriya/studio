exports.emitDashboardUpdate = (req) => {
  const io = req.app.get("socketio");
  if (!io) return;

  io.emit("dashboardUpdated");
};