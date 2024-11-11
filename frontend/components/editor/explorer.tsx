import { FilesResponse, Workspace } from "@/lib/types";
import { useMemo, useState, useEffect } from "react";
import { TooltipButton } from "@/components/tooltip-button";
import {
  Download,
  MoreHorizontal,
  Plus,
  RotateCw,
  Trash,
  Upload,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useWorkspaces,
  useCreateWorkspace,
  useDeleteWorkspace,
} from "@/lib/query";
import { toast } from "sonner";
import ConfirmModal from "./confirm";
import { downloadFile } from "@/lib/utils";

const testWorkspaces: FilesResponse = [
  {
    name: "test1",
    files: [
      {
        name: "test1.grg",
        path: "test1.grg",
      },
    ],
  },
  {
    name: "test2",
    files: [
      {
        name: "test2.grg",
        path: "test2.grg",
      },
    ],
  },
];

const MISC_FOLDER: FilesResponse[0] = {
  name: "Miscellaneous",
  files: [
    {
      name: "scratchpad.grg",
      path: "Miscellaneous/scratchpad.grg",
    },
  ],
};

function getStoredFolderState(folderId: string): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(`folder-${folderId}`);
  return stored === "true";
}

export default function Explorer({
  files,
  onFileClick,
  openUpload,
  openAccess,
  userId,
}: {
  files: FilesResponse;
  onFileClick: (
    path: string,
    name: string,
    workspaceId?: string,
    initialContent?: string
  ) => void;
  openUpload: () => void;
  openAccess: (workspaceId: string) => void;
  userId: string;
}) {
  const [createWorkspaceFolder, setCreateWorkspaceFolder] =
    useState<string>("");
  const { data: workspacesData } = useWorkspaces(userId);
  const createWorkspaceMutation = useCreateWorkspace();
  const [createOpen, setCreateOpen] = useState(false);

  const createOptions = useMemo(() => {
    if (!workspacesData?.workspaces) return [];

    const existingProjects = workspacesData.workspaces.map((w) => w.project);
    return files.filter((folder) => !existingProjects.includes(folder.name));
  }, [files, workspacesData]);

  return (
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel defaultSize={60}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="font-semibold text-xs text-muted-foreground">
              Explorer
            </div>
            <TooltipButton
              variant="ghost"
              disabled={files.length === 0}
              size="xsIcon"
              className="!text-muted-foreground"
              tooltip="Upload File (⌘U)"
              onClick={openUpload}
            >
              <Upload className="!size-3" />
            </TooltipButton>
          </div>
          <div className="overflow-y-auto flex-1 text-sm">
            <FolderItem
              key={MISC_FOLDER.name}
              folder={MISC_FOLDER}
              onFileClick={(path, name) => {
                if (path === "Miscellaneous/scratchpad.grg") {
                  const content = localStorage.getItem(path) || "";
                  onFileClick(path, name, undefined, content);
                } else {
                  onFileClick(path, name);
                }
              }}
            />
            {files.map((folder) => (
              <FolderItem
                key={folder.name}
                folder={folder}
                onFileClick={onFileClick}
              />
            ))}
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={40} minSize={10} maxSize={50}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="font-semibold text-xs text-muted-foreground">
              Workspaces
            </div>
            <Popover open={createOpen} onOpenChange={setCreateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="xsIcon"
                  className="!text-muted-foreground"
                  disabled={createOptions.length === 0}
                >
                  <Plus className="!size-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" className="w-48">
                <Select
                  value={createWorkspaceFolder}
                  onValueChange={(value) => setCreateWorkspaceFolder(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {createOptions.map((option) => (
                      <SelectItem key={option.name} value={option.name}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    createWorkspaceMutation.mutate(
                      { userId, assignmentId: createWorkspaceFolder },
                      {
                        onSuccess: (data) => {
                          if (data.success) {
                            toast.success(data.message);
                            setCreateOpen(false);
                          } else {
                            toast.error(data.message);
                          }
                        },
                        onError: () => {
                          toast.error("Failed to create workspace");
                        },
                      }
                    );
                  }}
                  disabled={!createWorkspaceFolder}
                  className="w-full mt-2"
                  size="sm"
                  variant="secondary"
                >
                  <Plus className="!size-3" /> Create Workspace
                </Button>
              </PopoverContent>
            </Popover>
          </div>
          <div className="overflow-y-auto flex-1 text-sm">
            {workspacesData &&
            workspacesData.workspaces &&
            workspacesData.workspaces.length > 0 ? (
              workspacesData.workspaces?.map((workspace) => (
                <FolderItem
                  key={workspace.id}
                  workspace={workspace}
                  onFileClick={onFileClick}
                  openAccess={openAccess}
                />
              ))
            ) : (
              <div className="text-muted-foreground text-xs px-2">
                No workspaces found.
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function FolderItem({
  folder,
  onFileClick,
  workspace,
  openAccess,
}: {
  folder?: FilesResponse[0];
  workspace?: Workspace;
  onFileClick: (
    path: string,
    name: string,
    workspaceId?: string,
    initialContent?: string
  ) => void;
  openAccess?: (workspaceId: string) => void;
}) {
  const folderId = workspace?.id || folder?.name || "";
  const [isOpen, setIsOpen] = useState(() => getStoredFolderState(folderId));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const name = folder ? folder.name : workspace ? workspace.project : "";
  const files = folder
    ? folder.files.map((file) => ({ ...file, id: file.path }))
    : workspace
    ? workspace.files
    : [];
  const deleteWorkspaceMutation = useDeleteWorkspace();

  useEffect(() => {
    if (folderId) {
      localStorage.setItem(`folder-${folderId}`, isOpen.toString());
    }
  }, [isOpen, folderId]);

  const handleDeleteWorkspace = () => {
    if (!workspace) return;

    deleteWorkspaceMutation.mutate(workspace.id, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
      },
      onError: () => {
        toast.error("Failed to delete workspace");
      },
    });
  };

  if (!workspace)
    return (
      <div>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1 hover:bg-muted w-full px-2 h-6 relative ${
            workspace ? "group/workspace" : ""
          }`}
        >
          <span className="w-4 text-xs">{isOpen ? "▼" : "▶"}</span>
          {name}
        </button>

        {isOpen && (
          <>
            {files.map((file) => (
              <File key={file.id} file={file} onFileClick={onFileClick} />
            ))}
          </>
        )}
      </div>
    );

  return (
    <div>
      <ConfirmModal
        open={isConfirmOpen}
        setOpen={setIsConfirmOpen}
        title="Delete Workspace"
        description="Are you sure you want to delete this workspace?"
        onConfirm={handleDeleteWorkspace}
      />
      <ContextMenu onOpenChange={setIsContextMenuOpen}>
        <ContextMenuTrigger asChild>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className={`flex items-center gap-1 hover:bg-muted w-full px-2 h-6 relative ${
              workspace ? "group/workspace" : ""
            } ${isDropdownOpen || isContextMenuOpen ? "bg-muted" : ""}`}
          >
            <span className="w-4 text-xs">{isOpen ? "▼" : "▶"}</span>
            {name}

            <WorkspaceFolderMenu
              isOpen={isDropdownOpen}
              setIsOpen={setIsDropdownOpen}
              openAccess={() => {
                if (workspace) openAccess?.(workspace.id);
              }}
              deleteWorkspace={() => setIsConfirmOpen(true)}
            />
          </button>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => openAccess?.(workspace.id)}>
            <Users className="!w-3 !h-3" /> Share
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setIsConfirmOpen(true)}>
            <Trash className="!w-3 !h-3" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isOpen && (
        <>
          {files.map((file) => (
            <File
              key={file.id}
              file={file}
              onFileClick={onFileClick}
              workspaceId={workspace?.id}
            />
          ))}
        </>
      )}
    </div>
  );
}

function File({
  file,
  onFileClick,
  workspaceId,
}: {
  file: {
    name: string;
    path: string;
  };
  onFileClick: (
    path: string,
    name: string,
    workspaceId?: string,
    initialContent?: string
  ) => void;
  workspaceId?: string;
}) {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleDownload = () => {
    if (workspaceId) {
      // download from backend
    } else {
      downloadFile(file.path);
    }
  };

  return (
    <>
      <ConfirmModal
        open={isResetConfirmOpen}
        setOpen={setIsResetConfirmOpen}
        title="Reset File"
        description="Are you sure you want to reset this file? All changes will be lost."
        onConfirm={() => console.log("reset", file.path)}
      />
      <ContextMenu onOpenChange={setIsContextMenuOpen}>
        <ContextMenuTrigger asChild>
          <button
            onClick={() => onFileClick(file.path, file.name, workspaceId)}
            className={`hover:bg-muted w-full text-left pr-2 pl-7 py-0.5 relative group/file ${
              isContextMenuOpen || isDropdownOpen ? "bg-muted" : ""
            }`}
          >
            {file.name}
            <FileMenu
              path={file.path}
              isOpen={isDropdownOpen}
              setIsOpen={setIsDropdownOpen}
              handleDownload={handleDownload}
            />
          </button>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={handleDownload}>
            <Download className="!w-3 !h-3" /> Download
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setIsResetConfirmOpen(true)}>
            <RotateCw className="!w-3 !h-3" /> Reset
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}

function WorkspaceFolderMenu({
  isOpen,
  setIsOpen,
  openAccess,
  deleteWorkspace,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openAccess: () => void;
  deleteWorkspace: () => void;
}) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div
          tabIndex={0}
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-0 top-0 h-6 w-6 flex group-hover/workspace:visible items-center justify-center ${
            isOpen ? "visible" : "invisible"
          }`}
        >
          <MoreHorizontal className="w-3 h-3" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            openAccess();
          }}
        >
          <Users className="!w-3 !h-3" /> Share
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            deleteWorkspace();
          }}
        >
          <Trash className="!w-3 !h-3" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FileMenu({
  path,
  isOpen,
  setIsOpen,
  handleDownload,
}: {
  path: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  handleDownload: () => void;
}) {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  return (
    <>
      <ConfirmModal
        open={isResetConfirmOpen}
        setOpen={setIsResetConfirmOpen}
        title="Reset File"
        description="Are you sure you want to reset this file? All changes will be lost."
        onConfirm={() => console.log("reset", path)}
      />
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div
            tabIndex={0}
            className={`absolute right-0 top-0 h-6 w-6 flex group-hover/file:visible items-center justify-center ${
              isOpen ? "visible" : "invisible"
            }`}
          >
            <MoreHorizontal className="w-3 h-3" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
          >
            <Download className="!w-3 !h-3" /> Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => setIsResetConfirmOpen(true)}>
            <RotateCw className="!w-3 !h-3" /> Reset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
