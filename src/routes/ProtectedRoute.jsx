import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Gate + role check in one place. `allowedRoles` is optional — omit it
 * for "any authenticated user"; pass e.g. ["admin","super_admin"] to
 * restrict a whole route subtree.
 *
 * There's no base-subscription lockout any more — MsafiPOS itself is
 * free to use. Only individual add-on features (Payments/Tax) are
 * gated, and that's enforced feature-by-feature by the backend
 * (HasActiveAddon), not by blocking the whole app here.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
