'use client';

import React from 'react';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';

interface BreadcrumbsProps {
  items: { name: string; path: string }[];
  onNavigate: (path: string) => void;
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  const canGoBack = items.length > 1;
  const parentPath = canGoBack ? items[items.length - 2].path : '';

  return (
    <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-xs overflow-x-auto whitespace-nowrap">
      {canGoBack && (
        <button
          onClick={() => onNavigate(parentPath)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium mr-2 pr-2 border-r border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isRoot = index === 0;

        return (
          <React.Fragment key={item.path || 'root'}>
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            {isLast ? (
              <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {item.name}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(item.path)}
                className="hover:text-blue-600 font-medium flex items-center gap-1 transition-colors"
              >
                {isRoot && <Home className="w-3.5 h-3.5" />}
                <span>{item.name}</span>
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
