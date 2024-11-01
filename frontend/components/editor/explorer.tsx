import { FilesResponse } from "@/lib/types";
import { useState } from "react";
import { TooltipButton } from "../tooltipButton";
import {
  Download,
  Files,
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
} from "../ui/resizable";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}: {
  files: FilesResponse;
  onFileClick: (path: string, name: string) => void;
  openUpload: () => void;
  openAccess: (workspaceId: string) => void;
}) {
  const handleCreateWorkspace = () => {};

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
                <Select>
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
                  onClick={handleCreateWorkspace}
                  className="w-full mt-2"
                  size="sm"
                  variant="secondary"
                >
                  <Plus className="!size-3" /> Create Workspace
                </Button>
              </PopoverContent>
            </Popover>
          </div>
          {testWorkspaces.map((folder) => (
            <FolderItem
              key={folder.name}
              folder={folder}
              onFileClick={onFileClick}
              isWorkspace
              openAccess={openAccess}
            />
          ))}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function FolderItem({
  folder,
  onFileClick,
  isWorkspace,
  openAccess,
}: {
  folder: FilesResponse[0];
  onFileClick: (path: string, name: string) => void;
  isWorkspace?: boolean;
  openAccess?: (workspaceId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1 hover:bg-muted w-full px-2 h-6 relative ${
          isWorkspace ? "group/workspace" : ""
        }`}
      >
        <span className="w-4 text-xs">{isOpen ? "▼" : "▶"}</span>
        {folder.name}
        <div
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (isWorkspace) openAccess?.(folder.name);
          }}
          className={`absolute right-0 top-0 h-6 w-6 flex group-hover/workspace:visible invisible items-center justify-center`}
        >
          <Users className="w-3 h-3" />
        </div>
      </button>

      {isOpen && (
        <>
          {folder.files.map((file) => (
            <File key={file.path} file={file} onFileClick={onFileClick} />
          ))}
        </>
      )}
    </div>
  );
}

function File({
  file,
  onFileClick,
}: {
  file: {
    name: string;
    path: string;
  };
  onFileClick: (path: string, name: string) => void;
}) {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <ContextMenu onOpenChange={setIsContextMenuOpen}>
      <ContextMenuTrigger asChild>
        <button
          onClick={() => onFileClick(file.path, file.name)}
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
