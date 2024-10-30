"use client";

import monaco from "monaco-editor";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { PanelBottom, PanelLeft, Settings, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImperativePanelHandle } from "react-resizable-panels";

import { TooltipButton } from "@/components/tooltipButton";
// import useScreenSize from "@/hooks/useScreenSize";
import { useWindowSize } from "@uidotdev/usehooks";
import Explorer from "./explorer";
import { FilesResponse, Tab } from "@/lib/types";
import { BeforeMount, Editor, Monaco, OnMount } from "@monaco-editor/react";
import { registerGeorge } from "@/lib/lang";
import SettingsModal from "./settings";
import { askGeorge } from "@/lib/actions";
import { UploadModal } from "./upload";
import Tabs from "./tabs";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

const sizes = {
  min: 140,
  default: 180,
};

export default function EditorLayout({ files }: { files: FilesResponse }) {
  const { width } = useWindowSize();

  const explorerRef = useRef<ImperativePanelHandle>(null);
  const outputRef = useRef<ImperativePanelHandle>(null);

  const [editorRef, setEditorRef] =
    useState<monaco.editor.IStandaloneCodeEditor>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [georgeResponse, setGeorgeResponse] = useState<string>("");
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);
  const [monacoBinding, setMonacoBinding] = useState<MonacoBinding | null>(
    null
  );
  const ydoc = useRef<Y.Doc>(new Y.Doc());
  const [monacoInstance, setMonacoInstance] = useState<Monaco>();

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
    if (!body || loading) return;

    setLoading(true);
    try {
      const response = await askGeorge(body);
      setGeorgeResponse(response);
      outputRef.current?.expand();
    } catch (error) {
      console.error(error);
      setGeorgeResponse("Error: Failed to get response from George");
    } finally {
      setLoading(false);
    }
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
    if (e.metaKey && e.key === "u") {
      e.preventDefault();
      setIsUploadOpen(true);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleEditorContent = (path: string) => {
    if (!editorRef || !monacoInstance) return;

    // Clean up previous binding
    monacoBinding?.destroy();

    // Get content from localStorage or initialize
    console.log(path);
    const content = localStorage.getItem(path) || "";
    console.log(content);

    // Set up new model and binding
    const model = monacoInstance.editor.createModel(content, "george");
    editorRef.setModel(model);

    // Set up Yjs
    const ytext = ydoc.current.getText(path);
    const provider = new WebsocketProvider(
      "ws://localhost:1234", // Replace with your WebSocket server URL
      path,
      ydoc.current
    );

    const binding = new MonacoBinding(
      ytext,
      model,
      new Set([editorRef]),
      provider.awareness
    );

    setMonacoBinding(binding);

    // Set up change listener for localStorage
    model.onDidChangeContent(() => {
      localStorage.setItem(path, model.getValue());
    });
  };

  const handleFileClick = (path: string, name: string) => {
    const existingIndex = openTabs.findIndex((tab) => tab.path === path);

    if (existingIndex >= 0) {
      setActiveTabIndex(existingIndex);
    } else {
      setOpenTabs([...openTabs, { path, name }]);
      setActiveTabIndex(openTabs.length);
    }
    handleEditorContent(path);
  };

  const handleTabClose = (indexToClose: number) => {
    setOpenTabs((prevTabs) => {
      const newTabs = prevTabs.filter((_, i) => i !== indexToClose);

      // Handle active tab updates after filtering
      if (indexToClose === activeTabIndex) {
        // If closing current tab
        const newIndex =
          indexToClose === prevTabs.length - 1
            ? indexToClose - 1
            : indexToClose;
        if (newIndex >= 0 && newTabs[newIndex]) {
          // Wait for next tick to ensure state is updated
          setTimeout(() => {
            setActiveTabIndex(newIndex);
            handleEditorContent(newTabs[newIndex].path);
          }, 0);
        } else {
          setActiveTabIndex(-1);
        }
      } else if (indexToClose < activeTabIndex) {
        // If closing tab before current tab
        setTimeout(() => {
          setActiveTabIndex(activeTabIndex - 1);
          handleEditorContent(newTabs[activeTabIndex - 1].path);
        }, 0);
      }

      return newTabs;
    });
  };

  useEffect(() => {
    if (activeTabIndex >= 0 && openTabs[activeTabIndex]) {
      handleEditorContent(openTabs[activeTabIndex].path);
    }
  }, [activeTabIndex]);

  useEffect(() => {
    return () => {
      ydoc.current.destroy();
      monacoBinding?.destroy();
    };
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
    setMonacoInstance(monaco);

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
      <UploadModal open={isUploadOpen} setOpen={setIsUploadOpen} />
      <div className="w-full h-full flex flex-col">
        <div className="w-full flex items-center justify-between border-b p-1.5 px-2">
          <div className="flex items-center gap-2">
            <div className="font-semibold">SE212</div>
            <TooltipButton
              variant="secondary"
              size="sm"
              onClick={handleAskGeorge}
              tooltip="Ask George (⌘G)"
              disabled={loading}
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
        <ResizablePanelGroup className="grow" direction="horizontal">
          <ResizablePanel
            ref={explorerRef}
            collapsible
            maxSize={40}
            defaultSize={percentSizes.default}
            minSize={percentSizes.min}
          >
            <Explorer
              files={files}
              onFileClick={handleFileClick}
              openUpload={() => setIsUploadOpen(true)}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={85}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={100}>
                <div
                  className={`flex flex-col w-full h-full ${
                    openTabs.length === 0 ? "invisible" : ""
                  }`}
                >
                  <Tabs
                    tabs={openTabs}
                    activeTabIndex={activeTabIndex}
                    onTabClick={setActiveTabIndex}
                    onTabClose={handleTabClose}
                  />
                  <Editor
                    beforeMount={handleEditorWillMount}
                    onMount={handleEditorMount}
                    className="grow"
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
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel
                ref={outputRef}
                collapsible
                defaultSize={0}
                maxSize={80}
                minSize={40}
              >
                <div
                  className={`p-4 h-full overflow-auto whitespace-pre-wrap font-mono text-sm ${
                    georgeResponse ? "" : "text-muted-foreground"
                  }`}
                >
                  {georgeResponse || "No response."}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
