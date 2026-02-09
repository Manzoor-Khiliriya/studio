import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();

  // 1. Check Authentication
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Authorization (Role-based)
  // We check if allowedRoles exists and if the user's role is NOT in that list
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    
    // Updated these paths to match your Sidebar/Navbar navigation
    const redirectPath = user.role === "Admin" ? "/admin" : "/employee";
    
    return <Navigate to={redirectPath} replace />;
  }

  // 3. Render nested routes
  return <Outlet />;
};

export default ProtectedRoute;