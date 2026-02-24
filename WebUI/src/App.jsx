import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
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
import EmployeeListPage from "./pages/admin/AdminEmployeeListPage";
import EmployeeDetailPage from "./pages/admin/AdminEmployeeDetailPage";
import AdminTasksPage from "./pages/admin/AdminTaskListPage";
import AdminTaskDetailPage from "./pages/admin/AdminTaskDetailPage";
import AdminLeavePage from "./pages/admin/AdminLeavePage";
import AdminHolidayPage from "./pages/admin/AdminHolidayPage";
import AdminTaskReportPage from "./pages/admin/AdminReportsPage";
import AdminTaskCalender from "./pages/admin/AdminTaskCalender";


// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyTasksPage from "./pages/employee/EmployeeTasksPage";
import EmployeeReportsPage from "./pages/employee/EmployeeReportPage";
import EmployeeLeavePage from "./pages/employee/EmployeeLeavePage";
import EmployeeHolidayPage from "./pages/employee/EmployeeHolidayPage";

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
              background: '#0f172a',
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
              iconTheme: { primary: '#f97316', secondary: '#fff' },
            }
          }}
        />

        <div className="min-h-screen bg-slate-50">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/login" element={<LoginPage />} />
            {/* STEP 1: Request Code */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} /> 
            {/* STEP 2: Verify & Reset */}
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
                <Route path="/reports" element={<AdminTaskReportPage />} />
                <Route path="/tasks-calender" element={<AdminTaskCalender />} />
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