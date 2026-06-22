import { useQuery } from "@tanstack/react-query";
import { authFetch } from "../services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export function useDashboardStats(period) {
  return useQuery({
    queryKey: ["dashboard-stats", period],
    queryFn: async () => {
      const res = await authFetch(
        `${API_BASE_URL}/dashboard/stats?period=${period}`,
      );
      if (!res.ok) throw new Error("Failed to load dashboard stats");
      return res.json();
    },
    staleTime: 30_000, // cache for 30s
  });
}
