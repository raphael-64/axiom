import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MailX, Plus, Send, User, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const collaborators = ["i2dey", "r34agarw"];

const invites = ["ikorovin", "ekurien"];

export default function ManageAccessModal({
  open,
  setOpen,
  workspaceId,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  workspaceId: string | null;
}) {
  if (!workspaceId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-0 p-0 overflow-hidden">
        <div className="p-4 space-y-4">
          <DialogHeader>
            <DialogTitle>Manage Workspace Access</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 w-full">
            <Input placeholder="Username (e.g. i2dey)" />
            <Button size="sm" variant="secondary">
              <Plus className="!size-3" />
              Invite
            </Button>
          </div>
        </div>
        <div className="p-4 border-t bg-tabs-bg space-y-3">
          <div className="font-semibold">Collaborators</div>
          <div className="space-y-1">
            {collaborators.map((collaborator) => (
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium flex items-center gap-2">
                  <User className="size-4" />
                  {collaborator}
                </div>
                <Button size="sm" variant="secondary" className="w-[5.5rem]">
                  <X className="!size-3" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t bg-tabs-bg space-y-3">
          <div className="font-semibold">Pending Invites</div>
          <div className="space-y-1">
            {invites.map((invite) => (
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium flex items-center gap-2">
                  <Send className="size-4" />
                  {invite}
                </div>
                <Button size="sm" variant="secondary" className="w-[5.5rem]">
                  <MailX className="!size-3.5" />
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
