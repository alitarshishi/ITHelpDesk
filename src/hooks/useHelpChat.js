import { useMutation } from "@tanstack/react-query";
import { authFetch } from "../services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export function useHelpChat() {
  return useMutation({
    mutationFn: async (messages) => {
      const res = await authFetch(`${API_BASE_URL}/ai/chat`, {
        method: "POST",
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to reach the assistant.");
      }
      return res.json();
    },
  });
}
