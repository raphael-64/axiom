import { FilesResponse, Workspace } from "@/lib/types";
import { useState } from "react";
import { TooltipButton } from "@/components/tooltip-button";
import {
  Download,
  MoreHorizontal,
  Plus,
  RotateCw,
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
import { useWorkspaces, useCreateWorkspace } from "@/lib/query";
import { toast } from "sonner";

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

export default function Explorer({
  files,
  onFileClick,
  openUpload,
  openAccess,
  userId,
}: {
  files: FilesResponse;
  onFileClick: (path: string, name: string, workspaceId?: string) => void;
  openUpload: () => void;
  openAccess: (workspaceId: string) => void;
  userId: string;
}) {
  const [createWorkspaceFolder, setCreateWorkspaceFolder] =
    useState<string>("");
  const { data: workspacesData } = useWorkspaces(userId);
  const createWorkspaceMutation = useCreateWorkspace();

  return (
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel defaultSize={75}>
        <div className="py-2 overflow-y-auto text-sm">
          <div className="flex items-center justify-between mb-1 px-2">
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
          {files.map((folder) => (
            <FolderItem
              key={folder.name}
              folder={folder}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={25} minSize={10} maxSize={50}>
        <div className="py-2 overflow-y-auto text-sm">
          <div className="flex items-center justify-between mb-1 px-2">
            <div className="font-semibold text-xs text-muted-foreground">
              Workspaces
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="xsIcon"
                  className="!text-muted-foreground"
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
                    {files.map((option) => (
                      <SelectItem key={option.name} value={option.name}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    createWorkspaceMutation.mutate(userId, {
                      onSuccess: (data) => {
                        if (data.success) {
                          toast.success(data.message);
                        } else {
                          toast.error(data.message);
                        }
                      },
                      onError: () => {
                        toast.error("Failed to create workspace");
                      },
                    });
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
          {/* {testWorkspaces.map((folder: FilesResponse[0]) => ( */}
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
  onFileClick: (path: string, name: string, workspaceId?: string) => void;
  openAccess?: (workspaceId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const name = folder ? folder.name : workspace ? workspace.project : "";
  const files = folder
    ? folder.files.map((file) => ({ ...file, id: file.path }))
    : workspace
    ? workspace.files
    : [];

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
        <div
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (workspace) openAccess?.(workspace.id);
          }}
          className={`absolute right-0 top-0 h-6 w-6 flex group-hover/workspace:visible invisible items-center justify-center`}
        >
          <Users className="w-3 h-3" />
        </div>
      </button>

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
  onFileClick: (path: string, name: string, workspaceId?: string) => void;
  workspaceId?: string;
}) {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
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
          />
        </button>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem>
          <Download className="!w-3 !h-3" /> Download
        </ContextMenuItem>
        <ContextMenuItem>
          <RotateCw className="!w-3 !h-3" /> Reset
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function FileMenu({
  path,
  isOpen,
  setIsOpen,
}: {
  path: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  return (
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
        <DropdownMenuItem>
          <Download className="!w-3 !h-3" /> Download
        </DropdownMenuItem>
        <DropdownMenuItem>
          <RotateCw className="!w-3 !h-3" /> Reset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
