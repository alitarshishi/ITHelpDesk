import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export function useAllTickets() {
  return useQuery({
    queryKey: ["all-tickets"],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/tickets`);
      if (!res.ok) throw new Error("Failed to load tickets.");
      return res.json();
    },
  });
}

export function useAllUsers(enabled) {
  return useQuery({
    queryKey: ["users"],
    enabled, // only fetch when the Users tab is active
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/users`);
      if (!res.ok) throw new Error("Failed to load users.");
      return res.json();
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      const res = await authFetch(
        `${API_BASE_URL}/users/${userId}/deactivate`,
        { method: "PUT" },
      );
      if (!res.ok) throw new Error("Failed to deactivate user.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      const res = await authFetch(`${API_BASE_URL}/users/${userId}/activate`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to activate user.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      const res = await authFetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
      });
      if (res.status === 409) {
        const d = await res.json().catch(() => null);
        throw new Error(
          d?.message || "User has attached data — use Deactivate instead.",
        );
      }
      if (!res.ok) throw new Error("Failed to delete user.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, roleId }) => {
      const res = await authFetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ roleId }),
      });
      if (!res.ok) throw new Error("Failed to change role.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
