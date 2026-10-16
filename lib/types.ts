export interface DocumentFile {
  id: string;
  name: string;
  path: string; // e.g. "PETS/105-25023-4620003289-PET-430-H-0032_0.pdf"
  folder: string; // e.g. "PETS"
  url: string;
  size: number;
  updatedAt: string;
  source: 'blob' | 'local';
}

export interface FolderInfo {
  name: string;
  path: string;
  fileCount: number;
}

export interface FilesResponse {
  currentFolder: string;
  breadcrumbs: { name: string; path: string }[];
  folders: FolderInfo[];
  files: DocumentFile[];
  totalFiles: number;
  totalSize: number;
  isUsingBlob: boolean;
}
