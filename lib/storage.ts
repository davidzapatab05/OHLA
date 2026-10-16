import fs from 'fs/promises';
import path from 'path';
import { list, put, del } from '@vercel/blob';
import { DocumentFile, FolderInfo, FilesResponse } from './types';

const STORAGE_DIR = path.join(process.cwd(), 'public', 'storage');

export function hasBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// Ensure the local storage directory exists
async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {
    // Already exists
  }
}

export async function getFilesAndFolders(currentPath: string = ''): Promise<FilesResponse> {
  const normalizedPath = currentPath.replace(/^\/+|\/+$/g, '');
  const breadcrumbs = [
    { name: 'Inicio', path: '' }
  ];

  if (normalizedPath) {
    const parts = normalizedPath.split('/');
    let currentPartPath = '';
    for (const part of parts) {
      currentPartPath = currentPartPath ? `${currentPartPath}/${part}` : part;
      breadcrumbs.push({ name: part, path: currentPartPath });
    }
  }

  // 1. If Vercel Blob is configured and has items
  if (hasBlobConfigured()) {
    try {
      const { blobs } = await list();
      const files: DocumentFile[] = [];
      const folderMap = new Map<string, number>();

      for (const blob of blobs) {
        const fullPath = blob.pathname.replace(/^\/+/, '');
        const segments = fullPath.split('/');
        const fileName = segments[segments.length - 1];
        const fileFolder = segments.slice(0, -1).join('/');

        // Determine if this file is directly inside normalizedPath or in a subfolder
        if (normalizedPath === '' || fileFolder === normalizedPath || fileFolder.startsWith(normalizedPath + '/')) {
          if (fileFolder === normalizedPath) {
            // Direct child file
            files.push({
              id: blob.url,
              name: fileName,
              path: fullPath,
              folder: fileFolder,
              url: blob.url,
              size: blob.size,
              updatedAt: blob.uploadedAt ? new Date(blob.uploadedAt).toISOString() : new Date().toISOString(),
              source: 'blob'
            });
          } else {
            // It's in a subfolder of normalizedPath
            const subPathRelative = normalizedPath ? fileFolder.substring(normalizedPath.length + 1) : fileFolder;
            const directSubfolderName = subPathRelative.split('/')[0];
            const directSubfolderPath = normalizedPath ? `${normalizedPath}/${directSubfolderName}` : directSubfolderName;
            folderMap.set(directSubfolderPath, (folderMap.get(directSubfolderPath) || 0) + 1);
          }
        }
      }

      const folders: FolderInfo[] = Array.from(folderMap.entries()).map(([fPath, count]) => ({
        name: fPath.split('/').pop() || fPath,
        path: fPath,
        fileCount: count
      }));

      // Sort
      folders.sort((a, b) => a.name.localeCompare(b.name));
      files.sort((a, b) => a.name.localeCompare(b.name));

      const totalFiles = blobs.length;
      const totalSize = blobs.reduce((acc, b) => acc + b.size, 0);

      return {
        currentFolder: normalizedPath,
        breadcrumbs,
        folders,
        files,
        totalFiles,
        totalSize,
        isUsingBlob: true
      };
    } catch (err) {
      console.warn('Vercel Blob failed, falling back to local files:', err);
    }
  }

  // 2. Local File System fallback
  await ensureDir(STORAGE_DIR);
  const targetDir = normalizedPath ? path.join(STORAGE_DIR, ...normalizedPath.split('/')) : STORAGE_DIR;
  await ensureDir(targetDir);

  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  const folders: FolderInfo[] = [];
  const files: DocumentFile[] = [];

  for (const entry of entries) {
    const entryFullPath = path.join(targetDir, entry.name);
    const entryRelativePath = normalizedPath ? `${normalizedPath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // Count files inside recursively
      let count = 0;
      try {
        const countFiles = async (dir: string) => {
          const items = await fs.readdir(dir, { withFileTypes: true });
          for (const item of items) {
            if (item.isFile()) count++;
            else if (item.isDirectory()) await countFiles(path.join(dir, item.name));
          }
        };
        await countFiles(entryFullPath);
      } catch {
        // ignore
      }

      folders.push({
        name: entry.name,
        path: entryRelativePath,
        fileCount: count
      });
    } else if (entry.isFile()) {
      const stats = await fs.stat(entryFullPath);
      files.push({
        id: entryRelativePath,
        name: entry.name,
        path: entryRelativePath,
        folder: normalizedPath,
        url: `/storage/${entryRelativePath.split('/').map(encodeURIComponent).join('/')}`,
        size: stats.size,
        updatedAt: stats.mtime.toISOString(),
        source: 'local'
      });
    }
  }

  // Calculate overall total
  let allFilesCount = 0;
  let allFilesSize = 0;
  const calculateTotal = async (dir: string) => {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isFile()) {
          allFilesCount++;
          const st = await fs.stat(full);
          allFilesSize += st.size;
        } else if (item.isDirectory()) {
          await calculateTotal(full);
        }
      }
    } catch {
      // ignore
    }
  };
  await calculateTotal(STORAGE_DIR);

  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return {
    currentFolder: normalizedPath,
    breadcrumbs,
    folders,
    files,
    totalFiles: allFilesCount,
    totalSize: allFilesSize,
    isUsingBlob: false
  };
}

export async function uploadFile(
  folderPath: string,
  fileName: string,
  buffer: Buffer
): Promise<{ success: boolean; url: string; pathname: string }> {
  const cleanFolder = folderPath.replace(/^\/+|\/+$/g, '');
  const cleanFileName = fileName.replace(/[/\\?%*:|"<>]/g, '-');
  const fullPath = cleanFolder ? `${cleanFolder}/${cleanFileName}` : cleanFileName;

  if (hasBlobConfigured()) {
    const blob = await put(fullPath, buffer, {
      access: 'public',
      addRandomSuffix: false // Overwrites if file exists with same name!
    });
    return { success: true, url: blob.url, pathname: blob.pathname };
  }

  // Local fallback
  const targetDir = cleanFolder ? path.join(STORAGE_DIR, ...cleanFolder.split('/')) : STORAGE_DIR;
  await ensureDir(targetDir);
  const targetFile = path.join(targetDir, cleanFileName);

  await fs.writeFile(targetFile, buffer);
  const url = `/storage/${fullPath.split('/').map(encodeURIComponent).join('/')}`;

  return { success: true, url, pathname: fullPath };
}

export async function deleteFile(filePathOrUrl: string): Promise<boolean> {
  if (hasBlobConfigured() && (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://'))) {
    try {
      await del(filePathOrUrl);
      return true;
    } catch (e) {
      console.error('Error deleting blob:', e);
      return false;
    }
  }

  // Local fallback
  try {
    let relative = filePathOrUrl;
    if (relative.startsWith('/storage/')) {
      relative = decodeURIComponent(relative.replace('/storage/', ''));
    }
    const cleanPath = relative.replace(/^\/+|\/+$/g, '');
    const localTarget = path.join(STORAGE_DIR, ...cleanPath.split('/'));
    await fs.unlink(localTarget);
    return true;
  } catch (err) {
    console.error('Error deleting local file:', err);
    return false;
  }
}
