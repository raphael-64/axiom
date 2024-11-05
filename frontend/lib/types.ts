export type File = {
  name: string;
  path: string;
};

export type FilesResponse = {
  name: string;
  files: File[];
}[];

export type Tab = {
  name: string;
  path: string;
  workspaceId?: string;
};

export type Workspace = {
  id: string;
  project: string;
  createdAt: Date;
  updatedAt: Date;
  users: {
    id: string;
  }[];
  files: {
    path: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    content: string;
    workspaceId: string;
  }[];
  invites: {
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    workspaceId: string;
  }[];
};

export interface Collaborator {
  id: string;
  // Add any other user fields you need
}

export interface Invite {
  id: string;
  userId: string;
  workspaceId: string;
  createdAt: string;
  user: {
    id: string;
    // Add other user fields
  };
}
