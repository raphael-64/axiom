"use client";

// React and hooks
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// Local components
import Explorer from "./explorer";
import SettingsModal from "./settings";
import { UploadModal } from "./upload";
import Tabs from "./tabs";
import Toolbar from "./toolbar";

// Types and utilities
import { FilesResponse, Tab } from "@/lib/types";
import { registerGeorge } from "@/lib/lang";
import { askGeorge } from "@/lib/actions";
import { ImperativePanelHandle } from "react-resizable-panels";
import { toast } from "sonner";

// Update the import to include useFiles
import { useFiles } from "@/lib/query";
import { useTheme } from "next-themes";

// Add import at the top
import { darkThemeOld, lightThemeOld } from "@/lib/colors";

import { useColorTheme } from "@/components/providers/color-context";

const sizes = {
  min: 140,
  default: 180,
};

export default function EditorLayout({ files }: { files: FilesResponse }) {
  const { width } = useWindowSize();

  const colorTheme = useColorTheme();
  const darkTheme = colorTheme?.darkTheme;
  const lightTheme = colorTheme?.lightTheme;

  const {
    data: filesData,
    error: filesError,
    refetch: refetchFiles,
  } = useFiles(files);

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
      openTabs[activeTabIndex].path;
    }
    return undefined;
  }, [activeTabIndex, openTabs]);

  // Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // George state
  const [loading, setLoading] = useState(false);
  const [georgeResponse, setGeorgeResponse] = useState<string>("");

  const [decorationsCollection, setDecorationsCollection] =
    useState<monaco.editor.IEditorDecorationsCollection>();

  const [autoComplete, setAutoComplete] = useState(() => {
    const saved = localStorage.getItem("autoComplete");
    return saved !== null ? saved === "true" : true;
  });

  const [acceptSuggestionOnEnter, setAcceptSuggestionOnEnter] = useState(() => {
    const saved = localStorage.getItem("acceptSuggestionOnEnter");
    return saved !== null ? saved === "true" : true;
  });

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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Modern way to detect platform using userAgentData
      const isMac =
        "userAgentData" in navigator
          ? (navigator.userAgentData as any)?.platform
              ?.toLowerCase()
              .includes("mac")
          : /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);

      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === "g") {
        e.preventDefault();
        handleAskGeorge();
      }
      if (cmdOrCtrl && e.key === "b") {
        e.preventDefault();
        toggleExplorer();
      }
      if (cmdOrCtrl && e.key === "j") {
        e.preventDefault();
        toggleOutput();
      }
      if (cmdOrCtrl && e.key === "k") {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
      if (cmdOrCtrl && e.key === "u") {
        e.preventDefault();
        setIsUploadOpen(true);
      }
    },
    [
      handleAskGeorge,
      toggleExplorer,
      toggleOutput,
      setIsSettingsOpen,
      setIsUploadOpen,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  const handleEditorContent = async (path: string) => {
    if (!editorRef || !monacoInstance) return;

    // Cleanup previous
    monacoBinding?.destroy();

    // Local file
    const content = localStorage.getItem(path) || "";
    const model = monacoInstance.editor.createModel(content, "george");
    editorRef.setModel(model);

    model.onDidChangeContent(() => {
      localStorage.setItem(path, model.getValue());
    });
  };

  const handleFileClick = async (path: string, name: string) => {
    const existingIndex = openTabs.findIndex((tab) => tab.path === path);

    if (existingIndex >= 0) {
      setActiveTabIndex(existingIndex);
    } else {
      setOpenTabs((prev) => [...prev, { path, name }]);
      setActiveTabIndex(openTabs.length);
    }
  };

  // Clean up when closing tabs
  const handleTabClose = (indexToClose: number) => {
    const closingTab = openTabs[indexToClose];

    // Clean up decorations for this tab
    decorationsCollection?.clear();

    setOpenTabs((prevTabs) => {
      const newTabs = prevTabs.filter((_, i) => i !== indexToClose);

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

  useEffect(() => {
    if (activeTabIndex >= 0 && openTabs[activeTabIndex]) {
      const tab = openTabs[activeTabIndex];
      handleEditorContent(tab.path);
    }
  }, [activeTabIndex, openTabs, activeId]);

  useEffect(() => {
    if (editorRef) {
      editorRef.updateOptions({
        quickSuggestions: autoComplete,
        suggestOnTriggerCharacters: autoComplete,
        parameterHints: { enabled: autoComplete },
        acceptSuggestionOnEnter: acceptSuggestionOnEnter ? "on" : "off",
      });
    }
  }, [autoComplete, acceptSuggestionOnEnter]);

  const handleUpload = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file || !editorRef) return;

      setIsUploadOpen(false);

      const content = await file.text();
      const model = editorRef.getModel();
      if (model) {
        model.setValue(content);
      }
    },
    [editorRef]
  );

  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!monacoInstance) return;
    console.log("Updating Monaco theme from editor");
    monacoInstance.editor.defineTheme(
      "dark",
      darkTheme ? darkTheme : darkThemeOld
    );
    monacoInstance.editor.defineTheme(
      "light",
      lightTheme ? lightTheme : lightThemeOld
    );
    monacoInstance.editor.setTheme(resolvedTheme === "dark" ? "dark" : "light");
  }, [monacoInstance, resolvedTheme, darkTheme, lightTheme]);

  useEffect(() => {
    if (filesError) {
      toast.error("Error fetching files", {
        action: {
          label: "Retry",
          onClick: () => {
            refetchFiles();
          },
        },
      });
    }
  }, [filesError]);

  if (!width) return null;

  const percentSizes = {
    min: (sizes.min / width) * 100,
    default: (sizes.default / width) * 100,
  };

  const handleEditorWillMount: BeforeMount = (monaco) => {
    // Remove all keybindings we want to handle globally
    monaco.editor.addKeybindingRules([
      {
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG,
        command: null,
      },
      {
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB,
        command: null,
      },
      {
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ,
        command: null,
      },
      {
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
        command: null,
      },
      {
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyU,
        command: null,
      },
    ]);
  };

  const handleEditorMount: OnMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    setEditorRef(editor);
    setMonacoInstance(monaco);

    monaco.editor.setTheme("dark");

    registerGeorge(editor, monaco);
    monaco.editor.setModelLanguage(editor.getModel()!, "george");

    const decorationsCollection = editor.createDecorationsCollection();
    setDecorationsCollection(decorationsCollection);

    editor.updateOptions({
      quickSuggestions: autoComplete,
      suggestOnTriggerCharacters: autoComplete,
      parameterHints: { enabled: autoComplete },
    });
  };

  return (
    <>
      <SettingsModal
        open={isSettingsOpen}
        setOpen={setIsSettingsOpen}
        autoComplete={autoComplete}
        setAutoComplete={setAutoComplete}
        acceptSuggestionOnEnter={acceptSuggestionOnEnter}
        setAcceptSuggestionOnEnter={setAcceptSuggestionOnEnter}
      />
      <UploadModal
        open={isUploadOpen}
        setOpen={setIsUploadOpen}
        handleUpload={handleUpload}
      />
      <div className="w-full h-full flex flex-col">
        <Toolbar
          loading={loading}
          activeTabIndex={activeTabIndex}
          handleAskGeorge={handleAskGeorge}
          toggleExplorer={toggleExplorer}
          toggleOutput={toggleOutput}
          setIsSettingsOpen={setIsSettingsOpen}
        />
        <ResizablePanelGroup
          className="grow"
          direction="horizontal"
          autoSaveId="explorer-editor"
        >
          <ResizablePanel
            ref={explorerRef}
            collapsible
            maxSize={40}
            defaultSize={percentSizes.default}
            minSize={percentSizes.min}
          >
            <Explorer
              files={filesData}
              onFileClick={handleFileClick}
              openUpload={() => setIsUploadOpen(true)}
              disableUpload={activeTabIndex === -1}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={85}>
            <ResizablePanelGroup
              direction="vertical"
              autoSaveId="editor-output"
            >
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
                      scrollBeyondLastLine: true,
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
                minSize={20}
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
