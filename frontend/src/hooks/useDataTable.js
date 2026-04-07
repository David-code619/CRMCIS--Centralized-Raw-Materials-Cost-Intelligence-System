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
      prev.set('page', String(newPage));
      return prev;
    });
  }, [setSearchParams]);

  const setLimit = useCallback((newLimit) => {
    setSearchParams((prev) => {
      prev.set('limit', String(newLimit));
      prev.set('page', '1'); // Reset to first page when limit changes
      return prev;
    });
  }, [setSearchParams]);

  const setSearch = useCallback((newSearch) => {
    setSearchParams((prev) => {
      if (newSearch) {
        prev.set('search', newSearch);
      } else {
        prev.delete('search');
      }
      prev.set('page', '1'); // Reset to first page when search changes
      return prev;
    });
  }, [setSearchParams]);

  const setSort = useCallback((newSortBy, newSortOrder) => {
    setSearchParams((prev) => {
      prev.set('sortBy', newSortBy);
      prev.set('sortOrder', newSortOrder);
      return prev;
    });
  }, [setSearchParams]);

  const setFilter = useCallback((key, value) => {
    setSearchParams((prev) => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      prev.set('page', '1'); // Reset to first page when filters change
      return prev;
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
