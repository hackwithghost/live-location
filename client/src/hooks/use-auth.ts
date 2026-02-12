import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: [api.auth.status.path],
    queryFn: async () => {
      const res = await fetch(api.auth.status.path);
      if (!res.ok) throw new Error("Failed to check auth status");
      return api.auth.status.responses[200].parse(await res.json());
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: data?.user,
    isAuthenticated: data?.isAuthenticated ?? false,
    isLoading,
    error,
  };
}
