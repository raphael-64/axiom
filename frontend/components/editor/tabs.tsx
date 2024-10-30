import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Tab } from "@/lib/types";

interface TabsProps {
  tabs: Tab[];
  activeTabIndex: number;
  onTabClick: (index: number) => void;
  onTabClose: (index: number) => void;
}

export default function Tabs({
  tabs,
  activeTabIndex,
  onTabClick,
  onTabClose,
}: TabsProps) {
  return (
    <div className="w-full h-10 bg-tabs-bg shrink-0 flex overflow-x-auto">
      {tabs.map((tab, index) => (
        <button
          key={tab.path}
          onClick={() => onTabClick(index)}
          className={cn(
            "group flex border-r border-b justify-center items-center pl-2.5 pr-1.5 gap-0.5 text-sm",
            index === activeTabIndex
              ? "bg-background border-b-background"
              : "text-muted-foreground"
          )}
        >
          {tab.name}
          <div
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(index);
            }}
            className={cn(
              "group-hover:visible invisible inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent bg-transparent size-5",
              index === activeTabIndex
                ? "text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            <X className="size-3.5" />
          </div>
        </button>
      ))}
      <div className="grow border-b"></div>
    </div>
  );
}
