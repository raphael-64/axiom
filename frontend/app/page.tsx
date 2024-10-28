import Editor from "@/components/editor";
import { FilesResponse } from "@/lib/types";

const getFiles = async () => {
  const files = await fetch(
    "https://student.cs.uwaterloo.ca/~se212/files.json"
  );
  return await files.json();
};

export default async function Home() {
  const files: FilesResponse = await getFiles();

  return (
    <>
      <Editor files={files} />
    </>
  );
}
