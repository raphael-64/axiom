"use client";

import { FilesResponse } from "@/lib/types";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const EditorDynamic = dynamic(() => import("@/components/editor"), {
  ssr: false,
});

export default function LocalBlock({ files }: { files: FilesResponse }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const watiam = localStorage.getItem("watiam");
    if (!watiam) {
      throw new Error("WatIAM is required to use this application");
    }
    setUserId(watiam);
  }, []);

  if (!userId) return null;

  return (
    <>
      <EditorDynamic files={files} userId={userId} />
    </>
  );
}
