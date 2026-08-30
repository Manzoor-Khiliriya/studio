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
  onDeleteRequestChange,
}) => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleEmployee = () => {
      onEmployeeChange?.();
    };

    const handleProject = () => {
      onProjectChange?.();
    };

    const handleTask = () => {
      onTaskChange?.();
    };

    const handleTimeLog = () => {
      onTimeLogChange?.();
    };

    const handleAttendance = () => {
      onAttendanceChange?.();
    };

    const handleLeave = () => {
      onLeaveChange?.();
    };

    const handleHoliday = () => {
      onHolidayChange?.();
    };

    const handleNotification = () => {
      onNotificationChange?.();
    };

    const handleDashboard = () => {
      onDashboardUpdate?.();
    };

    const handleAllocation = () => {
      onAllocationChange?.();
    };

    const handleDeleteRequest = () => {
      onDeleteRequestChange?.();
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
    socket.on("deleteRequestChanged", handleDeleteRequest);

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
      socket.off("deleteRequestChanged", handleDeleteRequest);
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
    onDeleteRequestChange
  ]);
};
