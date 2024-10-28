export type File = {
  name: string;
  path: string;
};

export type FilesResponse = {
  name: string;
  files: File[];
}[];
