"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUploader } from "@/components/ui/file-uploader";
import { useState } from "react";

export function UploadModal({
  open,
  setOpen,
  handleUpload,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleUpload: (files: File[]) => Promise<void>;
}) {
  // const [files, setFiles] = useState<File[]>([]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload</DialogTitle>
          <DialogDescription>
            Warning: This will replace the current file contents.
          </DialogDescription>
        </DialogHeader>
        <FileUploader
          maxFileCount={1}
          accept={{
            ".grg": [],
          }}
          maxSize={1 * 1024 * 1024}
          // onValueChange={setFiles}
          onUpload={handleUpload}
        />
      </DialogContent>
    </Dialog>
  );
}
