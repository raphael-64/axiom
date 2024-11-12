import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness.js";
import { MonacoBinding } from "y-monaco";
import type { editor, Range } from "monaco-editor";
import type { Socket } from "socket.io-client";
import { getRandomColor } from "./colors";

// Core interfaces for managing collaboration state
export interface CollaborationState {
  binding: MonacoBinding | null; // Connects Monaco editor to Yjs document
  workspaceDocs: Map<string, Y.Doc>; // Maps file paths to their Yjs documents
}

// Interface defining cursor position and selection data
export interface CursorData {
  position: {
    lineNumber: number;
    column: number;
  };
  selection?: Range; // Optional selection range in the editor
}

/**
 * Sets up real-time collaboration for a specific file in the workspace
 * @param socket - Socket.io connection for real-time communication
 * @param path - File path being collaborated on
 * @param workspaceId - Unique identifier for the workspace
 * @param editor - Monaco editor instance
 * @param model - Text model containing file content
 * @param userId - Current user's identifier
 * @param decorationsCollection - Manages editor decorations (e.g., cursors)
 */
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
  // Join collaboration room for this specific file
  socket.emit("joinRoom", { workspaceId, path });

  // Initialize Yjs document and text type
  const doc = new Y.Doc();
  const ytext = doc.getText("content");

  // Synchronize initial state by:
  // 1. Getting existing document updates
  // 2. Fetching current file content
  const [syncData, fileContent] = await Promise.all([
    new Promise<string>((resolve) => {
      socket.once("sync", (update) => resolve(update));
    }),
    new Promise<string>((resolve) => {
      socket.emit("requestFileContent", { workspaceId, path });
      socket.once("fileContent", ({ content }) => resolve(content));
    }),
  ]);

  // Apply synchronized state to the document
  Y.applyUpdate(doc, Buffer.from(syncData, "base64"));

  // Ensure document content matches server content
  const currentContent = ytext.toString();
  if (currentContent !== fileContent) {
    ytext.delete(0, ytext.length);
    ytext.insert(0, fileContent);
  }

  // Set up awareness protocol for cursor positions and user presence
  const awareness = new awarenessProtocol.Awareness(doc);
  const clientId = socket.id;

  // Initialize local user state with random cursor color
  awareness.setLocalState({
    user: {
      id: clientId,
      name: userId,
      color: getRandomColor(),
      cursor: null,
    },
  });

  // Bind Monaco editor to Yjs document with awareness
  const binding = new MonacoBinding(ytext, model, new Set([editor]), awareness);

  // Handle incoming document updates from other users
  socket.on(`doc-update-${path}`, (update: string) => {
    Y.applyUpdate(doc, Buffer.from(update, "base64"));
  });

  // Broadcast local document changes to other users
  doc.on("update", (update: Uint8Array) => {
    socket.emit("doc-update", {
      workspaceId,
      path,
      update: Buffer.from(update).toString("base64"),
    });
  });

  // Broadcast awareness changes (cursor position, selection) to other users
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

  // Update cursor position in awareness when local user moves cursor
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

/**
 * Cleans up collaboration resources when disconnecting
 * - Disconnects socket
 * - Destroys Yjs documents
 * - Removes Monaco binding
 * - Clears cursor decorations
 * - Removes user style elements
 */
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
