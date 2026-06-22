import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch, getUser } from "../../services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Email",
  "Access",
  "Other",
];

//  React Query: fetch lookups once, cached
function useLookups() {
  return useQuery({
    queryKey: ["lookups"],
    queryFn: async () => {
      const [catRes, priRes, statRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/lookup/categories`),
        authFetch(`${API_BASE_URL}/lookup/priorities`),
        authFetch(`${API_BASE_URL}/lookup/statuses`),
      ]);
      return {
        categories: await catRes.json(),
        priorities: await priRes.json(),
        statuses: await statRes.json(),
      };
    },
    staleTime: 5 * 60_000, // lookups rarely change, cache 5 min
  });
}

function useManagers() {
  return useQuery({
    queryKey: ["managers"],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/users/managers`);
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export default function CreateTicketForm({ onClose, onCreated }) {
  const currentUser = getUser();
  const queryClient = useQueryClient();

  const { data: lookups, isLoading: lookupsLoading } = useLookups();
  const { data: managers = [] } = useManagers();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: "Hardware",
      priority: "Medium",
      managerId: "",
    },
  });

  const [serverError, setServerError] = useState("");

  //  React Query mutation for the actual POST
  const createTicket = useMutation({
    mutationFn: async (formValues) => {
      const categoryId = lookups.categories.find(
        (c) => c.name.toLowerCase() === formValues.category.toLowerCase(),
      )?.id;
      const priorityId = lookups.priorities.find(
        (p) => p.name.toLowerCase() === formValues.priority.toLowerCase(),
      )?.id;
      const statusId = lookups.statuses.find(
        (s) => s.name.toLowerCase() === "open",
      )?.id;

      if (!categoryId || !priorityId || !statusId) {
        throw new Error("Could not resolve category, priority, or status.");
      }

      const res = await authFetch(`${API_BASE_URL}/tickets`, {
        method: "POST",
        body: JSON.stringify({
          title: formValues.title,
          description: formValues.description,
          categoryId,
          priorityId,
          statusId,
          submittedById: currentUser?.id,
          assignedToId: formValues.managerId
            ? parseInt(formValues.managerId)
            : null,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to create ticket.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      onCreated();
      onClose();
    },
    onError: (err) => setServerError(err.message),
  });

  const onSubmit = (values) => {
    setServerError("");
    createTicket.mutate(values);
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
        overflowY: "auto",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "32px",
          width: "100%",
          maxWidth: "560px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0 fw-bold" style={{ fontSize: "1.25rem" }}>
            Create New Ticket
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
          {/* Title */}
          <div className="mb-3">
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "0.85rem" }}
            >
              Title
            </label>
            <input
              type="text"
              placeholder="Brief description of the issue"
              style={inputStyle}
              {...register("title", {
                required: "Title is required.",
                maxLength: {
                  value: 150,
                  message: "Title must be under 150 characters.",
                },
              })}
            />
            {errors.title && (
              <p style={errorTextStyle}>{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-3">
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "0.85rem" }}
            >
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide detailed information about the issue"
              style={{ ...inputStyle, resize: "vertical" }}
              {...register("description", {
                required: "Description is required.",
                minLength: {
                  value: 10,
                  message: "Please provide at least 10 characters.",
                },
              })}
            />
            {errors.description && (
              <p style={errorTextStyle}>{errors.description.message}</p>
            )}
          </div>

          {/* Category + Priority */}
          <div className="d-flex gap-3 mb-3">
            <div style={{ flex: 1 }}>
              <label
                className="form-label fw-semibold"
                style={{ fontSize: "0.85rem" }}
              >
                Category
              </label>
              <select style={inputStyle} {...register("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label
                className="form-label fw-semibold"
                style={{ fontSize: "0.85rem" }}
              >
                Priority
              </label>
              <select style={inputStyle} {...register("priority")}>
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ticket Manager */}
          <div className="mb-4">
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "0.85rem" }}
            >
              Ticket Manager{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <select style={inputStyle} {...register("managerId")}>
              <option value="">— Select a manager —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.userName}
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
              disabled={createTicket.isPending || lookupsLoading}
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
              {createTicket.isPending ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
