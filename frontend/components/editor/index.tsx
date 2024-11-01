"use client";

// React and hooks
import { useEffect, useRef, useState } from "react";
import { useWindowSize } from "@uidotdev/usehooks";

// Monaco editor
import monaco from "monaco-editor";
import { BeforeMount, Editor, Monaco, OnMount } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";

// UI Components
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TooltipButton } from "@/components/tooltip-button";
import { Input } from "@/components/ui/input";
import { PanelBottom, PanelLeft, Settings, X } from "lucide-react";

// Local components
import Explorer from "./explorer";
import SettingsModal from "./settings";
import { UploadModal } from "./upload";
import Tabs from "./tabs";
import ManageAccessModal from "./access";

// Types and utilities
import { FilesResponse, Tab } from "@/lib/types";
import { registerGeorge } from "@/lib/lang";
import { askGeorge } from "@/lib/actions";
import { ImperativePanelHandle } from "react-resizable-panels";
import { toast } from "sonner";

// Collaboration
import * as Y from "yjs";
import { Socket, io } from "socket.io-client";

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
  const [manageAccessId, setManageAccessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [georgeResponse, setGeorgeResponse] = useState<string>("");
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);
  const [monacoBinding, setMonacoBinding] = useState<MonacoBinding | null>(
    null
  );
  const ydoc = useRef<Y.Doc>(new Y.Doc());
  const [monacoInstance, setMonacoInstance] = useState<Monaco>();
  const [socket, setSocket] = useState<Socket>();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>();
  const workspaceDocsRef = useRef<Map<string, Y.Doc>>(new Map());

  const randomId = Math.floor(Math.random() * 900000 + 100000);
  const [tempUserId, setTempUserId] = useState<string>(
    `test_watiam_${randomId}`
  );

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

  // Initialize socket connection
  useEffect(() => {
    const socket = io("http://localhost:3001", {
      auth: {
        userId: "user-id-here", // Get this from your auth system
      },
    });

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("error", (error: string) => {
      toast.error(error);
    });

    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleEditorContent = (path: string, workspaceId?: string) => {
    if (!editorRef || !monacoInstance) return;

    // Clean up previous binding
    monacoBinding?.destroy();

    if (workspaceId) {
      // Collaborative workspace file
      let doc = workspaceDocsRef.current.get(path);
      if (!doc) {
        doc = new Y.Doc();
        workspaceDocsRef.current.set(path, doc);
      }

      const ytext = doc.getText("content");

      // Connect to room
      socket?.emit("joinRoom", { workspaceId, path });

      const model = monacoInstance.editor.createModel("", "george");
      editorRef.setModel(model);

      const binding = new MonacoBinding(
        ytext,
        model,
        new Set([editorRef]),
        null
      );

      setMonacoBinding(binding);

      // Handle updates from server
      socket?.on(`doc-update-${path}`, (update: Uint8Array) => {
        Y.applyUpdate(doc, update);
      });

      // Send updates to server
      doc.on("update", (update: Uint8Array) => {
        socket?.emit("doc-update", { workspaceId, path, update });
      });
    } else {
      // Local file
      const content = localStorage.getItem(path) || "";
      const model = monacoInstance.editor.createModel(content, "george");
      editorRef.setModel(model);

      // Set up change listener for localStorage
      model.onDidChangeContent(() => {
        localStorage.setItem(path, model.getValue());
      });
    }
  };

  const handleFileClick = (
    path: string,
    name: string,
    workspaceId?: string
  ) => {
    // Check if trying to open file from different workspace
    if (workspaceId && activeWorkspaceId && workspaceId !== activeWorkspaceId) {
      toast.error("Another workspace is already open.");
      return;
    }

    const existingIndex = openTabs.findIndex((tab) => tab.path === path);

    if (existingIndex >= 0) {
      setActiveTabIndex(existingIndex);
    } else {
      if (workspaceId) {
        setActiveWorkspaceId(workspaceId);
      }
      setOpenTabs([...openTabs, { path, name, workspaceId }]);
      setActiveTabIndex(openTabs.length);
    }
    handleEditorContent(path, workspaceId);
  };

  // Clean up when closing tabs
  const handleTabClose = (indexToClose: number) => {
    const closingTab = openTabs[indexToClose];

    setOpenTabs((prevTabs) => {
      const newTabs = prevTabs.filter((_, i) => i !== indexToClose);

      // If closing last workspace tab, clean up workspace
      if (closingTab.workspaceId) {
        const hasOtherWorkspaceTabs = newTabs.some(
          (tab) => tab.workspaceId === closingTab.workspaceId
        );
        if (!hasOtherWorkspaceTabs) {
          setActiveWorkspaceId(undefined);
          socket?.disconnect();
          workspaceDocsRef.current.delete(closingTab.path);
        }
      }

      // Handle active tab updates
      if (indexToClose === activeTabIndex) {
        const newIndex =
          indexToClose === prevTabs.length - 1
            ? indexToClose - 1
            : indexToClose;
        if (newIndex >= 0 && newTabs[newIndex]) {
          setTimeout(() => {
            setActiveTabIndex(newIndex);
            handleEditorContent(
              newTabs[newIndex].path,
              newTabs[newIndex].workspaceId
            );
          }, 0);
        } else {
          setActiveTabIndex(-1);
        }
      } else if (indexToClose < activeTabIndex) {
        setTimeout(() => {
          setActiveTabIndex(activeTabIndex - 1);
          const tab = newTabs[activeTabIndex - 1];
          handleEditorContent(tab.path, tab.workspaceId);
        }, 0);
      }

      return newTabs;
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket?.connected) {
        socket.disconnect();
      }
      workspaceDocsRef.current.clear();
      monacoBinding?.destroy();
    };
  }, []);

  useEffect(() => {
    if (activeTabIndex >= 0 && openTabs[activeTabIndex]) {
      handleEditorContent(openTabs[activeTabIndex].path);
    }
  }, [activeTabIndex]);

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
      <ManageAccessModal
        open={!!manageAccessId}
        setOpen={(open) => setManageAccessId(open ? manageAccessId : null)}
        workspaceId={manageAccessId}
      />
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
            <Input
              value={tempUserId}
              placeholder="Temporary User ID"
              onChange={(e) => setTempUserId(e.target.value)}
            />
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
              userId={tempUserId}
              files={files}
              onFileClick={handleFileClick}
              openUpload={() => setIsUploadOpen(true)}
              openAccess={(workspaceId) => setManageAccessId(workspaceId)}
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
