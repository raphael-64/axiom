"use client";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { PanelBottom, PanelLeft, Settings } from "lucide-react";
import { useRef } from "react";
import { ImperativePanelHandle } from "react-resizable-panels";

export default function Home() {
  const ref = useRef<ImperativePanelHandle>(null);

  const togglePanel = () => {
    const panel = ref.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-12 w-full flex items-center justify-between border-b p-1 px-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="font-semibold">SE212</div>
          <Button variant="secondary" size="sm">
            Ask George
          </Button>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="smIcon" onClick={togglePanel}>
            <PanelLeft />
          </Button>
          <Button variant="ghost" size="smIcon">
            <PanelBottom />
          </Button>
          <Button variant="ghost" size="smIcon">
            <Settings />
          </Button>
        </div>
      </div>
      <ResizablePanelGroup className="grow" direction="horizontal">
        <ResizablePanel
          ref={ref}
          collapsible
          maxSize={30}
          defaultSize={15}
          minSize={10}
        >
          One
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={85}>Two</ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
