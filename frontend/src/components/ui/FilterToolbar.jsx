import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Download, RefreshCw, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function FilterToolbar({
  onSearchChange,
  searchValue = '',
  onFilterClick,
  onAddClick,
  onExportClick,
  onRefreshClick,
  searchPlaceholder = 'Search...',
  className,
  children,
}) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const handleSearchChange = useCallback(
    (value) => {
      setLocalSearch(value);
      const timeoutId = setTimeout(() => {
        onSearchChange?.(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    },
    [onSearchChange]
  );

  const clearSearch = () => {
    setLocalSearch('');
    onSearchChange?.('');
  };

  return (
    <div className={cn('flex flex-col md:flex-row gap-4 justify-between items-center mb-6', className)}>
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="stitch-input pl-10 pr-10 h-10"
        />
        {localSearch && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-border rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-text-tertiary" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        {children}
        
        {onFilterClick && (
          <button
            onClick={onFilterClick}
            className="stitch-button-secondary flex items-center gap-2 h-10 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        )}

        {onExportClick && (
          <button
            onClick={onExportClick}
            className="stitch-button-secondary flex items-center gap-2 h-10 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}

        {onRefreshClick && (
          <button
            onClick={onRefreshClick}
            className="stitch-button-secondary p-2.5 h-10"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {onAddClick && (
          <button
            onClick={onAddClick}
            className="stitch-button-primary flex items-center gap-2 h-10 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New</span>
          </button>
        )}
      </div>
    </div>
  );
}
