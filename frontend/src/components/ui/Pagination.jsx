import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  className,
}) {
  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalItems);

  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-background/50', className)}>
      <div className="flex items-center gap-4">
        <p className="text-xs text-text-tertiary font-medium">
          Showing <span className="text-text-primary">{totalItems > 0 ? startRecord : 0}</span> to{' '}
          <span className="text-text-primary">{endRecord}</span> of{' '}
          <span className="text-text-primary">{totalItems}</span> records
        </p>
        
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary font-medium">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-transparent text-xs font-medium text-text-primary border-none focus:ring-0 cursor-pointer"
            >
              {[10, 25, 50, 100].map((v) => (
                <option key={v} value={v} className="bg-surface">
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          className="p-1.5 border border-border rounded-md hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 border border-border rounded-md hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 mx-2">
          {startPage > 1 && <span className="text-xs text-text-tertiary px-1">...</span>}
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'w-8 h-8 text-xs font-medium rounded-md transition-colors',
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'hover:bg-surface text-text-secondary'
              )}
            >
              {page}
            </button>
          ))}
          {endPage < totalPages && <span className="text-xs text-text-tertiary px-1">...</span>}
        </div>

        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 border border-border rounded-md hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(totalPages)}
          className="p-1.5 border border-border rounded-md hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
