import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import AdminPage from "./pages/AdminPage";
import ITAgentPage from "./pages/ITAgentPage";
import EmployeePage from "./pages/EmployeePage";
import ManagerPage from "./pages/ManagerPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ErrorBoundary from "./components/ErrorBoundary";
function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/itagent"
              element={
                <ProtectedRoute allowedRoles={["ITAgent", "IT"]}>
                  <ITAgentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={["Manager"]}>
                  <ManagerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee"
              element={
                <ProtectedRoute allowedRoles={["Employee"]}>
                  <EmployeePage />
                </ProtectedRoute>
              }
            />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
