import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Components & Layout
import Layout from "./components/Layout";

// Pages
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
// import AdminReportsPage from "./pages/AdminReportsPage";
import EmployeeListPage from "./pages/admin/AdminEmployeeListPage";
import EmployeeDetailPage from "./pages/admin/AdminEmployeeDetailPage";
import MyTasksPage from "./pages/employee/EmployeeTasksPage";
import EmployeeReportsPage from "./pages/employee/EmployeeReportPage";
import ProtectedRoute from "./pages/ProtectedRoute";
import AdminTasksPage from "./pages/admin/AdminTaskListPage";
import AdminTaskDetailPage from "./pages/admin/AdminTaskDetailPage";
import AdminLeavePage from "./pages/admin/AdminLeavePage";
import EmployeeLeavePage from "./pages/employee/EmployeeLeavePage";
import { Provider } from "react-redux";
import { store } from "./config/store";
import AdminHolidayPage from "./pages/admin/AdminHolidayPage";
import EmployeeHolidayPage from "./pages/employee/EmployeeHolidayPage";
import { Toaster } from "react-hot-toast";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotificationHandler from "./components/notificationHandler";

function App() {
  return (
    <Provider store={store}>
      <NotificationHandler />
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a', // slate-900
              color: '#fff',
              borderRadius: '1.5rem',
              padding: '16px 24px',
              fontWeight: '900',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              border: '1px solid rgba(255,255,255,0.1)'
            },
            success: {
              iconTheme: { primary: '#f97316', secondary: '#fff' }, // orange-500
            }
          }}
        />

        <div className="min-h-screen bg-slate-50">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/home" element={<Navigate to="/login" replace />} />

            {/* ADMIN SECTION */}
            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
              <Route element={<Layout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/employees" element={<EmployeeListPage />} />
                <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                <Route path="/tasks" element={<AdminTasksPage />} />
                <Route path="/tasks/:id" element={<AdminTaskDetailPage />} />
                <Route path="/leaves" element={<AdminLeavePage />} />
                <Route path="/holidays" element={<AdminHolidayPage />} />
              </Route>
            </Route>

            {/* EMPLOYEE SECTION */}
            <Route element={<ProtectedRoute allowedRoles={["Employee"]} />}>
              <Route element={<Layout />}>
                <Route path="/employee" element={<EmployeeDashboard />} />
                <Route path="/my-tasks" element={<MyTasksPage />} />
                <Route path="/my-reports" element={<EmployeeReportsPage />} />
                <Route path="/my-leaves" element={<EmployeeLeavePage />} />
                <Route path="/public-holidays" element={<EmployeeHolidayPage />} />
              </Route>
            </Route>

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </Provider>
  );
}

export default App;