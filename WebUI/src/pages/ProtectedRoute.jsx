import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    let redirectPath = "/employee";

    switch (user.role) {
      case "Admin":
        redirectPath = "/admin";
        break;

      case "Employee":
      case "Manager":
      case "GAD Employee":
      case "GAD Manager":
        redirectPath = "/employee";
        break;

      default:
        redirectPath = "/login";
    }

    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;