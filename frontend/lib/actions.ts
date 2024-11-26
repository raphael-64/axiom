import { FilesResponse } from "./types";

const askGeorgeUrl =
  "https://student.cs.uwaterloo.ca/~se212/george/ask-george/cgi-bin/george.cgi/check";

export async function askGeorge(body: string) {
  const response = await fetch(askGeorgeUrl, {
    method: "POST",
    headers: {
      "Content-type": "text/plain",
    },
    body,
  });
  return response.text();
}

export async function getFiles() {
  // const files = await fetch(
  //   "https://student.cs.uwaterloo.ca/~se212/files.json"
  // );
  // return await files.json();

  const testData: FilesResponse = [
    {
      name: "Files",
      files: [{ name: "scratchpad.grg", path: "scratchpad.grg" }],
    },
  ];
  return testData;
}

export async function getFile(path: string) {
  const file = await fetch(`https://student.cs.uwaterloo.ca/~se212/${path}`);
  return await file.text();
}
