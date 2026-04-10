import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { store } from "./config/store";
import { Toaster } from "react-hot-toast";

// Components & Layout
import Layout from "./components/Layout";
import ProtectedRoute from "./pages/ProtectedRoute";
import NotificationHandler from "./components/NotificationHandler";

// Public Pages
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage"; // <-- IMPORT THIS
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Admin Pages
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

// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyTasksPage from "./pages/employee/EmployeeTasksPage";
import EmployeeLeavePage from "./pages/employee/EmployeeLeavePage";
import EmployeeHolidayPage from "./pages/employee/EmployeeHolidayPage";
import { useEffect } from "react";
import { connectSocket } from "./socket";

function AppContent() {
  const user = useSelector((state) => state.auth.user);
  useEffect(() => {
    if (user?._id) {
      connectSocket(user._id);
    }
  }, [user]);
  return (
    <>
      {user && <NotificationHandler userId={user._id} />}

      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

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
                <Route path="/projects" element={<AdminTaskListPage />} />
                <Route path="/projects/:id" element={<AdminTaskDetailPage />} />
                <Route path="/leaves" element={<AdminLeavePage />} />
                <Route path="/holidays" element={<AdminHolidayPage />} />
                <Route path="/performance" element={<AdminTaskPerformancePage />} />
                <Route path="/projects-calender" element={<AdminProjectCalendar />} />
                <Route path="/attendance" element={<AdminAttendanceListPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Employee"]} />}>
              <Route element={<Layout />}>
                <Route path="/employee" element={<EmployeeDashboard />} />
                <Route path="/my-tasks" element={<MyTasksPage />} />
                <Route path="/my-leaves" element={<EmployeeLeavePage />} />
                <Route path="/public-holidays" element={<EmployeeHolidayPage />} />
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