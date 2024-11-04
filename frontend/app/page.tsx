import { FilesResponse } from "@/lib/types";
import dynamic from "next/dynamic";

const getFiles = async () => {
  const files = await fetch(
    "https://student.cs.uwaterloo.ca/~se212/files.json"
  );
  return await files.json();
};

const EditorDynamic = dynamic(() => import("@/components/editor"), {
  ssr: false,
});

export default async function Home() {
  const files: FilesResponse = await getFiles();

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!serverUrl) return null;

  return (
    <>
      <EditorDynamic files={files} />
    </>
  );
}
