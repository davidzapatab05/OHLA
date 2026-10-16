'use client';

import React from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { DocumentFile } from '@/lib/types';

interface PdfModalProps {
  file: DocumentFile | null;
  onClose: () => void;
}

export function PdfModal({ file, onClose }: PdfModalProps) {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {file.name}
              </h3>
              <p className="text-xs text-slate-500">
                Carpeta: {file.folder || 'Raíz'} • {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors border border-slate-200"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={file.url}
              download={file.name}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Descargar</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF viewer frame */}
        <div className="flex-1 w-full bg-slate-100 relative">
          <iframe
            src={`${file.url}#toolbar=1&navpanes=0`}
            className="w-full h-full border-0"
            title={file.name}
          />
        </div>

      </div>
    </div>
  );
}
