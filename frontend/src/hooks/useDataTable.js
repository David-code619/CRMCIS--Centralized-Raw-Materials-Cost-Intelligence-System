import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export function useDataTable(options = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = useMemo(() => parseInt(searchParams.get('page') || '1'), [searchParams]);
  const limit = useMemo(() => parseInt(searchParams.get('limit') || String(options.defaultLimit || 10)), [searchParams, options.defaultLimit]);
  const search = useMemo(() => searchParams.get('search') || '', [searchParams]);
  const sortBy = useMemo(() => searchParams.get('sortBy') || options.defaultSortBy || '', [searchParams, options.defaultSortBy]);
  const sortOrder = useMemo(() => searchParams.get('sortOrder') || options.defaultSortOrder || 'desc', [searchParams, options.defaultSortOrder]);

  const setPage = useCallback((newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  }, [setSearchParams]);

  const setLimit = useCallback((newLimit) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('limit', String(newLimit));
      next.set('page', '1'); // Reset to first page when limit changes
      return next;
    });
  }, [setSearchParams]);

  const setSearch = useCallback((newSearch) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSearch) {
        next.set('search', newSearch);
      } else {
        next.delete('search');
      }
      next.set('page', '1'); // Reset to first page when search changes
      return next;
    });
  }, [setSearchParams]);

  const setSort = useCallback((newSortBy, newSortOrder) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('sortBy', newSortBy);
      next.set('sortOrder', newSortOrder);
      return next;
    });
  }, [setSearchParams]);

  const setFilter = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1'); // Reset to first page when filters change
      return next;
    });
  }, [setSearchParams]);

  const getFilter = useCallback((key) => {
    return searchParams.get(key) || '';
  }, [searchParams]);

  return {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    setPage,
    setLimit,
    setSearch,
    setSort,
    setFilter,
    getFilter,
    searchParams,
  };
}
