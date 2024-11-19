import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Keyboard, FileCode2, Users, Palette, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserInvites, useRespondToInvite, useWorkspaces } from "@/lib/query";
import { toast } from "sonner";
import { InviteWithWorkspace } from "@/lib/types";
import { RotateCw } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useTheme } from "next-themes";

// import { darkTheme, lightTheme } from "@/lib/colors";
import ColorPicker from "./colorPicker";

import { useColorTheme } from "@/components/providers/color-context";
import ColorPreview from "./colorPreview";

type Category = "editor" | "shortcuts" | "invites" | "colours";

const categories = [
  { id: "editor" as const, label: "Code Editor", icon: FileCode2 },
  { id: "shortcuts" as const, label: "Shortcuts", icon: Keyboard },
  { id: "invites" as const, label: "Invites", icon: Users },
  { id: "colours" as const, label: "Colours", icon: Palette },
];

const shortcuts = [
  { label: "Ask George", shortcut: "⌘G" },
  { label: "Toggle Sidebar", shortcut: "⌘B" },
  { label: "Toggle Output", shortcut: "⌘J" },
  { label: "Open Settings", shortcut: "⌘K" },
  { label: "Upload File", shortcut: "⌘U" },
];

export default function SettingsModal({
  open,
  setOpen,
  userId,
  autoComplete,
  setAutoComplete,
  acceptSuggestionOnEnter,
  setAcceptSuggestionOnEnter,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  userId: string;
  autoComplete: boolean;
  setAutoComplete: (autoComplete: boolean) => void;
  acceptSuggestionOnEnter: boolean;
  setAcceptSuggestionOnEnter: (accept: boolean) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<Category>("editor");

  useEffect(() => {
    if (!open) setActiveCategory("editor");
  }, [open]);

  const { data: workspaces } = useWorkspaces(userId);
  const {
    data: invites,
    refetch: refetchInvites,
    isLoading: invitesLoading,
  } = useUserInvites(userId);
  const respondToInvite = useRespondToInvite();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const colorTheme = useColorTheme();
  const darkThemeColors = colorTheme?.darkTheme.rules;
  const lightThemeColors = colorTheme?.lightTheme.rules;

  const [themeColors, setThemeColors] = useState(
    theme === "dark" ? darkThemeColors : lightThemeColors
  );

  const colorNames = [
    "Comments",
    "George Commands",
    "Keywords",
    "Rules",
    "Operators",
    "Literals",
    "Line Numbers",
  ];

  useEffect(() => {
    setThemeColors(theme === "dark" ? darkThemeColors : lightThemeColors);
  }, [colorTheme]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <div className="flex h-96">
          <div className="border-r p-2 space-y-0.5 w-48 bg-tabs-bg">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => {
                  if (category.id === "invites") refetchInvites();
                  setActiveCategory(category.id);
                }}
                variant={activeCategory === category.id ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </Button>
            ))}
          </div>
          <div className="grow">
            <div className="flex items-center p-4 pb-0 gap-1">
              <div className="font-semibold">
                {categories.find((c) => c.id === activeCategory)?.label}
              </div>
              {activeCategory === "invites" && (
                <TooltipButton
                  tooltip="Refetch invites"
                  disabled={invites === undefined || invitesLoading}
                  variant="ghost"
                  size="xsIcon"
                  onClick={() => refetchInvites()}
                >
                  <RotateCw className="!size-3.5" />
                </TooltipButton>
              )}
              {activeCategory === "colours" && (
                <TooltipButton
                  tooltip="Default Colours"
                  variant="ghost"
                  size="xsIcon"
                  onClick={() => {
                    colorTheme?.resetToDefault();
                  }}
                >
                  <RotateCw className="!size-3.5" />
                </TooltipButton>
              )}
            </div>
            <div className="p-4 overflow-y-auto">
              {activeCategory === "editor" ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <label>Theme</label>
                    <Select
                      value={theme}
                      onValueChange={(value) => setTheme(value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue>
                          {theme &&
                            theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between h-8">
                    <div className="flex items-center gap-2">
                      <label>Auto Complete</label>
                      <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger>
                            <HelpCircle className="size-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Toggles code completion language suggestions.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      checked={autoComplete}
                      onCheckedChange={(checked) => {
                        setAutoComplete(checked);
                        localStorage.setItem("autoComplete", String(checked));
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between h-8">
                    <div className="flex items-center gap-2">
                      <label>Accept Suggestion on Enter</label>
                      <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger>
                            <HelpCircle className="size-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Controls whether suggestions should be accepted on
                            Enter, in addition to Tab.
                            <br />
                            Helps to avoid ambiguity between inserting new lines
                            or accepting suggestions.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      checked={acceptSuggestionOnEnter}
                      onCheckedChange={(checked) => {
                        setAcceptSuggestionOnEnter(checked);
                        localStorage.setItem(
                          "acceptSuggestionOnEnter",
                          String(checked)
                        );
                      }}
                    />
                  </div>
                </div>
              ) : activeCategory === "shortcuts" ? (
                <div className="space-y-2 text-sm">
                  {shortcuts.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      <span className="w-8 justify-center py-0.5 inline-flex text-muted-foreground border rounded border-b-2 bg-muted/25">
                        {item.shortcut}
                      </span>
                    </div>
                  ))}
                </div>
              ) : activeCategory === "invites" ? (
                <div className="space-y-2">
                  {!invites ? (
                    <div className="text-sm text-muted-foreground flex items-center">
                      <RotateCw className="animate-spin size-4 mr-2" />
                      Loading...
                    </div>
                  ) : invites.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No pending invites.
                    </div>
                  ) : (
                    invites.map((invite: InviteWithWorkspace) => {
                      const hasConflict = workspaces?.workspaces?.some(
                        (w) =>
                          w.project === invite.workspace.project &&
                          !w.invites.some((i) => i.id === invite.id)
                      );

                      return (
                        <div
                          key={invite.id}
                          className="border rounded-md p-3 space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">
                                {invite.workspace.project}
                              </div>
                              <div className="text-muted-foreground text-xs w-full overflow-hidden text-ellipsis">
                                {invite.workspace.users
                                  .map((u) => u.id)
                                  .join(", ")}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={respondToInvite.isPending}
                                onClick={() => {
                                  if (hasConflict) {
                                    toast.error(
                                      "You already have a workspace with this project name"
                                    );
                                    return;
                                  }
                                  respondToInvite.mutate({
                                    inviteId: invite.id,
                                    accept: true,
                                  });
                                }}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={respondToInvite.isPending}
                                onClick={() =>
                                  respondToInvite.mutate({
                                    inviteId: invite.id,
                                    accept: false,
                                  })
                                }
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : activeCategory === "colours" ? (
                <>
                  <div className="space-y-2 text-sm">
                    {themeColors?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div>{colorNames[index]}</div>
                        <ColorPicker
                          token={item.token}
                          defaultColor={"#" + item.foreground}
                        />
                      </div>
                    ))}
                  </div>
                  <ColorPreview />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
