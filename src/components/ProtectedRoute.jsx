import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, getRole } from "../services/authService";

export default function ProtectedRoute({ children, allowedRoles }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = (getRole() || "").toLowerCase();
    const allowed = allowedRoles.some((r) => r.toLowerCase() === role);
    if (!allowed) {
      // redirect to user's default page
      if (role.includes("admin")) return <Navigate to="/admin" replace />;
      if (role.includes("it")) return <Navigate to="/itagent" replace />;
      if (role.includes("manager")) return <Navigate to="/manager" replace />;
      return <Navigate to="/employee" replace />;
    }
  }

  return children;
}
