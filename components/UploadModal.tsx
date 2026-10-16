'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FolderUp, FileText, CheckCircle2, AlertCircle, Loader2, Files } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolder: string;
  onUploadSuccess: () => void;
  replaceTargetName?: string | null;
}

interface FileItem {
  file: File;
  path: string; // relative path within folder upload, e.g. "Carpeta/sub/archivo.pdf"
}

export function UploadModal({
  isOpen,
  onClose,
  currentFolder,
  onUploadSuccess,
  replaceTargetName,
}: UploadModalProps) {
  const [selectedItems, setSelectedItems] = useState<FileItem[]>([]);
  const [targetFolder, setTargetFolder] = useState<string>(currentFolder);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTargetFolder(currentFolder);
    setSelectedItems([]);
    setError(null);
    setSuccessMsg(null);
    setUploadProgress(0);
  }, [currentFolder, isOpen, replaceTargetName]);

  if (!isOpen) return null;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: FileItem[] = Array.from(e.target.files).map((file) => ({
        file,
        path: file.name,
      }));
      setSelectedItems(newItems);
      setError(null);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: FileItem[] = Array.from(e.target.files).map((file) => {
        // webkitRelativePath contains "FolderName/sub/doc.pdf"
        const relPath = file.webkitRelativePath || file.name;
        return {
          file,
          path: relPath,
        };
      });
      setSelectedItems(newItems);
      setError(null);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError(null);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    const collected: FileItem[] = [];

    // Helper to read entries recursively
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traverseEntry = async (entry: any, prefix = ''): Promise<void> => {
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
        const dirReader = entry.createReader();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const readEntries = (): Promise<any[]> =>
          new Promise((resolve) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dirReader.readEntries((entries: any[]) => resolve(entries));
          });

        let entries;
        do {
          entries = await readEntries();
          for (const child of entries) {
            await traverseEntry(child, nextPrefix);
          }
        } while (entries.length > 0);
      }
    };

    const promises = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
      if (entry) {
        promises.push(traverseEntry(entry));
      } else {
        const file = item.getAsFile();
        if (file) collected.push({ file, path: file.name });
      }
    }

    await Promise.all(promises);
    setSelectedItems(collected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError('Por favor selecciona archivos o una carpeta para subir.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('folder', targetFolder);

      // If replacing a single file with specific name
      if (replaceTargetName && selectedItems.length === 1) {
        const item = selectedItems[0];
        const renamed = new File([item.file], replaceTargetName, { type: item.file.type });
        formData.append('files', renamed);
        formData.append('paths', replaceTargetName);
      } else {
        selectedItems.forEach((item) => {
          formData.append('files', item.file);
          formData.append('paths', item.path);
        });
      }

      setUploadProgress(40);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al procesar la subida');
      }

      const result = await res.json();
      setUploadProgress(100);
      setSuccessMsg(`¡${result.count || selectedItems.length} archivo(s) subido(s) con éxito!`);

      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado al subir');
    } finally {
      setIsUploading(false);
    }
  };

  const totalBytes = selectedItems.reduce((acc, item) => acc + item.file.size, 0);
  const formattedTotalSize = (totalBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {replaceTargetName ? 'Reemplazar Archivo' : 'Subir Archivos o Carpeta'}
              </h3>
              <p className="text-xs text-slate-500">
                Destino: <strong className="text-slate-800">{targetFolder ? `/${targetFolder}` : 'Raíz (/)'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {replaceTargetName && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs">
              <span className="font-semibold block mb-0.5">Vas a reemplazar este archivo:</span>
              <span className="font-mono bg-amber-100/60 px-1.5 py-0.5 rounded text-amber-900">
                {replaceTargetName}
              </span>
              <p className="mt-1 text-amber-700">
                El archivo anterior se sobreescribirá con la nueva versión manteniendo el mismo enlace.
              </p>
            </div>
          )}

          {/* Folder Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ubicación de destino
            </label>
            <input
              type="text"
              value={targetFolder}
              onChange={(e) => setTargetFolder(e.target.value)}
              placeholder="Vacío para la Raíz (/), o escribe la ruta de una carpeta"
              className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {targetFolder ? `Se guardará en: /${targetFolder}` : 'Se guardará directamente en la Raíz del explorador'}
            </span>
          </div>

          {/* File selector buttons */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFilesChange}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error webkitdirectory is standard in modern browsers
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Files className="w-4 h-4 text-blue-600" />
              <span>Seleccionar Archivos</span>
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <FolderUp className="w-4 h-4 text-amber-600" />
              <span>Seleccionar Carpeta Completa</span>
            </button>
          </div>

          {/* Drag & Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              selectedItems.length > 0
                ? 'border-blue-500 bg-blue-50/40'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            {selectedItems.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-full mb-2">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {selectedItems.length} {selectedItems.length === 1 ? 'archivo preparado' : 'archivos preparados'}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">
                  Tamaño total: {formattedTotalSize} MB
                </span>

                {/* Preview sample of items */}
                <div className="mt-2 max-h-28 overflow-y-auto w-full bg-white rounded-lg border border-slate-200 p-2 text-left">
                  {selectedItems.slice(0, 10).map((it, idx) => (
                    <div key={idx} className="text-[11px] text-slate-600 truncate py-0.5 flex items-center gap-1.5">
                      <span className="text-slate-400">•</span>
                      <span className="font-mono">{it.path}</span>
                    </div>
                  ))}
                  {selectedItems.length > 10 && (
                    <div className="text-[11px] text-blue-600 font-medium pt-1">
                      ... y {selectedItems.length - 10} archivos más
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-2">
                <div className="p-3 bg-slate-100 text-slate-500 rounded-full mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  Arrastra aquí archivos o una carpeta completa
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Reconoce automáticamente la jerarquía de subcarpetas
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* Status alerts */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading || selectedItems.length === 0}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg shadow-xs flex items-center gap-2 transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subiendo ({selectedItems.length})...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{replaceTargetName ? 'Reemplazar' : `Comenzar Subida (${selectedItems.length})`}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
