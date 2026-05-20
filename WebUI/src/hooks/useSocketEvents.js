import { useEffect } from "react";
import { getSocket } from "../socket";

export const useSocketEvents = ({
  onEmployeeChange,
  onProjectChange,
  onTaskChange,
  onTimeLogChange,
  onAttendanceChange,
  onLeaveChange,
  onHolidayChange,
  onNotificationChange,
  onDashboardUpdate,
  onAllocationChange,
}) => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleEmployee = () => {
      console.log("👨‍💼 Employee changed");
      onEmployeeChange?.();
    };

    const handleProject = () => {
      console.log("📁 Project changed");
      onProjectChange?.();
    };

    const handleTask = () => {
      console.log("📌 Task changed");
      onTaskChange?.();
    };

    const handleTimeLog = () => {
      console.log("⏱ TimeLog changed");
      onTimeLogChange?.();
    };

    const handleAttendance = () => {
      console.log("📅 Attendance changed");
      onAttendanceChange?.();
    };

    const handleLeave = () => {
      console.log("🏖 Leave changed");
      onLeaveChange?.();
    };

    const handleHoliday = () => {
      console.log("🎉 Holiday changed");
      onHolidayChange?.();
    };

    const handleNotification = () => {
      console.log("🔔 Notification changed");
      onNotificationChange?.();
    };

    const handleDashboard = () => {
      console.log("📊 Dashboard updated");
      onDashboardUpdate?.();
    };

    const handleAllocation = () => {
      console.log("🧩 Allocation changed");
      onAllocationChange?.();
    };

    socket.on("employeeChanged", handleEmployee);
    socket.on("projectChanged", handleProject);
    socket.on("taskChanged", handleTask);
    socket.on("timeLogChanged", handleTimeLog);
    socket.on("attendanceChanged", handleAttendance);
    socket.on("leaveChanged", handleLeave);
    socket.on("holidayChanged", handleHoliday);
    socket.on("notificationChanged", handleNotification);
    socket.on("dashboardUpdated", handleDashboard);
    socket.on("allocationChanged", handleAllocation);

    return () => {
      socket.off("employeeChanged", handleEmployee);
      socket.off("projectChanged", handleProject);
      socket.off("taskChanged", handleTask);
      socket.off("timeLogChanged", handleTimeLog);
      socket.off("attendanceChanged", handleAttendance);
      socket.off("leaveChanged", handleLeave);
      socket.off("holidayChanged", handleHoliday);
      socket.off("notificationChanged", handleNotification);
      socket.off("dashboardUpdated", handleDashboard);
      socket.off("allocationChanged", handleAllocation);
    };
  }, [
    onEmployeeChange,
    onProjectChange,
    onTaskChange,
    onTimeLogChange,
    onAttendanceChange,
    onLeaveChange,
    onHolidayChange,
    onNotificationChange,
    onDashboardUpdate,
    onAllocationChange,
  ]);
};
