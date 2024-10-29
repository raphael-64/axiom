"use server";

const url =
  "https://student.cs.uwaterloo.ca/~se212/george/ask-george/cgi-bin/george.cgi/check";

export async function askGeorge(body: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-type": "text/plain",
    },
    body,
  });
  return response.text();
}
