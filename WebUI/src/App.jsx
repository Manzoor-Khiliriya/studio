import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { store } from "./config/store";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import ProtectedRoute from "./pages/ProtectedRoute";
import NotificationHandler from "./components/NotificationHandler";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmployeeListPage from "./pages/admin/AdminEmployeeListPage";
import AdminEmployeeDetailPage from "./pages/admin/AdminEmployeeDetailPage";
import AdminTaskListPage from "./pages/admin/AdminTaskListPage";
import AdminTaskDetailPage from "./pages/admin/AdminTaskDetailPage";
import AdminLeavePage from "./pages/admin/AdminLeavePage";
import AdminHolidayPage from "./pages/admin/AdminHolidayPage";
import AdminTaskPerformancePage from "./pages/admin/AdminTaskPerformancePage";
import AdminProjectCalendar from "./pages/admin/AdminProjectCalender";
import AdminAttendanceListPage from "./pages/admin/AdminAttendanceListPage";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyTasksPage from "./pages/employee/EmployeeTasksPage";
import EmployeeLeavePage from "./pages/employee/EmployeeLeavePage";
import EmployeeHolidayPage from "./pages/employee/EmployeeHolidayPage";
import { useEffect } from "react";
import { connectSocket } from "./socket";
import { useHeartbeatMutation } from "./services/userApi";
import EmployeeProfilePage from "./pages/employee/EmployeeProfilePage";
import AdminTaskAllocationPage from "./pages/admin/AdminTaskAllocationPage";

function AppContent() {
  const user = useSelector((state) => state.auth.user);
  useEffect(() => {
    if (user?._id) {
      connectSocket(user._id);
    }
  }, [user]);

  const [sendHeartbeat] = useHeartbeatMutation();

  useEffect(() => {
    if (!user?._id) return;

    const interval = setInterval(() => {
      sendHeartbeat().unwrap().catch(() => { });
    }, 60000);

    return () => clearInterval(interval);
  }, [user?._id, sendHeartbeat]);

  return (
    <>
      {user && <NotificationHandler userId={user._id} />}

      <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />

      <BrowserRouter>
        <div className="min-h-screen bg-slate-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/home" element={<Navigate to="/login" replace />} />

            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
              <Route element={<Layout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/employees" element={<AdminEmployeeListPage />} />
                <Route path="/employees/:id" element={<AdminEmployeeDetailPage />} />
                <Route path="/projects/:id" element={<AdminTaskDetailPage />} />
                <Route path="/performance" element={<AdminTaskPerformancePage />} />
                <Route path="/projects-calender" element={<AdminProjectCalendar />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Admin", "Hr Manager", "Manager"]} />}>
              <Route element={<Layout />}>
                <Route path="/holidays" element={<AdminHolidayPage />} />
                <Route path="/attendance" element={<AdminAttendanceListPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Admin", "Manager"]} />}>
              <Route element={<Layout />}>
                <Route path="/projects" element={<AdminTaskListPage />} />
                <Route path="/task-history" element={<AdminTaskAllocationPage />} />
              </Route>
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "Employee",
                    "Manager",
                    "GAD Employee",
                    "GAD Manager",
                    "Hr Employee",
                    "Hr Manager",
                  ]}
                />
              }
            >
              <Route element={<Layout />}>
                <Route path="/employee" element={<EmployeeDashboard />} />
                <Route path="/my-profile" element={<EmployeeProfilePage />} />
              </Route>
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "Employee",
                    "Manager",
                    "GAD Employee",
                    "GAD Manager",
                    "Hr Employee",
                  ]}
                />
              }
            >
              <Route element={<Layout />}>
                <Route path="/public-holidays" element={<EmployeeHolidayPage />} />
              </Route>
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["Employee", "Manager"]}
                />
              }
            >
              <Route element={<Layout />}>
                <Route path="/my-tasks" element={<MyTasksPage />} />
              </Route>
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "Employee", "GAD Employee"
                  ]}
                />
              }
            >
              <Route element={<Layout />}>
                <Route path="/my-leaves" element={<EmployeeLeavePage />} />
              </Route>
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["Admin", "Manager", "GAD Manager", "Hr Employee", "Hr Manager"]}
                />
              }
            >
              <Route element={<Layout />}>
                <Route path="/leaves" element={<AdminLeavePage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;