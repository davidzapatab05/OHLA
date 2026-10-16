'use client';

import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, X, Upload } from 'lucide-react';

export interface UploadStatus {
  isUploading: boolean;
  progress: number;
  totalFiles: number;
  message: string;
  isError?: boolean;
  isSuccess?: boolean;
}

interface UploadToastProps {
  status: UploadStatus | null;
  onClose: () => void;
}

export function UploadToast({ status, onClose }: UploadToastProps) {
  if (!status) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2">
          {status.isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          ) : status.isError ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="truncate">
            {status.isUploading
              ? `Subiendo ${status.totalFiles} elemento(s)...`
              : status.isError
              ? 'Error en la subida'
              : 'Subida completada'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3.5 space-y-2 bg-white">
        <p className="text-xs text-slate-600 truncate">{status.message}</p>

        {status.isUploading && (
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, status.progress)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
