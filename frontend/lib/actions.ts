"use server";

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

/* 
WORKSPACE ACTIONS
*/

export async function getWorkspaces(userId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/workspaces?userId=${userId}`
  );
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok ? "Workspaces retrieved successfully" : data.message,
    workspaces: response.ok ? data.workspaces : undefined,
  };
}

export async function createWorkspace(userId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/workspaces`,
    {
      method: "PUT",
      body: JSON.stringify({ userId }),
    }
  );
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok ? "Workspace created successfully" : data.message,
    workspaceId: response.ok ? data.workspaceId : undefined,
  };
}

export async function deleteWorkspace(workspaceId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/workspaces`,
    {
      method: "DELETE",
      body: JSON.stringify({ workspaceId }),
    }
  );
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok ? "Workspace deleted successfully" : data.message,
  };
}

export async function inviteToWorkspace(userId: string, workspaceId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/workspaces/invite`,
    {
      method: "POST",
      body: JSON.stringify({ userId, workspaceId }),
    }
  );
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok ? "Invitation sent successfully" : data.message,
    inviteId: response.ok ? data.inviteId : undefined,
  };
}

export async function respondToInvite(inviteId: string, accept: boolean) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/workspaces/invite/accept`,
    {
      method: "POST",
      body: JSON.stringify({ inviteId, accept }),
    }
  );
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok
      ? `Invitation ${accept ? "accepted" : "declined"} successfully`
      : data.message,
  };
}

export async function deleteInvite(inviteId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/workspaces/invite`,
    {
      method: "DELETE",
      body: JSON.stringify({ inviteId }),
    }
  );
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok ? "Invitation deleted successfully" : data.message,
  };
}
export async function removeCollaborator(userId: string, workspaceId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/workspaces/collaborator`,
    {
      method: "DELETE",
      body: JSON.stringify({ userId, workspaceId }),
    }
  );
  const data = await response.json();

  return {
    success: response.ok,
    message: response.ok ? "Collaborator removed successfully" : data.message,
  };
}
