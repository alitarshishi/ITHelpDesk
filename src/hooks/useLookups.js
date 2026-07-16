import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/lookup/categories`);
      if (!res.ok) return [];
      return res.json(); // [{ id, name }]
    },
    staleTime: 5 * 60_000,
  });
}

export function usePriorities() {
  return useQuery({
    queryKey: ["priorities"],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/lookup/priorities`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60_000,
  });
}
