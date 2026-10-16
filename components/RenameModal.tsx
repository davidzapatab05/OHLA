'use client';

import React, { useState } from 'react';
import { X, Edit3, Loader2 } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldPath: string;
  initialName: string;
  isFolder: boolean;
  onSuccess: () => void;
}

export function RenameModal({
  isOpen,
  onClose,
  oldPath,
  initialName,
  isFolder,
  onSuccess,
}: RenameModalProps) {
  const [newName, setNewName] = useState(initialName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setNewName(initialName);
    setError(null);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) {
      setError('El nombre no puede estar vacío');
      return;
    }
    if (clean === initialName) {
      onClose();
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      const res = await fetch('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPath,
          newName: clean,
          isFolder,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo renombrar');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Renombrar {isFolder ? 'Carpeta' : 'Archivo'}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">
                {initialName}
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nuevo Nombre
            </label>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isRenaming}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isRenaming || !newName.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              {isRenaming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Guardar Nombre</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
