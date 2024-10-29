"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { PanelBottom, PanelLeft, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImperativePanelHandle } from "react-resizable-panels";

import { TooltipButton } from "@/components/tooltipButton";
// import useScreenSize from "@/hooks/useScreenSize";
import { useWindowSize } from "@uidotdev/usehooks";
import Explorer from "./explorer";
import { FilesResponse } from "@/lib/types";
import { BeforeMount, Editor, Monaco, OnMount } from "@monaco-editor/react";
import monaco from "monaco-editor";
import { registerGeorge } from "@/lib/lang";
import SettingsModal from "./settings";
import { askGeorge } from "@/lib/actions";

const sizes = {
  min: 100,
  default: 150,
};

export default function EditorLayout({ files }: { files: FilesResponse }) {
  const { width } = useWindowSize();

  const explorerRef = useRef<ImperativePanelHandle>(null);
  const outputRef = useRef<ImperativePanelHandle>(null);

  const [editorRef, setEditorRef] =
    useState<monaco.editor.IStandaloneCodeEditor>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleExplorer = () => {
    const panel = explorerRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };
  const toggleOutput = () => {
    const panel = outputRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const handleAskGeorge = async () => {
    const body = editorRef?.getModel()?.getValue();
    console.log("ask george\n\n" + body);
    if (!body) return;
    const response = await askGeorge(body);
    console.log(response);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey && e.key === "g") {
      e.preventDefault();
      handleAskGeorge();
    }
    if (e.metaKey && e.key === "b") {
      e.preventDefault();
      toggleExplorer();
    }
    if (e.metaKey && e.key === "j") {
      e.preventDefault();
      toggleOutput();
    }
    if (e.metaKey && e.key === "k") {
      e.preventDefault();
      setIsSettingsOpen(true);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!width) return null;

  const percentSizes = {
    min: (sizes.min / width) * 100,
    default: (sizes.default / width) * 100,
  };

  const handleEditorWillMount: BeforeMount = (monaco) => {
    // monaco.editor.addKeybindingRules([
    //   {
    //     keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG,
    //     command: "null",
    //   },
    // ]);
  };

  const handleEditorMount: OnMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    setEditorRef(editor);

    monaco.editor.defineTheme("dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0A0A0A",
      },
    });

    monaco.editor.setTheme("dark");

    registerGeorge(editor, monaco);
    monaco.editor.setModelLanguage(editor.getModel()!, "george");

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      setIsSettingsOpen(true);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
      handleAskGeorge();
    });
  };

  return (
    <>
      <SettingsModal open={isSettingsOpen} setOpen={setIsSettingsOpen} />
      <div className="w-full h-full flex flex-col">
        <div className="w-full flex items-center justify-between border-b p-1.5 px-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="font-semibold">SE212</div>
            <TooltipButton
              variant="secondary"
              size="sm"
              onClick={handleAskGeorge}
              tooltip="Ask George (⌘G)"
            >
              Ask George
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
        <ResizablePanelGroup className="grow" direction="horizontal">
          <ResizablePanel
            ref={explorerRef}
            collapsible
            maxSize={40}
            defaultSize={percentSizes.default}
            minSize={percentSizes.min}
          >
            <Explorer files={files} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={85}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={100}>
                <Editor
                  beforeMount={handleEditorWillMount}
                  onMount={handleEditorMount}
                  className="w-full h-full"
                  theme="vs-dark"
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    padding: {
                      bottom: 4,
                      top: 4,
                    },
                    scrollBeyondLastLine: false,
                    fixedOverflowWidgets: true,
                    // lineDecorationsWidth: 0,
                  }}
                />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel
                ref={outputRef}
                collapsible
                defaultSize={0}
                maxSize={50}
                minSize={10}
              >
                Output
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
