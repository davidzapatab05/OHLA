'use client';

import React from 'react';
import { Folder, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { FolderInfo } from '@/lib/types';

interface FolderCardProps {
  folder: FolderInfo;
  onClick: () => void;
}

export function FolderCard({ folder, onClick }: FolderCardProps) {
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
            <span className="font-semibold text-slate-700">{folder.fileCount}</span> {folder.fileCount === 1 ? 'documento' : 'documentos'}
          </span>
        </div>
      </div>

      <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
}
