"use client";

// React and hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useWindowSize } from "@uidotdev/usehooks";
import { useQuery } from "@tanstack/react-query";

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
import { Bell, PanelBottom, PanelLeft, Settings, X } from "lucide-react";

// Local components
import Explorer from "./explorer";
import SettingsModal from "./settings";
import { UploadModal } from "./upload";
import Tabs from "./tabs";
import ManageAccessModal from "./access";

// Types and utilities
import { FilesResponse, Tab } from "@/lib/types";
import { registerGeorge } from "@/lib/lang";
import { askGeorge, getFiles } from "@/lib/actions";
import { ImperativePanelHandle } from "react-resizable-panels";
import { toast } from "sonner";

// Collaboration
import * as Y from "yjs";
import { Socket, io } from "socket.io-client";

// Update the import to include useFiles
import { useFiles } from "@/lib/query";

const sizes = {
  min: 140,
  default: 180,
};

export default function EditorLayout({ files }: { files: FilesResponse }) {
  const { width } = useWindowSize();

  const { data: filesData } = useFiles(files);

  const explorerRef = useRef<ImperativePanelHandle>(null);
  const outputRef = useRef<ImperativePanelHandle>(null);
  // Editor state
  const [editorRef, setEditorRef] =
    useState<monaco.editor.IStandaloneCodeEditor>();
  const [monacoInstance, setMonacoInstance] = useState<Monaco>();
  const [monacoBinding, setMonacoBinding] = useState<MonacoBinding | null>(
    null
  );

  // Tab state
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);
  const activeId = useMemo(() => {
    if (activeTabIndex >= 0 && openTabs[activeTabIndex]) {
      const workspaceId = openTabs[activeTabIndex].workspaceId;
      return workspaceId ?? openTabs[activeTabIndex].path;
    }
    return undefined;
  }, [activeTabIndex, openTabs]);

  // Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [manageAccessId, setManageAccessId] = useState<string | null>(null);

  // George state
  const [loading, setLoading] = useState(false);
  const [georgeResponse, setGeorgeResponse] = useState<string>("");

  // Collaboration state
  const workspaceDocsRef = useRef<Map<string, Y.Doc>>(new Map());
  const [socket, setSocket] = useState<Socket>();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>();

  // Temporary user ID for testing
  const randomId = Math.floor(Math.random() * 900000 + 100000);
  const [tempUserId, setTempUserId] = useState<string>(
    // `test_watiam_${randomId}`
    "i2dey"
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
    const socket = io("http://localhost:4000", {
      auth: {
        userId: tempUserId,
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
  }, [tempUserId]);

  const handleEditorContent = async (path: string, workspaceId?: string) => {
    if (!editorRef || !monacoInstance) return;

    // Cleanup previous
    monacoBinding?.destroy();

    if (workspaceId) {
      // Prevent multiple workspace connections
      if (activeWorkspaceId && activeWorkspaceId !== workspaceId) {
        toast.error("Close files from other workspace first");
        return;
      }

      // Join room with specific file path
      socket?.emit("joinRoom", { workspaceId, path });

      // Setup model first
      const model = monacoInstance.editor.createModel("", "george");
      editorRef.setModel(model);

      // Initialize doc
      const doc = new Y.Doc();
      const ytext = doc.getText("content");
      workspaceDocsRef.current.set(path, doc);

      // Request initial content and wait for both sync and content
      const [syncData, fileContent] = await Promise.all([
        new Promise<string>((resolve) => {
          socket?.once("sync", (update) => resolve(update));
        }),
        new Promise<string>((resolve) => {
          socket?.emit("requestFileContent", { workspaceId, path });
          socket?.once("fileContent", ({ content }) => resolve(content));
        }),
      ]);

      // Apply initial state
      Y.applyUpdate(doc, Buffer.from(syncData, "base64"));

      // Double check content matches
      const currentContent = ytext.toString();
      if (currentContent !== fileContent) {
        ytext.delete(0, ytext.length);
        ytext.insert(0, fileContent);
      }

      const binding = new MonacoBinding(
        ytext,
        model,
        new Set([editorRef]),
        null
      );
      setMonacoBinding(binding);

      // Handle updates
      socket?.on(`doc-update-${path}`, (update: string) => {
        Y.applyUpdate(doc, Buffer.from(update, "base64"));
      });

      doc.on("update", (update: Uint8Array) => {
        socket?.emit("doc-update", {
          workspaceId,
          path,
          update: Buffer.from(update).toString("base64"),
        });
      });
    } else {
      const content = localStorage.getItem(path) || "";
      const model = monacoInstance.editor.createModel(content, "george");
      editorRef.setModel(model);

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
      if (workspaceId) setActiveWorkspaceId(workspaceId);
      setOpenTabs([...openTabs, { path, name, workspaceId }]);
      setActiveTabIndex(openTabs.length);
    }
  };

  // Clean up when closing tabs
  const handleTabClose = (indexToClose: number) => {
    const closingTab = openTabs[indexToClose];

    setOpenTabs((prevTabs) => {
      const newTabs = prevTabs.filter((_, i) => i !== indexToClose);

      // Clean up workspace doc and connection if needed
      if (closingTab.workspaceId) {
        workspaceDocsRef.current.delete(closingTab.path);
        const hasOtherWorkspaceTabs = newTabs.some(
          (tab) => tab.workspaceId === closingTab.workspaceId
        );
        if (!hasOtherWorkspaceTabs) {
          setActiveWorkspaceId(undefined);
          socket?.emit("leaveRoom", { workspaceId: closingTab.workspaceId });
        }
      }

      // Handle active tab updates
      if (indexToClose === activeTabIndex) {
        const newIndex =
          indexToClose === prevTabs.length - 1
            ? indexToClose - 1
            : indexToClose;
        if (newIndex >= 0 && newTabs[newIndex]) {
          setActiveTabIndex(newIndex);
        } else {
          setActiveTabIndex(-1);
        }
      } else if (indexToClose < activeTabIndex) {
        setActiveTabIndex(activeTabIndex - 1);
      }

      return newTabs;
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      socket?.disconnect();
      workspaceDocsRef.current.forEach((doc) => doc.destroy());
      workspaceDocsRef.current.clear();
      monacoBinding?.destroy();
    };
  }, []);

  useEffect(() => {
    if (activeTabIndex >= 0 && openTabs[activeTabIndex]) {
      const tab = openTabs[activeTabIndex];
      handleEditorContent(tab.path, tab.workspaceId);
    }
  }, [activeId]);

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
        userId={tempUserId}
      />
      <SettingsModal
        open={isSettingsOpen}
        setOpen={setIsSettingsOpen}
        userId={tempUserId}
      />
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
              disabled={loading || activeTabIndex === -1}
            >
              {loading ? "Asking George..." : "Ask George"}
            </TooltipButton>
          </div>
          <div className="flex items-center">
            {socket?.connected ? (
              <div className="relative size-5 p-1 flex items-center justify-center">
                <div className="rounded-full size-2 shrink-0 absolute animate-ping bg-green-500 opacity-75" />
                <div className="rounded-full size-2 shrink-0 bg-green-500" />
              </div>
            ) : (
              <div className="rounded-full size-2 shrink-0 bg-red-500" />
            )}
            <Input
              value={tempUserId}
              placeholder="Temporary User ID"
              onChange={(e) => setTempUserId(e.target.value)}
              className="mx-2"
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
              files={filesData}
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
                      autoClosingBrackets: "always",
                      autoClosingQuotes: "always",
                      autoIndent: "full",
                      formatOnPaste: true,
                      formatOnType: true,
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
