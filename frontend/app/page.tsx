import Editor from "@/components/editor";
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

  return (
    <>
      <EditorDynamic files={files} />
    </>
  );
}
