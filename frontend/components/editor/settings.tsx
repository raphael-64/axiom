import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Keyboard } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Category = "editor" | "shortcuts";

const categories = [
  { id: "editor" as const, label: "Code Editor", icon: Settings },
  { id: "shortcuts" as const, label: "Shortcuts", icon: Keyboard },
];

export default function SettingsModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<Category>("editor");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="grid grid-cols-[200px_1fr]">
          <div className="border-r p-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-2 rounded-md hover:bg-secondary transition-colors",
                  activeCategory === category.id && "bg-secondary"
                )}
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>
                {categories.find((c) => c.id === activeCategory)?.label}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-6">
              {activeCategory === "editor" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label>Theme</label>
                    <Select defaultValue="dark">
                      <SelectTrigger className="w-[180px]">
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
                      <SelectTrigger className="w-[180px]">
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
                <div className="space-y-4">
                  {[
                    { label: "Toggle Sidebar", shortcut: "⌘B" },
                    { label: "Toggle Output", shortcut: "⌘J" },
                    { label: "Open Settings", shortcut: "⌘K" },
                    { label: "Upload File", shortcut: "⌘U" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      <kbd className="px-2 py-1 bg-secondary rounded-md">
                        {item.shortcut}
                      </kbd>
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
