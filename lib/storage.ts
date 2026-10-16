import fs from 'fs/promises';
import path from 'path';
import { list, put, del } from '@vercel/blob';
import { DocumentFile, FolderInfo, FilesResponse } from './types';

const STORAGE_DIR = path.join(process.cwd(), 'public', 'storage');

export function getBlobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const [key, value] of Object.entries(process.env)) {
    if (key.includes('BLOB') && key.includes('TOKEN') && value) {
      return value;
    }
  }
  return undefined;
}

export function hasBlobConfigured(): boolean {
  return Boolean(getBlobToken());
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

  // 1. Fetch from Local Storage and Vercel Blob simultaneously to merge
  const filesMap = new Map<string, DocumentFile>();
  const folderMap = new Map<string, number>();
  let isUsingBlob = false;

  // Read local files bundled with deployment (e.g. PETS, PROCEDIMIENTOS)
  try {
    const targetDir = normalizedPath ? path.join(STORAGE_DIR, ...normalizedPath.split('/')) : STORAGE_DIR;
    const entries = await fs.readdir(targetDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === '.keep') continue;
      const entryFullPath = path.join(targetDir, entry.name);
      const entryRelativePath = normalizedPath ? `${normalizedPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        let count = 0;
        try {
          const countFiles = async (dir: string) => {
            const items = await fs.readdir(dir, { withFileTypes: true });
            for (const item of items) {
              if (item.isFile() && item.name !== '.keep') count++;
              else if (item.isDirectory()) await countFiles(path.join(dir, item.name));
            }
          };
          await countFiles(entryFullPath);
        } catch {
          // ignore
        }
        folderMap.set(entryRelativePath, count);
      } else if (entry.isFile()) {
        const stats = await fs.stat(entryFullPath);
        filesMap.set(entryRelativePath, {
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
  } catch {
    // Local directory might not exist for newly created cloud folders
  }

  // 2. Read Vercel Blob files if configured
  const token = getBlobToken();
  if (token) {
    try {
      const { blobs } = await list({ token });
      isUsingBlob = true;

      for (const blob of blobs) {
        const fullPath = blob.pathname.replace(/^\/+/, '');
        if (fullPath.endsWith('/.keep') || fullPath === '.keep') {
          const folderOnly = fullPath.replace(/\/\.keep$/, '');
          if (folderOnly && !folderMap.has(folderOnly)) {
            folderMap.set(folderOnly, 0);
          }
          continue;
        }

        const segments = fullPath.split('/');
        const fileName = segments[segments.length - 1];
        const fileFolder = segments.slice(0, -1).join('/');

        if (normalizedPath === '' || fileFolder === normalizedPath || fileFolder.startsWith(normalizedPath + '/')) {
          if (fileFolder === normalizedPath) {
            filesMap.set(fullPath, {
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
            const subPathRelative = normalizedPath ? fileFolder.substring(normalizedPath.length + 1) : fileFolder;
            const directSubfolderName = subPathRelative.split('/')[0];
            const directSubfolderPath = normalizedPath ? `${normalizedPath}/${directSubfolderName}` : directSubfolderName;
            folderMap.set(directSubfolderPath, (folderMap.get(directSubfolderPath) || 0) + 1);
          }
        }
      }
    } catch (err) {
      console.warn('Vercel Blob failed, using local files:', err);
    }
  }

  const folders: FolderInfo[] = Array.from(folderMap.entries()).map(([fPath, count]) => ({
    name: fPath.split('/').pop() || fPath,
    path: fPath,
    fileCount: count
  }));

  const files = Array.from(filesMap.values());
  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return {
    currentFolder: normalizedPath,
    breadcrumbs,
    folders,
    files,
    totalFiles: files.length,
    totalSize: files.reduce((acc, f) => acc + f.size, 0),
    isUsingBlob
  };
}

export async function createFolder(parentFolder: string, folderName: string): Promise<boolean> {
  const cleanParent = parentFolder.replace(/^\/+|\/+$/g, '');
  const cleanName = folderName.replace(/[/\\?%*:|"<>]/g, '-').trim();
  if (!cleanName) return false;

  const targetPath = cleanParent ? `${cleanParent}/${cleanName}` : cleanName;
  const token = getBlobToken();

  if (token) {
    try {
      await put(`${targetPath}/.keep`, Buffer.from(''), {
        access: 'public',
        addRandomSuffix: false,
        token
      });
      return true;
    } catch {
      await put(`${targetPath}/.keep`, Buffer.from(''), {
        access: 'private',
        addRandomSuffix: false,
        token
      });
      return true;
    }
  }

  // Local storage
  const localTarget = path.join(STORAGE_DIR, ...targetPath.split('/'));
  await ensureDir(localTarget);
  return true;
}

export async function deleteFolder(folderPath: string): Promise<boolean> {
  const cleanPath = folderPath.replace(/^\/+|\/+$/g, '');
  if (!cleanPath) return false;
  const token = getBlobToken();

  if (token) {
    const { blobs } = await list({ token });
    const urlsToDelete = blobs
      .filter((b) => b.pathname.startsWith(`${cleanPath}/`) || b.pathname === cleanPath)
      .map((b) => b.url);
    if (urlsToDelete.length > 0) {
      await del(urlsToDelete, { token });
    }
    return true;
  }

  // Local storage
  try {
    const localTarget = path.join(STORAGE_DIR, ...cleanPath.split('/'));
    await fs.rm(localTarget, { recursive: true, force: true });
    return true;
  } catch (err) {
    console.error('Error deleting folder:', err);
    return false;
  }
}

export async function renameItem(
  oldPath: string,
  newName: string,
  isFolder: boolean
): Promise<boolean> {
  const cleanOld = oldPath.replace(/^\/+|\/+$/g, '');
  const cleanNewName = newName.replace(/[/\\?%*:|"<>]/g, '-').trim();
  if (!cleanOld || !cleanNewName) return false;
  const token = getBlobToken();

  if (token) {
    const { blobs } = await list({ token });
    if (isFolder) {
      const oldPrefix = `${cleanOld}/`;
      const parent = cleanOld.split('/').slice(0, -1).join('/');
      const newPrefix = parent ? `${parent}/${cleanNewName}/` : `${cleanNewName}/`;

      const matches = blobs.filter((b) => b.pathname.startsWith(oldPrefix));
      for (const blob of matches) {
        const newPathname = blob.pathname.replace(oldPrefix, newPrefix);
        const res = await fetch(blob.url);
        const buffer = Buffer.from(await res.arrayBuffer());
        try {
          await put(newPathname, buffer, { access: 'public', addRandomSuffix: false, token });
        } catch {
          await put(newPathname, buffer, { access: 'private', addRandomSuffix: false, token });
        }
        await del(blob.url, { token });
      }
      return true;
    } else {
      const parent = cleanOld.split('/').slice(0, -1).join('/');
      const newPathname = parent ? `${parent}/${cleanNewName}` : cleanNewName;
      const targetBlob = blobs.find((b) => b.pathname === cleanOld);
      if (targetBlob) {
        const res = await fetch(targetBlob.url);
        const buffer = Buffer.from(await res.arrayBuffer());
        try {
          await put(newPathname, buffer, { access: 'public', addRandomSuffix: false, token });
        } catch {
          await put(newPathname, buffer, { access: 'private', addRandomSuffix: false, token });
        }
        await del(targetBlob.url, { token });
        return true;
      }
      return false;
    }
  }

  // Local storage
  try {
    const oldLocal = path.join(STORAGE_DIR, ...cleanOld.split('/'));
    const parentDir = path.dirname(oldLocal);
    const newLocal = path.join(parentDir, cleanNewName);
    await fs.rename(oldLocal, newLocal);
    return true;
  } catch (err) {
    console.error('Error renaming item:', err);
    return false;
  }
}

export async function uploadFile(
  folderPath: string,
  fileName: string,
  buffer: Buffer
): Promise<{ success: boolean; url: string; pathname: string }> {
  const cleanFolder = folderPath.replace(/^\/+|\/+$/g, '');
  const cleanFileName = fileName.replace(/[/\\?%*:|"<>]/g, '-');
  const fullPath = cleanFolder ? `${cleanFolder}/${cleanFileName}` : cleanFileName;
  const token = getBlobToken();

  if (token) {
    try {
      const blob = await put(fullPath, buffer, {
        access: 'public',
        addRandomSuffix: false,
        token
      });
      return { success: true, url: blob.url, pathname: blob.pathname };
    } catch (err: any) {
      if (
        err?.message?.includes('private') ||
        err?.message?.includes('Access denied') ||
        err?.message?.includes('store does not allow')
      ) {
        const blob = await put(fullPath, buffer, {
          access: 'private',
          addRandomSuffix: false,
          token
        });
        return { success: true, url: blob.url, pathname: blob.pathname };
      }
      throw err;
    }
  }

  // If running on Vercel without Blob configured
  if (process.env.VERCEL === '1') {
    throw new Error('BLOB_NOT_CONFIGURED: Debes activar Vercel Blob en la pestaña Storage del panel de Vercel.');
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
  const token = getBlobToken();
  if (token && (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://'))) {
    try {
      await del(filePathOrUrl, { token });
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
