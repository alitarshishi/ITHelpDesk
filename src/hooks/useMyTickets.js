import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export function useMyTickets() {
  return useQuery({
    queryKey: ["my-tickets"],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/tickets/my`);
      if (!res.ok) throw new Error("Failed to load your tickets.");
      return res.json();
    },
  });
}

export function useManagersList() {
  return useQuery({
    queryKey: ["managers"],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/users/managers`);
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId) => {
      const res = await authFetch(`${API_BASE_URL}/tickets/${ticketId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete ticket.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });
}
