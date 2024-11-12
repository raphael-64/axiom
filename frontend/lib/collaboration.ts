import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness.js";
import { MonacoBinding } from "y-monaco";
import type { editor, Range } from "monaco-editor";
import type { Socket } from "socket.io-client";
import { getRandomColor } from "./colors";

export interface CollaborationState {
  binding: MonacoBinding | null;
  workspaceDocs: Map<string, Y.Doc>;
}

export interface CursorData {
  position: {
    lineNumber: number;
    column: number;
  };
  selection?: Range;
}

export const setupCollaboration = async ({
  socket,
  path,
  workspaceId,
  editor,
  model,
  userId,
  decorationsCollection,
}: {
  socket: Socket;
  path: string;
  workspaceId: string;
  editor: editor.IStandaloneCodeEditor;
  model: editor.ITextModel;
  userId: string;
  decorationsCollection: editor.IEditorDecorationsCollection;
}) => {
  // Join room with specific file path
  socket.emit("joinRoom", { workspaceId, path });

  // Initialize doc
  const doc = new Y.Doc();
  const ytext = doc.getText("content");

  // Request initial content and wait for both sync and content
  const [syncData, fileContent] = await Promise.all([
    new Promise<string>((resolve) => {
      socket.once("sync", (update) => resolve(update));
    }),
    new Promise<string>((resolve) => {
      socket.emit("requestFileContent", { workspaceId, path });
      socket.once("fileContent", ({ content }) => resolve(content));
    }),
  ]);

  // Apply initial state
  Y.applyUpdate(doc, Buffer.from(syncData, "base64"));

  // Double check content matches
  const currentContent = ytext.toString();
  if (currentContent !== fileContent) {
    ytext.delete(0, ytext.length);
    ytext.insert(0, fileContent);
  }

  const awareness = new awarenessProtocol.Awareness(doc);
  const clientId = socket.id;

  awareness.setLocalState({
    user: {
      id: clientId,
      name: userId,
      color: getRandomColor(),
      cursor: null,
    },
  });

  // Update binding with awareness
  const binding = new MonacoBinding(ytext, model, new Set([editor]), awareness);

  // Handle updates
  socket.on(`doc-update-${path}`, (update: string) => {
    Y.applyUpdate(doc, Buffer.from(update, "base64"));
  });

  doc.on("update", (update: Uint8Array) => {
    socket.emit("doc-update", {
      workspaceId,
      path,
      update: Buffer.from(update).toString("base64"),
    });
  });

  awareness.on("change", () => {
    const localState = awareness.getLocalState();
    if (localState) {
      socket.emit("awareness", {
        workspaceId,
        path,
        clientId,
        state: localState,
      });
    }
  });

  // Add cursor position tracking
  editor.onDidChangeCursorPosition((e) => {
    if (awareness.getLocalState()) {
      awareness.setLocalStateField("user", {
        ...awareness.getLocalState()?.user,
        cursor: {
          position: e.position,
          selection: editor.getSelection(),
        },
      });
    }
  });

  return {
    doc,
    binding,
    awareness,
  };
};

export const cleanupCollaboration = ({
  socket,
  workspaceDocs,
  binding,
  decorationsCollection,
}: {
  socket: Socket;
  workspaceDocs: Map<string, Y.Doc>;
  binding: MonacoBinding | null;
  decorationsCollection: editor.IEditorDecorationsCollection | undefined;
}) => {
  socket.disconnect();
  workspaceDocs.forEach((doc) => doc.destroy());
  workspaceDocs.clear();
  binding?.destroy();
  decorationsCollection?.clear();
  document
    .querySelectorAll('[id^="user-"][id$="-style"]')
    .forEach((el) => el.remove());
};
