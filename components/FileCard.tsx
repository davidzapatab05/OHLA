'use client';

import React, { useState } from 'react';
import { FileText, Eye, Download, RefreshCw, Trash2, Edit3, Loader2 } from 'lucide-react';
import { DocumentFile } from '@/lib/types';
import { Alerts } from '@/lib/alerts';

interface FileCardProps {
  file: DocumentFile;
  onView: (file: DocumentFile) => void;
  onRename: (file: DocumentFile) => void;
  onReplace: (file: DocumentFile) => void;
  onDeleteSuccess: () => void;
}

export function FileCard({
  file,
  onView,
  onRename,
  onReplace,
  onDeleteSuccess,
}: FileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleDelete = async () => {
    const confirmed = await Alerts.confirmDeleteFile(file.name);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path, url: file.url }),
      });
      if (res.ok) {
        Alerts.toastSuccess(`"${file.name}" eliminado`);
        onDeleteSuccess();
      } else {
        Alerts.toastError('No se pudo eliminar el archivo');
      }
    } catch (err) {
      console.error(err);
      Alerts.toastError('Error de conexión al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const isPdf = file.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 sm:p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-3 relative group">
      
      {/* File Info */}
      <div className="flex items-start gap-3 min-w-0">
        <div className={`p-2.5 rounded-xl shrink-0 ${isPdf ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h4
            onClick={() => onView(file)}
            title={file.name}
            className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-blue-600 cursor-pointer break-words line-clamp-2 transition-colors"
          >
            {file.name}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
            <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
              {formatSize(file.size)}
            </span>
            {file.updatedAt && (
              <span>• {formatDate(file.updatedAt)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1 gap-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(file)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Ver documento"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Ver</span>
          </button>

          <a
            href={file.url}
            download={file.name}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Descargar archivo"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bajar</span>
          </a>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onRename(file)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Renombrar archivo"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onReplace(file)}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Reemplazar por nueva versión"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Eliminar archivo"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
