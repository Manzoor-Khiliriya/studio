import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();

  // 1. Not logged in? Send to login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Wrong Role? Redirect based on who they are
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If an Admin accidentally hits an Employee-only page, send them to Admin Dashboard
    // If an Employee tries to hack into Admin pages, send them to Employee Dashboard
    const redirectPath = user.role === "Admin" ? "/admin-dashboard" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  // 3. Authorized? Render the child routes
  return <Outlet />;
};

export default ProtectedRoute;