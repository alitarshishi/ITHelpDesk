import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../../services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

const ROLES = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Employee" },
  { id: 3, name: "ITAgent" },
  { id: 4, name: "Manager" },
];

export default function CreateUserForm({ onClose, onCreated }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { userName: "", email: "", password: "", roleId: 2 },
  });

  const password = watch("password");

  const createUser = useMutation({
    mutationFn: async (values) => {
      const res = await authFetch(`${API_BASE_URL}/users`, {
        method: "POST",
        body: JSON.stringify({ ...values, roleId: parseInt(values.roleId) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to create user.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onCreated();
      onClose();
    },
    onError: (err) => setServerError(err.message),
  });

  const onSubmit = (values) => {
    setServerError("");
    createUser.mutate(values);
  };

  const inputStyle = {
    backgroundColor: "#f3f4f6",
    border: "none",
    borderRadius: "10px",
    padding: "11px 14px",
    width: "100%",
    fontSize: "0.9rem",
    outline: "none",
  };
  const errorTextStyle = {
    fontSize: "0.78rem",
    color: "#dc2626",
    marginTop: "4px",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "32px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0 fw-bold" style={{ fontSize: "1.25rem" }}>
            Create New User
          </h5>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.4rem",
              cursor: "pointer",
              color: "#9ca3af",
            }}
          >
            ×
          </button>
        </div>

        {serverError && (
          <div
            className="alert alert-danger py-2 mb-3"
            style={{ fontSize: "0.85rem" }}
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Username */}
          <div className="mb-3">
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "0.85rem" }}
            >
              Username
            </label>
            <input
              type="text"
              placeholder="Enter username"
              style={inputStyle}
              {...register("userName", {
                required: "Username is required.",
                minLength: {
                  value: 3,
                  message: "Must be at least 3 characters.",
                },
              })}
            />
            {errors.userName && (
              <p style={errorTextStyle}>{errors.userName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "0.85rem" }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="Enter email address"
              style={inputStyle}
              {...register("email", {
                required: "Email is required.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address.",
                },
              })}
            />
            {errors.email && (
              <p style={errorTextStyle}>{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "0.85rem" }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              style={inputStyle}
              {...register("password", {
                required: "Password is required.",
                minLength: {
                  value: 8,
                  message: "Must be at least 8 characters.",
                },
              })}
            />
            {errors.password && (
              <p style={errorTextStyle}>{errors.password.message}</p>
            )}
          </div>

          {/* Role */}
          <div className="mb-4">
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "0.85rem" }}
            >
              Role
            </label>
            <select style={inputStyle} {...register("roleId")}>
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "8px 22px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUser.isPending}
              style={{
                background: "#111",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 22px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {createUser.isPending ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
