import { FilesResponse } from "@/lib/types";
import { useState } from "react";
import { TooltipButton } from "../tooltipButton";
import { Upload } from "lucide-react";

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
        className="flex items-center gap-1 hover:bg-muted w-full px-2 py-0.5"
      >
        <span className="w-4 text-xs">{isOpen ? "▼" : "▶"}</span>
        {folder.name}
      </button>

      {isOpen && (
        <>
          {folder.files.map((file) => (
            <button
              key={file.path}
              className="hover:bg-muted w-full text-left pr-2 pl-6 py-0.5 relative"
            >
              {file.name}
              <div
                tabIndex={0}
                className="absolute right-0 top-0 w-4 h-4"
              ></div>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
