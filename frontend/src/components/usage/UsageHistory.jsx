import { useState, useEffect, useCallback } from 'react';
import { History, Package, User, Calendar } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { format } from 'date-fns';
import { DataTable } from '../ui/DataTable';
import { FilterToolbar } from '../ui/FilterToolbar';
import { useDataTable } from '../../hooks/useDataTable';
import { apiFetch } from '../../lib/api';

export function UsageHistory() {
  const { addToast } = useToast();
  
  const {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    setPage,
    setLimit,
    setSearch,
    setSort,
    getFilter,
  } = useDataTable({ defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
        materialId: getFilter('materialId'),
        isSuspicious: getFilter('isSuspicious'),
      });

      const res = await apiFetch(`/api/usage?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch usage logs');
      const result = await res.json();
      setData(result);
    } catch (error) {
      addToast('Failed to load usage history', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder, getFilter, addToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      header: 'Material',
      accessor: (log) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
            <Package className="w-4 h-4" />
          </div>
          <span className="font-bold text-text-primary">{log.material?.name}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'materialId',
    },
    {
      header: 'Quantity',
      accessor: (log) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary">
            {log.quantityUsed} {log.material?.unit}
          </span>
          {log.isSuspicious && !log.isAudited && (
            <span className="text-[10px] font-bold text-error uppercase tracking-tighter">
              Suspicious
            </span>
          )}
        </div>
      ),
      sortable: true,
      sortKey: 'quantityUsed',
    },
    {
      header: 'Logged By',
      accessor: (log) => (
        <div className="flex items-center gap-2 text-text-secondary">
          <User className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{log.loggedBy?.name}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'loggedById',
    },
    {
      header: 'Date',
      accessor: (log) => (
        <div className="flex items-center gap-2 text-text-tertiary">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">{format(new Date(log.createdAt), 'MMM d, HH:mm')}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'createdAt',
    },
  ];

  return (
    <div className="space-y-4">
      <FilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by material name..."
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        pagination={{
          currentPage: page,
          totalPages: data?.pagination?.totalPages || 0,
          totalItems: data?.pagination?.totalItems || 0,
          limit: limit,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
        sort={{
          sortBy,
          sortOrder,
          onSort: setSort,
        }}
        emptyState={{
          title: 'No usage logs yet',
          description: 'Consumption records will appear here once you start logging daily usage.',
          icon: <History className="w-6 h-6 text-text-tertiary" />,
        }}
      />
    </div>
  );
}