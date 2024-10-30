export type File = {
  name: string;
  path: string;
};

export type FilesResponse = {
  name: string;
  files: File[];
}[];

export interface Tab {
  name: string;
  path: string;
  workspaceId?: string;
}
