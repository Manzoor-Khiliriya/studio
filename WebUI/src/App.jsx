import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Components & Layout
import Layout from "./components/Layout";

// Pages
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
// import AdminReportsPage from "./pages/AdminReportsPage";
import EmployeeListPage from "./pages/EmployeeListPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import MyTasksPage from "./pages/MyTasksPage";
import EmployeeReportsPage from "./pages/EmployeeReportPage";
import ProtectedRoute from "./pages/ProtectedRoute";
import AdminTasksPage from "./pages/AdminTaskListPage";
import AdminTaskDetailPage from "./pages/AdminTaskDetailPage";
import AdminLeavePage from "./pages/AdminLeavePage";
import EmployeeLeavePage from "./pages/EmployeeLeavePage";
import { Provider } from "react-redux";
import { store } from "./config/store";
import AdminHolidayPage from "./pages/AdminHolidayPage";
import EmployeeHolidayPage from "./pages/EmployeeHolidayPage";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        {/* Themed Toaster to match your premium UI */}
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
            {/* PUBLIC ROUTE */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ADMIN ROUTES (Protected) */}
            <Route path="/admin" element={
              <ProtectedRoute roleRequired="Admin">
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute roleRequired="Admin">
                <Layout><EmployeeListPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/employees/:id" element={
              <ProtectedRoute roleRequired="Admin">
                <Layout><EmployeeDetailPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute roleRequired="Admin">
                <Layout><AdminTasksPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/tasks/:id" element={
              <ProtectedRoute roleRequired="Admin">
                <Layout><AdminTaskDetailPage /></Layout>
              </ProtectedRoute>
            } />
            {/* <Route path="/reports" element={
              <ProtectedRoute roleRequired="Admin">
                <Layout><AdminReportsPage /></Layout>
              </ProtectedRoute>
            } /> */}
            <Route path="/leaves" element={
              <ProtectedRoute roleRequired="Admin">
                <Layout><AdminLeavePage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/holidays" element={
              <ProtectedRoute roleRequired="Admin">
                <Layout><AdminHolidayPage /></Layout>
              </ProtectedRoute>
            } />

            {/* EMPLOYEE ROUTES (Protected) */}
            <Route path="/employee" element={
              <ProtectedRoute roleRequired="Employee">
                <Layout><EmployeeDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/my-tasks" element={
              <ProtectedRoute roleRequired="Employee">
                <Layout><MyTasksPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/my-reports" element={
              <ProtectedRoute roleRequired="Employee">
                <Layout><EmployeeReportsPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/my-leaves" element={
              <ProtectedRoute roleRequired="Employee">
                <Layout><EmployeeLeavePage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/public-holidays" element={
              <ProtectedRoute roleRequired="Employee">
                <Layout><EmployeeHolidayPage /></Layout>
              </ProtectedRoute>
            } />

            {/* 404/FALLBACK */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </Provider>
  );
}

export default App;