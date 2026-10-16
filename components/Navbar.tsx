'use client';

import React from 'react';
import { QrCode, RefreshCw, Database } from 'lucide-react';

interface NavbarProps {
  onOpenQr: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalFiles: number;
  totalSize: number;
  isUsingBlob: boolean;
}

export function Navbar({
  onOpenQr,
  onRefresh,
  isRefreshing,
  totalFiles,
  isUsingBlob,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-24 sm:h-11 sm:w-28 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg p-1 overflow-hidden shrink-0">
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  OHLA
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isUsingBlob ? 'Cloud Storage' : 'Almacenamiento Activo'}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Repositorio Documental
              </h1>
            </div>
          </div>

          {/* Quick Actions (Minimalist & Non-redundant) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Actualizar listado"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              onClick={onOpenQr}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all"
              title="Generar código QR para compartir"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Código QR</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
