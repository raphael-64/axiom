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
    mutationFn: (data: { userId: string; assignmentId: string }) =>
      createWorkspace(data.userId, data.assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
