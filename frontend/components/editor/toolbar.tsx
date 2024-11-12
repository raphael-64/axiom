import { TooltipButton } from "@/components/ui/tooltip-button";
import { PanelBottom, PanelLeft, Settings } from "lucide-react";

interface ToolbarProps {
  loading: boolean;
  activeTabIndex: number;
  handleAskGeorge: () => void;
  toggleExplorer: () => void;
  toggleOutput: () => void;
  setIsSettingsOpen: (open: boolean) => void;
}

export default function Toolbar({
  loading,
  activeTabIndex,
  handleAskGeorge,
  toggleExplorer,
  toggleOutput,
  setIsSettingsOpen,
}: ToolbarProps) {
  return (
    <div className="w-full flex items-center justify-between border-b p-1.5 px-2">
      <div className="flex items-center gap-2">
        <div className="font-semibold">Axiom</div>
        <TooltipButton
          variant="secondary"
          size="sm"
          onClick={handleAskGeorge}
          tooltip="Ask George (⌘G)"
          disabled={loading || activeTabIndex === -1}
        >
          {loading ? "Asking George..." : "Ask George"}
        </TooltipButton>
      </div>
      <div className="flex items-center">
        <TooltipButton
          variant="ghost"
          size="smIcon"
          onClick={toggleExplorer}
          tooltip="Toggle Explorer (⌘B)"
        >
          <PanelLeft />
        </TooltipButton>
        <TooltipButton
          variant="ghost"
          size="smIcon"
          onClick={toggleOutput}
          tooltip="Toggle Explorer (⌘J)"
        >
          <PanelBottom />
        </TooltipButton>
        <TooltipButton
          variant="ghost"
          size="smIcon"
          tooltip="Settings (⌘K)"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings />
        </TooltipButton>
      </div>
    </div>
  );
}
