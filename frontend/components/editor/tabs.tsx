import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const testTabs = ["a03q01.grg", "a03q02.grg", "a03q03.grg"];
const selectedTab = "a03q01.grg";

export default function Tabs() {
  return (
    <div className="w-full h-10 bg-tabs-bg shrink-0 flex overflow-x-auto">
      {testTabs.map((tab) => (
        <button
          className={cn(
            "group flex border-r border-b justify-center items-center pl-2.5 pr-1.5 gap-0.5 text-sm",
            tab === selectedTab
              ? "bg-background border-b-background"
              : "text-muted-foreground"
          )}
        >
          {tab}
          <div
            tabIndex={0}
            onClick={() => console.log("close tab")}
            className={cn(
              "group-hover:visible invisible inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent bg-transparent size-5",
              tab === selectedTab
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
