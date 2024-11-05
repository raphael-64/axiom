import {
  getWorkspaces,
  createWorkspace,
  removeCollaborator,
  deleteInvite,
} from "@/lib/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Collaborator, Invite } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

export const getCollaborators = async (workspaceId: string, userId: string) => {
  const res = await fetch(
    `${API_BASE_URL}/api/workspaces/${workspaceId}/users?userId=${userId}`
  );
  if (!res.ok) throw new Error("Failed to fetch collaborators");
  return res.json();
};

export const getInvites = async (workspaceId: string) => {
  const res = await fetch(
    `${API_BASE_URL}/api/workspaces/${workspaceId}/invites`
  );
  if (!res.ok) throw new Error("Failed to fetch invites");
  return res.json();
};

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; workspaceId: string }) =>
      removeCollaborator(data.userId, data.workspaceId),
    onMutate: async ({ userId, workspaceId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["collaborators", workspaceId],
      });

      // Snapshot the previous value
      const previousCollaborators = queryClient.getQueryData<Collaborator[]>([
        "collaborators",
        workspaceId,
      ]);

      // Optimistically remove the collaborator
      queryClient.setQueryData<Collaborator[]>(
        ["collaborators", workspaceId],
        (old = []) => old.filter((c) => c.id !== userId)
      );

      return { previousCollaborators };
    },
    onError: (err, { workspaceId }, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ["collaborators", workspaceId],
        context?.previousCollaborators
      );
    },
    onSettled: (_, __, { workspaceId }) => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({
        queryKey: ["collaborators", workspaceId],
      });
    },
  });
}

export function useDeleteInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { inviteId: string; workspaceId: string }) =>
      deleteInvite(data.inviteId),
    onMutate: async ({ inviteId, workspaceId }) => {
      await queryClient.cancelQueries({ queryKey: ["invites", workspaceId] });

      const previousInvites = queryClient.getQueryData<Invite[]>([
        "invites",
        workspaceId,
      ]);

      queryClient.setQueryData<Invite[]>(["invites", workspaceId], (old = []) =>
        old.filter((invite) => invite.id !== inviteId)
      );

      return { previousInvites };
    },
    onError: (err, { workspaceId }, context) => {
      queryClient.setQueryData(
        ["invites", workspaceId],
        context?.previousInvites
      );
    },
    onSettled: (_, __, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["invites", workspaceId] });
    },
  });
}
