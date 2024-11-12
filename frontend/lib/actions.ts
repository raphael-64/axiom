import { Workspace } from "./types";

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
  const files = await fetch(
    "https://student.cs.uwaterloo.ca/~se212/files.json"
  );
  return await files.json();
}

/* 
WORKSPACE ACTIONS
*/

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getWorkspaces(userId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/workspaces?userId=${userId}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok ? "Workspaces retrieved successfully" : data.message,
    workspaces: response.ok ? (data.workspaces as Workspace[]) : undefined,
  };
}

export async function createWorkspace(userId: string, assignmentId: string) {
  console.log("Creating workspace", userId, assignmentId);
  const response = await fetch(`${API_BASE_URL}/api/workspaces`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, assignmentId }),
  });
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok ? "Workspace created successfully" : data.message,
    workspaceId: response.ok ? data.workspaceId : undefined,
  };
}

export async function deleteWorkspace(workspaceId: string) {
  const response = await fetch(`${API_BASE_URL}/api/workspaces`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ workspaceId }),
  });
  const data = await response.json();

  return {
    success: response.ok,
    message: data.message,
  };
}

export async function inviteToWorkspace(userId: string, workspaceId: string) {
  const response = await fetch(`${API_BASE_URL}/api/workspaces/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, workspaceId }),
  });
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok ? "Invitation sent successfully" : data.message,
    inviteId: response.ok ? data.inviteId : undefined,
  };
}

export async function respondToInvite(inviteId: string, accept: boolean) {
  const response = await fetch(`${API_BASE_URL}/api/workspaces/invite/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inviteId, accept }),
  });
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok
      ? `Invitation ${accept ? "accepted" : "declined"} successfully`
      : data.message,
  };
}

export async function deleteInvite(inviteId: string) {
  const response = await fetch(`${API_BASE_URL}/api/workspaces/invite`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inviteId }),
  });
  const data = await response.json();

  return {
    success: response.ok,
    message: data.message,
  };
}
export async function removeCollaborator(userId: string, workspaceId: string) {
  const response = await fetch(`${API_BASE_URL}/api/workspaces/collaborator`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, workspaceId }),
  });
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok ? "Collaborator removed successfully" : data.message,
  };
}

export const getCollaborators = async (workspaceId: string, userId: string) => {
  const res = await fetch(
    `${API_BASE_URL}/api/workspaces/${workspaceId}/users?userId=${userId}`
  );
  if (!res.ok) throw new Error("Failed to fetch collaborators");
  return res.json();
};

export const getInvites = async (workspaceId: string) => {
  const res = await fetch(
    `${API_BASE_URL}/api/workspaces/${workspaceId}/invites`
  );
  if (!res.ok) throw new Error("Failed to fetch invites");
  return res.json();
};

export const getInvitesForUser = async (userId: string) => {
  const res = await fetch(
    `${API_BASE_URL}/api/workspaces/invites/user/${userId}`
  );
  if (!res.ok) throw new Error("Failed to fetch user invites");
  return res.json();
};

export async function createInvite(userId: string, workspaceId: string) {
  const res = await fetch(`${API_BASE_URL}/api/workspaces/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, workspaceId }),
  });

  if (!res.ok) throw new Error("Failed to create invite");
  return res.json();
}
