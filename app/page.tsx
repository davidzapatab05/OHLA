'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FolderCard } from '@/components/FolderCard';
import { FileCard } from '@/components/FileCard';
import { QrModal } from '@/components/QrModal';
import { PdfModal } from '@/components/PdfModal';
import { NewFolderModal } from '@/components/NewFolderModal';
import { RenameModal } from '@/components/RenameModal';
import { UploadToast, UploadStatus } from '@/components/UploadToast';
import { FilesResponse, DocumentFile, FolderInfo } from '@/lib/types';
import {
  Search,
  FolderOpen,
  FileText,
  Upload,
  FolderPlus,
  FolderUp,
  Files,
  X,
  ArrowDownToLine,
} from 'lucide-react';

interface FileUploadItem {
  file: File;
  path: string;
}

export default function DocumentPortalPage() {
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [data, setData] = useState<FilesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [viewingPdfFile, setViewingPdfFile] = useState<DocumentFile | null>(null);
  const [replacingTargetFile, setReplacingTargetFile] = useState<DocumentFile | null>(null);

  // Upload feedback state (floating toast like Google Drive)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const dragCounterRef = useRef<number>(0);

  // Hidden native inputs for instant OS file dialogs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState<{
    isOpen: boolean;
    oldPath: string;
    initialName: string;
    isFolder: boolean;
  }>({
    isOpen: false,
    oldPath: '',
    initialName: '',
    isFolder: false,
  });

  // Read initial folder from URL query if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const folderParam = params.get('folder');
      if (folderParam) {
        setCurrentFolder(folderParam);
      }
    }
  }, []);

  const loadFiles = useCallback(async (folder: string, showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch(`/api/files?folder=${encodeURIComponent(folder)}`);
      if (res.ok) {
        const json: FilesResponse = await res.json();
        setData(json);
      } else {
        console.error('Error fetching file list');
      }
    } catch (err) {
      console.error('Error in request:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFiles(currentFolder);
  }, [currentFolder, loadFiles]);

  const handleNavigate = (path: string) => {
    setCurrentFolder(path);
    setSearchQuery('');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (path) {
        url.searchParams.set('folder', path);
      } else {
        url.searchParams.delete('folder');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  // Direct, instant upload execution into the current folder
  const executeUpload = async (items: FileUploadItem[], overrideFileName?: string) => {
    if (!items || items.length === 0) return;

    setUploadStatus({
      isUploading: true,
      progress: 20,
      totalFiles: items.length,
      message: `Subiendo ${items.length} elemento(s) a /${currentFolder || 'Raíz'}...`,
    });

    try {
      const formData = new FormData();
      formData.append('folder', currentFolder);

      if (overrideFileName && items.length === 1) {
        const renamed = new File([items[0].file], overrideFileName, { type: items[0].file.type });
        formData.append('files', renamed);
        formData.append('paths', overrideFileName);
      } else {
        items.forEach((it) => {
          formData.append('files', it.file);
          formData.append('paths', it.path);
        });
      }

      setUploadStatus((prev) => (prev ? { ...prev, progress: 60 } : null));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Fallo en la subida');
      }

      const resData = await res.json();

      setUploadStatus({
        isUploading: false,
        progress: 100,
        totalFiles: items.length,
        message: `✓ ${resData.count || items.length} archivo(s) guardado(s) correctamente`,
        isSuccess: true,
      });

      // Reload directory files
      loadFiles(currentFolder, true);

      // Auto close toast after 4s
      setTimeout(() => {
        setUploadStatus((cur) => (cur?.isSuccess ? null : cur));
      }, 4000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al subir';
      setUploadStatus({
        isUploading: false,
        progress: 0,
        totalFiles: items.length,
        message: errorMsg,
        isError: true,
      });
    }
  };

  // 1. Files picked via OS file dialog
  const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const items: FileUploadItem[] = Array.from(e.target.files).map((f) => ({
        file: f,
        path: f.name,
      }));
      executeUpload(items);
      e.target.value = ''; // Reset input
    }
  };

  // 2. Folder picked via OS folder dialog
  const handleFolderPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const items: FileUploadItem[] = Array.from(e.target.files).map((f) => ({
        file: f,
        path: f.webkitRelativePath || f.name,
      }));
      executeUpload(items);
      e.target.value = ''; // Reset input
    }
  };

  // 3. Replace single file picked
  const handleReplacePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && replacingTargetFile) {
      const file = e.target.files[0];
      executeUpload([{ file, path: file.name }], replacingTargetFile.name);
      setReplacingTargetFile(null);
      e.target.value = '';
    }
  };

  // 4. Drag & Drop on entire window
  const handleWindowDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  };

  const handleWindowDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      setIsDraggingOver(false);
      dragCounterRef.current = 0;
    }
  };

  const handleWindowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleWindowDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    dragCounterRef.current = 0;

    const dtItems = e.dataTransfer.items;
    if (!dtItems || dtItems.length === 0) return;

    const collected: FileUploadItem[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traverse = async (entry: any, prefix = ''): Promise<void> => {
      if (entry.isFile) {
        return new Promise((resolve) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          entry.file((file: File) => {
            collected.push({
              file,
              path: prefix ? `${prefix}/${file.name}` : file.name,
            });
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
        const reader = entry.createReader();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const readBatch = (): Promise<any[]> =>
          new Promise((resolve) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            reader.readEntries((entries: any[]) => resolve(entries));
          });

        let entries;
        do {
          entries = await readBatch();
          for (const ch of entries) {
            await traverse(ch, nextPrefix);
          }
        } while (entries.length > 0);
      }
    };

    const promises = [];
    for (let i = 0; i < dtItems.length; i++) {
      const it = dtItems[i];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = (it as any).webkitGetAsEntry ? (it as any).webkitGetAsEntry() : null;
      if (entry) {
        promises.push(traverse(entry));
      } else {
        const file = it.getAsFile();
        if (file) collected.push({ file, path: file.name });
      }
    }

    await Promise.all(promises);
    if (collected.length > 0) {
      executeUpload(collected);
    }
  };

  // Rename handlers
  const handleOpenRenameFolder = (folder: FolderInfo) => {
    setRenameTarget({
      isOpen: true,
      oldPath: folder.path,
      initialName: folder.name,
      isFolder: true,
    });
  };

  const handleOpenRenameFile = (file: DocumentFile) => {
    setRenameTarget({
      isOpen: true,
      oldPath: file.path,
      initialName: file.name,
      isFolder: false,
    });
  };

  // Filter files by search term
  const filteredFiles = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data.files;

    const q = searchQuery.toLowerCase().trim();
    return data.files.filter((f) => f.name.toLowerCase().includes(q));
  }, [data, searchQuery]);

  // Filter folders by search term
  const filteredFolders = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data.folders;

    const q = searchQuery.toLowerCase().trim();
    return data.folders.filter((folder) => folder.name.toLowerCase().includes(q));
  }, [data, searchQuery]);

  return (
    <div
      onDragEnter={handleWindowDragEnter}
      onDragLeave={handleWindowDragLeave}
      onDragOver={handleWindowDragOver}
      onDrop={handleWindowDrop}
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative select-none"
    >
      {/* Hidden file inputs for direct OS dialogs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFilesPicked}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in modern browsers
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderPicked}
        className="hidden"
      />
      <input
        ref={replaceInputRef}
        type="file"
        onChange={handleReplacePicked}
        className="hidden"
      />

      {/* Full-screen drag overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-blue-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white pointer-events-none animate-in fade-in duration-150">
          <div className="p-5 bg-white/20 rounded-full mb-4 animate-bounce">
            <ArrowDownToLine className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Suelta los archivos o carpetas aquí</h2>
          <p className="text-sm text-blue-100">
            Se subirán directamente a:{' '}
            <strong className="underline underline-offset-4">
              {currentFolder ? `/${currentFolder}` : 'Raíz (/)'}
            </strong>
          </p>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenQr={() => setIsQrOpen(true)}
        onUploadFiles={() => fileInputRef.current?.click()}
        onUploadFolder={() => folderInputRef.current?.click()}
        onNewFolder={() => setIsNewFolderOpen(true)}
        onRefresh={() => loadFiles(currentFolder, true)}
        isRefreshing={isRefreshing}
        totalFiles={data?.totalFiles || 0}
        totalSize={data?.totalSize || 0}
        isUsingBlob={Boolean(data?.isUsingBlob)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Navigation & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <Breadcrumbs
            items={data?.breadcrumbs || [{ name: 'Inicio', path: '' }]}
            onNavigate={handleNavigate}
          />

          {/* Search box */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código o nombre..."
              className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Real Explorer Toolbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* New Folder Button */}
            <button
              onClick={() => setIsNewFolderOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-amber-600" />
              <span>Nueva Carpeta</span>
            </button>

            {/* Direct Upload Files Button (No modal, opens OS dialog directly) */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Files className="w-4 h-4" />
              <span>Subir Archivos</span>
            </button>

            {/* Direct Upload Folder Button (No modal, opens OS folder dialog directly) */}
            <button
              onClick={() => folderInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <FolderUp className="w-4 h-4" />
              <span>Subir Carpeta Completa</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Ubicación actual:{' '}
            <strong className="text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded">
              {currentFolder ? `/${currentFolder}` : 'Raíz (/)'}
            </strong>
          </div>
        </div>

        {/* Explorer Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">Cargando documentos...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Folders Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Carpetas {filteredFolders.length > 0 ? `(${filteredFolders.length})` : ''}
                  </h3>
                </div>
              </div>

              {filteredFolders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredFolders.map((folder) => (
                    <FolderCard
                      key={folder.path}
                      folder={folder}
                      onClick={() => handleNavigate(folder.path)}
                      onRename={handleOpenRenameFolder}
                      onDeleteSuccess={() => loadFiles(currentFolder, true)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white/60 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400">
                    No hay subcarpetas creadas en esta ubicación.{' '}
                    <button
                      onClick={() => setIsNewFolderOpen(true)}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      + Crear una carpeta aquí
                    </button>
                  </p>
                </div>
              )}
            </section>

            {/* Files Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Documentos ({filteredFiles.length})
                  </h3>
                </div>

                {searchQuery && (
                  <span className="text-xs text-slate-500">
                    Filtrado por: <strong className="text-slate-800">"{searchQuery}"</strong>
                  </span>
                )}
              </div>

              {filteredFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onView={(f) => setViewingPdfFile(f)}
                      onRename={handleOpenRenameFile}
                      onReplace={(f) => {
                        setReplacingTargetFile(f);
                        replaceInputRef.current?.click();
                      }}
                      onDeleteSuccess={() => loadFiles(currentFolder, true)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center flex flex-col items-center">
                  <div className="p-3 bg-slate-100 text-slate-400 rounded-full mb-3">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    {searchQuery
                      ? 'No hay archivos que coincidan con la búsqueda'
                      : 'Esta ubicación no tiene archivos'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    {searchQuery
                      ? 'Prueba buscando con otra palabra o revisa la ortografía.'
                      : 'Puedes arrastrar archivos o carpetas directamente desde Windows a esta ventana, o usar los botones de abajo.'}
                  </p>
                  {!searchQuery && (
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                      >
                        <Files className="w-4 h-4" />
                        <span>Subir Archivos</span>
                      </button>
                      <button
                        onClick={() => folderInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                      >
                        <FolderUp className="w-4 h-4" />
                        <span>Subir Carpeta Completa</span>
                      </button>
                      <button
                        onClick={() => setIsNewFolderOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-2xs"
                      >
                        <FolderPlus className="w-4 h-4 text-amber-600" />
                        <span>Nueva Carpeta</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>OHLA © Repositorio de Documentos</p>
      </footer>

      {/* Modals */}
      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        currentFolder={currentFolder}
      />

      <PdfModal
        file={viewingPdfFile}
        onClose={() => setViewingPdfFile(null)}
      />

      <NewFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        currentFolder={currentFolder}
        onSuccess={() => loadFiles(currentFolder, true)}
      />

      <RenameModal
        isOpen={renameTarget.isOpen}
        onClose={() => setRenameTarget((prev) => ({ ...prev, isOpen: false }))}
        oldPath={renameTarget.oldPath}
        initialName={renameTarget.initialName}
        isFolder={renameTarget.isFolder}
        onSuccess={() => loadFiles(currentFolder, true)}
      />

      {/* Floating Upload Progress Toast (like Google Drive) */}
      <UploadToast
        status={uploadStatus}
        onClose={() => setUploadStatus(null)}
      />
    </div>
  );
}
