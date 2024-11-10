import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MailX, Plus, Send, User, X, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useQuery } from "@tanstack/react-query";
import {
  getCollaborators,
  getInvites,
  useRemoveCollaborator,
  useDeleteInvite,
  useCollaborators,
  useWorkspaceInvites,
  useCreateInvite,
} from "@/lib/query";
import type { Collaborator, Invite } from "@/lib/types";
import { useState } from "react";

export default function ManageAccessModal({
  open,
  setOpen,
  workspaceId,
  userId,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  workspaceId: string | null;
  userId: string;
}) {
  const [inviteUsername, setInviteUsername] = useState("");
  const createInvite = useCreateInvite();

  const { data: collaborators = [], isLoading: loadingCollaborators } =
    useCollaborators(workspaceId, userId);

  const { data: invites = [], isLoading: loadingInvites } =
    useWorkspaceInvites(workspaceId);

  const removeCollaborator = useRemoveCollaborator();
  const deleteInvite = useDeleteInvite();

  const handleRemoveCollaborator = (collaboratorId: string) => {
    if (!workspaceId) return;
    removeCollaborator.mutate({
      userId: collaboratorId,
      workspaceId,
    });
  };

  const handleRevokeInvite = (inviteId: string) => {
    if (!workspaceId) return;
    deleteInvite.mutate({
      inviteId,
      workspaceId,
    });
  };

  const handleInvite = () => {
    if (!workspaceId || !inviteUsername) return;
    createInvite.mutate({
      userId: inviteUsername,
      workspaceId,
    });
    setInviteUsername(""); // Clear input after sending
  };

  if (!workspaceId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-0 p-0 overflow-hidden">
        <div className="p-4 space-y-4">
          <DialogHeader>
            <DialogTitle>Manage Workspace Access</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 w-full">
            <Input
              placeholder="Username (e.g. i2dey)"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInvite}
              disabled={createInvite.isPending || !inviteUsername}
            >
              {createInvite.isPending ? (
                <Loader2 className="animate-spin !size-3" />
              ) : (
                <Plus className="!size-3" />
              )}
              Invite
            </Button>
          </div>
        </div>
        <div className="p-4 border-t bg-tabs-bg space-y-3">
          <div className="font-semibold">Collaborators</div>
          <div className="space-y-1">
            {loadingCollaborators ? (
              <div className="text-sm text-muted-foreground flex items-center">
                <Loader2 className="animate-spin size-4 mr-2" />
                Loading...
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No collaborators yet.
              </div>
            ) : (
              collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="font-medium flex items-center gap-2">
                    <User className="size-4" />
                    {collaborator.id}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-[5.5rem]"
                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                    disabled={removeCollaborator.isPending}
                  >
                    <X className="!size-3" />
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="p-4 border-t bg-tabs-bg space-y-3">
          <div className="font-semibold">Pending Invites</div>
          <div className="space-y-1">
            {loadingInvites ? (
              <div className="text-sm text-muted-foreground flex items-center">
                <Loader2 className="animate-spin size-4 mr-2" />
                Loading...
              </div>
            ) : invites.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No pending invites.
              </div>
            ) : (
              invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="font-medium flex items-center gap-2">
                    <Send className="size-4" />
                    {invite.user.id}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-[5.5rem]"
                    onClick={() => handleRevokeInvite(invite.id)}
                    disabled={deleteInvite.isPending}
                  >
                    <MailX className="!size-3.5" />
                    Revoke
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
