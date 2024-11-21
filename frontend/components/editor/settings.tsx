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
import { RotateCw } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useTheme } from "next-themes";

import ColorPicker from "./colorPicker";

import { useColorTheme } from "@/components/providers/color-context";
import ColorPreview from "./colorPreview";

type Category = "editor" | "shortcuts" | "colours";

const categories = [
  { id: "editor" as const, label: "Code Editor", icon: FileCode2 },
  { id: "shortcuts" as const, label: "Shortcuts", icon: Keyboard },
  { id: "colours" as const, label: "Colours", icon: Palette },
];

const shortcuts = [
  { label: "Ask George", shortcut: "⌘G" },
  { label: "Toggle explorer panel", shortcut: "⌘B" },
  { label: "Toggle output panel", shortcut: "⌘J" },
  { label: "Open settings menu", shortcut: "⌘K" },
  { label: "Upload into current file", shortcut: "⌘U" },
  { label: "Delete & decrement lines", shortcut: "⌘X" },
];

export default function SettingsModal({
  open,
  setOpen,
  autoComplete,
  setAutoComplete,
  acceptSuggestionOnEnter,
  setAcceptSuggestionOnEnter,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  autoComplete: boolean;
  setAutoComplete: (autoComplete: boolean) => void;
  acceptSuggestionOnEnter: boolean;
  setAcceptSuggestionOnEnter: (accept: boolean) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<Category>("editor");

  useEffect(() => {
    if (!open) setActiveCategory("editor");
  }, [open]);

  const { theme, setTheme, resolvedTheme } = useTheme();

  const colorTheme = useColorTheme();
  const darkThemeColors = colorTheme?.darkTheme.rules;
  const lightThemeColors = colorTheme?.lightTheme.rules;

  const [themeColors, setThemeColors] = useState(
    resolvedTheme === "dark" ? darkThemeColors : lightThemeColors
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
    setThemeColors(
      resolvedTheme === "dark" ? darkThemeColors : lightThemeColors
    );
  }, [colorTheme, resolvedTheme]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <div className="flex h-96">
          <div className="border-r p-2 flex flex-col gap-0.5 w-48 bg-tabs-bg">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
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
