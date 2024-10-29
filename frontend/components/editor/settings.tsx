import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Keyboard, FileCode2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type Category = "editor" | "shortcuts";

const categories = [
  { id: "editor" as const, label: "Code Editor", icon: FileCode2 },
  { id: "shortcuts" as const, label: "Shortcuts", icon: Keyboard },
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
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<Category>("editor");

  useEffect(() => {
    if (!open) setActiveCategory("editor");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="flex h-96">
          <div className="border-r p-2 space-y-0.5 w-48">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                // size="sm"
                variant={activeCategory === category.id ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </Button>
            ))}
          </div>
          <div className="p-4 grow overflow-y-auto">
            <div className="font-semibold">
              {categories.find((c) => c.id === activeCategory)?.label}
            </div>
            <div className="mt-4 overflow-y-auto">
              {activeCategory === "editor" ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <label>Theme</label>
                    <Select defaultValue="dark">
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label>Keybindings</label>
                    <Select defaultValue="standard">
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="vim">Vim</SelectItem>
                        <SelectItem value="emacs">Emacs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
