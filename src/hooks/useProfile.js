import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export function useMyProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/profile`);
      if (!res.ok) throw new Error("Failed to load profile.");
      return res.json();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userName, email }) => {
      const res = await authFetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        body: JSON.stringify({ userName, email }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to update profile.");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const res = await authFetch(`${API_BASE_URL}/profile/password`, {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to change password.");
      }
      return res.json();
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      // authFetch already skips Content-Type for FormData bodies
      const res = await authFetch(`${API_BASE_URL}/profile/avatar`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to upload photo.");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/profile/avatar`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove photo.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}
