import { FilesResponse } from "@/lib/types";
import { useState } from "react";
import { TooltipButton } from "../tooltipButton";
import { Download, MoreHorizontal, RotateCw, Upload } from "lucide-react";
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

export default function Explorer({ files }: { files: FilesResponse }) {
  return (
    <div className="py-2 overflow-y-auto text-sm">
      <div className="flex items-center justify-between mb-1 px-2">
        <div className="font-semibold text-xs text-muted-foreground">
          Explorer
        </div>
        <TooltipButton
          variant="ghost"
          size="xsIcon"
          className="!text-muted-foreground"
          tooltip="Upload File (⌘U)"
        >
          <Upload className="!w-3 !h-3" />
        </TooltipButton>
      </div>
      {files.map((folder) => (
        <FolderItem key={folder.name} folder={folder} />
      ))}
    </div>
  );
}

function FolderItem({ folder }: { folder: FilesResponse[0] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 hover:bg-muted w-full px-2 h-6"
      >
        <span className="w-4 text-xs">{isOpen ? "▼" : "▶"}</span>
        {folder.name}
      </button>

      {isOpen && (
        <>
          {folder.files.map((file) => (
            <File key={file.path} file={file} />
          ))}
        </>
      )}
    </div>
  );
}

function File({
  file,
}: {
  file: {
    name: string;
    path: string;
  };
}) {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <ContextMenu onOpenChange={setIsContextMenuOpen}>
      <ContextMenuTrigger asChild>
        <button
          key={file.path}
          className={`hover:bg-muted w-full text-left pr-2 pl-6 py-0.5 relative group ${
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
          className={`absolute right-0 top-0 h-6 w-6 flex group-hover:visible items-center justify-center ${
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
