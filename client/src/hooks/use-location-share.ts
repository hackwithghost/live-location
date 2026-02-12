import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useActiveShare() {
  return useQuery({
    queryKey: [api.shares.me.path],
    queryFn: async () => {
      const res = await fetch(api.shares.me.path, { credentials: "include" });
      if (res.status === 401) return null; // Handle unauthorized gracefully
      if (!res.ok) throw new Error("Failed to fetch active share");
      
      const data = await res.json();
      return api.shares.me.responses[200].parse(data);
    },
    // Don't refetch too aggressively to avoid jitter, but keep it reasonably fresh
    staleTime: 30 * 1000, 
  });
}

export function useShareByToken(token: string) {
  return useQuery({
    queryKey: [api.shares.get.path, token],
    queryFn: async () => {
      const url = buildUrl(api.shares.get.path, { token });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch share");
      return api.shares.get.responses[200].parse(await res.json());
    },
    enabled: !!token,
  });
}

export function useCreateShare() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.shares.create.path, {
        method: api.shares.create.method,
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to start sharing");
      }
      
      return api.shares.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.shares.me.path], data);
      toast({
        title: "Sharing Started",
        description: "Your live location is now being shared.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start sharing",
        variant: "destructive",
      });
    },
  });
}

export function useStopShare() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.shares.stop.path, {
        method: api.shares.stop.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to stop sharing");
      return api.shares.stop.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.setQueryData([api.shares.me.path], null);
      toast({
        title: "Sharing Stopped",
        description: "Your location is no longer being shared.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
