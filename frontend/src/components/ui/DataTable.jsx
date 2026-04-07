import React from 'react';
import { cn } from '../../lib/utils';
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Pagination } from './Pagination';

export function DataTable({
  columns,
  data,
  loading,
  emptyState,
  pagination,
  sort,
  onRowClick,
  rowClassName,
  className,
}) {
  const handleSort = (col) => {
    if (!col.sortable || !sort) return;
    const key = col.sortKey || (typeof col.accessor === 'string' ? col.accessor : '');
    if (!key) return;

    if (sort.sortBy === key) {
      sort.onSort(key, sort.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      sort.onSort(key, 'asc');
    }
  };

  const getSortIcon = (col) => {
    if (!col.sortable || !sort) return null;
    const key = col.sortKey || (typeof col.accessor === 'string' ? col.accessor : '');
    if (sort.sortBy !== key) return <ArrowUpDown className="w-3 h-3 text-text-tertiary" />;
    return sort.sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary" />
    );
  };

  return (
    <div className={cn('stitch-card overflow-hidden flex flex-col', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background border-b border-border">
              {columns.map((col, idx) => (
                <th
                  key={typeof col.accessor === 'string' ? col.accessor : (typeof col.header === 'string' ? col.header : idx)}
                  className={cn(
                    'px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest',
                    col.sortable && 'cursor-pointer hover:bg-surface transition-colors',
                    col.className
                  )}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && getSortIcon(col)}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-right w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-6 py-4">
                      <div className="h-4 bg-border rounded w-full" />
                    </td>
                  ))}
                  <td className="px-6 py-4"></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    {emptyState?.icon || <div className="p-3 bg-background rounded-full border border-border"><MoreHorizontal className="w-6 h-6 text-text-tertiary" /></div>}
                    <p className="text-sm font-bold text-text-primary tracking-tight">
                      {emptyState?.title || 'No data available'}
                    </p>
                    <p className="text-xs text-text-tertiary font-medium">
                      {emptyState?.description || 'Try adjusting your filters or search terms.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'hover:bg-background transition-colors group',
                    onRowClick && 'cursor-pointer',
                    rowClassName?.(item)
                  )}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.accessor || col.header || cIdx}
                      className={cn('px-6 py-4 text-sm text-text-primary', col.className)}
                    >
                      {typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : item[col.accessor]}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 hover:bg-border rounded-full transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          limit={pagination.limit}
          onPageChange={pagination.onPageChange}
          onLimitChange={pagination.onLimitChange}
        />
      )}
    </div>
  );
}
