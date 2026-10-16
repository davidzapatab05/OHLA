'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolder: string;
  onUploadSuccess: () => void;
  replaceTargetName?: string | null;
}

export function UploadModal({
  isOpen,
  onClose,
  currentFolder,
  onUploadSuccess,
  replaceTargetName,
}: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFolder, setTargetFolder] = useState<string>(currentFolder);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync folder when currentFolder changes
  React.useEffect(() => {
    setTargetFolder(currentFolder);
    setSelectedFile(null);
    setError(null);
    setSuccessMsg(null);
  }, [currentFolder, isOpen, replaceTargetName]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Por favor selecciona un archivo PDF o documento.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      // If we are replacing an existing file, we can name the uploaded file with the target name
      let fileToUpload = selectedFile;
      if (replaceTargetName && selectedFile.name !== replaceTargetName) {
        fileToUpload = new File([selectedFile], replaceTargetName, { type: selectedFile.type });
      }

      formData.append('file', fileToUpload);
      formData.append('folder', targetFolder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fallo al subir el archivo');
      }

      setSuccessMsg('¡Archivo procesado y guardado correctamente!');
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {replaceTargetName ? 'Reemplazar Archivo' : 'Subir Documento'}
              </h3>
              <p className="text-xs text-slate-500">OHLA - Repositorio Oficial</p>
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
              Carpeta de destino
            </label>
            <input
              type="text"
              value={targetFolder}
              onChange={(e) => setTargetFolder(e.target.value)}
              placeholder="Ej: PETS o PROCEDIMIENTOS/PROCEDIMIENTOS DE ENSAYOS"
              className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <span className="text-[11px] text-slate-400">
              Déjalo vacío para guardar en la raíz o especifica una subcarpeta.
            </span>
          </div>

          {/* Drag & Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-full mb-2">
                  <FileText className="w-8 h-8" />
                </div>
                <span className="text-sm font-semibold text-slate-900 truncate max-w-xs">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Clic para cambiar
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-slate-100 text-slate-600 rounded-full mb-2">
                  <Upload className="w-8 h-8" />
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  Arrastra aquí tu archivo o haz clic para seleccionarlo
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Soporta PDF, Word, Excel o imágenes
                </span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            💡 <strong>Sobreescritura automática:</strong> Si el archivo tiene el mismo nombre que uno existente, se actualizará directamente sin crear duplicados.
          </div>

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
              disabled={isUploading || !selectedFile}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg shadow-xs flex items-center gap-2 transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{replaceTargetName ? 'Confirmar y Reemplazar' : 'Subir Archivo'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
