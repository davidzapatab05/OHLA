'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FolderCard } from '@/components/FolderCard';
import { FileCard } from '@/components/FileCard';
import { QrModal } from '@/components/QrModal';
import { PdfModal } from '@/components/PdfModal';
import { UploadModal } from '@/components/UploadModal';
import { NewFolderModal } from '@/components/NewFolderModal';
import { RenameModal } from '@/components/RenameModal';
import { FilesResponse, DocumentFile, FolderInfo } from '@/lib/types';
import { Search, FolderOpen, FileText, Upload, FolderPlus, X } from 'lucide-react';

export default function DocumentPortalPage() {
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [data, setData] = useState<FilesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [replaceTargetFile, setReplaceTargetFile] = useState<DocumentFile | null>(null);
  const [viewingPdfFile, setViewingPdfFile] = useState<DocumentFile | null>(null);

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

  const handleOpenReplace = (file: DocumentFile) => {
    setReplaceTargetFile(file);
    setIsUploadOpen(true);
  };

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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenQr={() => setIsQrOpen(true)}
        onOpenUpload={() => {
          setReplaceTargetFile(null);
          setIsUploadOpen(true);
        }}
        onNewFolder={() => setIsNewFolderOpen(true)}
        onRefresh={() => loadFiles(currentFolder, true)}
        isRefreshing={isRefreshing}
        totalFiles={data?.totalFiles || 0}
        totalSize={data?.totalSize || 0}
        isUsingBlob={Boolean(data?.isUsingBlob)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Search & Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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

        {/* Content sections */}
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
                <button
                  onClick={() => setIsNewFolderOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50/70 hover:bg-blue-100/70 px-2.5 py-1 rounded-lg transition-colors border border-blue-200"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ Crear Carpeta aquí</span>
                </button>
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
                      Crear una carpeta
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
                      onReplace={handleOpenReplace}
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
                      : 'No hay documentos en esta ubicación'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    {searchQuery
                      ? 'Prueba buscando con otra palabra o revisa la ortografía.'
                      : 'Puedes crear una subcarpeta o subir nuevos archivos directamente.'}
                  </p>
                  {!searchQuery && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsNewFolderOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-2xs"
                      >
                        <FolderPlus className="w-4 h-4 text-amber-600" />
                        <span>Nueva Carpeta</span>
                      </button>
                      <button
                        onClick={() => {
                          setReplaceTargetFile(null);
                          setIsUploadOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Subir Archivo</span>
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

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentFolder={currentFolder}
        replaceTargetName={replaceTargetFile?.name}
        onUploadSuccess={() => loadFiles(currentFolder, true)}
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
    </div>
  );
}
