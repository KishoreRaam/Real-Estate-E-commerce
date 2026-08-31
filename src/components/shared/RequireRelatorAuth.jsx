import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "./useAuth";

export default function RequireRelatorAuth() {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || role !== "relator") {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?role=relator&redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
