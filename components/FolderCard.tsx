'use client';

import React, { useState } from 'react';
import { Folder, ChevronRight, Edit3, Trash2, Loader2 } from 'lucide-react';
import { FolderInfo } from '@/lib/types';
import { Alerts } from '@/lib/alerts';

interface FolderCardProps {
  folder: FolderInfo;
  onClick: () => void;
  onRename: (folder: FolderInfo) => void;
  onDeleteSuccess: () => void;
}

export function FolderCard({
  folder,
  onClick,
  onRename,
  onDeleteSuccess,
}: FolderCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await Alerts.confirmDeleteFolder(folder.name, folder.fileCount);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          folderPath: folder.path,
        }),
      });
      if (res.ok) {
        Alerts.toastSuccess(`Carpeta "${folder.name}" eliminada`);
        onDeleteSuccess();
      } else {
        Alerts.toastError('No se pudo eliminar la carpeta');
      }
    } catch (err) {
      console.error(err);
      Alerts.toastError('Error de conexión');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-md cursor-pointer transition-all duration-150 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-3 bg-amber-50 group-hover:bg-amber-100 text-amber-600 rounded-xl transition-colors shrink-0">
          <Folder className="w-6 h-6 fill-amber-500/20 text-amber-600" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 truncate transition-colors">
            {folder.name}
          </h4>
          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <span className="font-semibold text-slate-700">{folder.fileCount}</span>{' '}
            {folder.fileCount === 1 ? 'documento' : 'documentos'}
          </span>
        </div>
      </div>

      {/* Action buttons on folder */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename(folder);
          }}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
          title="Renombrar carpeta"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-70 group-hover:opacity-100 disabled:opacity-50"
          title="Eliminar carpeta"
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>

        <div className="p-1 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
