import { getWorkspaces, createWorkspace } from "@/lib/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useWorkspaces(userId: string) {
  return useQuery({
    queryKey: ["workspaces", userId],
    queryFn: () => getWorkspaces(userId),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => createWorkspace(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
