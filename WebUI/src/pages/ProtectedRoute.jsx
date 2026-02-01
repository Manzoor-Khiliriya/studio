import { useSelector } from "react-redux"; // Use Redux selector
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, roleRequired }) => {
  // Get user and loading state from Redux
  const { user, token } = useSelector((state) => state.auth);

  // Since Redux state is initialized from localStorage in our slice, 
  // we don't usually need a "loading" state here anymore.
  
  // 1. If no token/user exists, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. If a specific role is required and user doesn't have it
  if (roleRequired && user.role !== roleRequired) {
    // Redirect to a default page (or unauthorized page)
    return <Navigate to={user.role === "Admin" ? "/admin" : "/employee"} replace />;
  }

  // 3. If everything is fine, show the page
  return children;
};

export default ProtectedRoute;