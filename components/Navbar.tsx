'use client';

import React from 'react';
import { QrCode, Upload, RefreshCw, FolderPlus } from 'lucide-react';

interface NavbarProps {
  onOpenQr: () => void;
  onOpenUpload: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalFiles: number;
  totalSize: number;
  isUsingBlob: boolean;
}

export function Navbar({
  onOpenQr,
  onOpenUpload,
  onNewFolder,
  onRefresh,
  isRefreshing,
  totalFiles,
  totalSize,
  isUsingBlob,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & Company Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-24 sm:h-12 sm:w-28 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg p-1 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="Logo OHLA"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) {
                    parent.innerHTML = '<span class="font-bold text-slate-800 text-lg">OHLA</span>';
                  }
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  OHLA
                </span>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isUsingBlob ? 'Cloud Storage' : 'Almacenamiento Activo'}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Documentos
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Actualizar listado"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              onClick={onNewFolder}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
              title="Crear nueva carpeta"
            >
              <FolderPlus className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Nueva Carpeta</span>
            </button>

            <button
              onClick={onOpenQr}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
              title="Ver código QR para compartir"
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">QR Acceso</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Subir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
