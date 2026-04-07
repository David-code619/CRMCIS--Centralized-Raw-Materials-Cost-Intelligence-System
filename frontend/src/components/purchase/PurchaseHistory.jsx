import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Calendar, 
  User, 
  FileText, 
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { DataTable } from '../ui/DataTable';
import { FilterToolbar } from '../ui/FilterToolbar';
import { useDataTable } from '../../hooks/useDataTable';

export function PurchaseHistory() {
  const { user } = useAuth();
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
    setFilter,
    getFilter,
  } = useDataTable({ defaultSortBy: 'purchaseDate', defaultSortOrder: 'desc' });

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const branchId = user?.branchId;
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
        ...(branchId ? { branchId } : {}),
      });

      const res = await fetch(`/api/purchases?${queryParams.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch history');
      const result = await res.json();
      setData(result);
    } catch (error) {
      addToast('Failed to load purchase history', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, page, limit, search, sortBy, sortOrder, addToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const columns = [
    {
      header: 'Date',
      accessor: (p) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm text-text-secondary">
            {new Date(p.purchaseDate).toLocaleDateString()}
          </span>
        </div>
      ),
      sortable: true,
      sortKey: 'purchaseDate',
    },
    {
      header: 'Material',
      accessor: (p) => (
        <p className="font-bold text-text-primary tracking-tight">{p.material?.name}</p>
      ),
      sortable: true,
      sortKey: 'materialId',
    },
    {
      header: 'Quantity',
      accessor: (p) => (
        <span className="text-sm font-medium text-text-secondary">
          {p.quantity} {p.material?.unit}
        </span>
      ),
      sortable: true,
      sortKey: 'quantity',
    },
    {
      header: 'Unit Price',
      accessor: (p) => (
        <span className="text-sm font-medium text-text-secondary">
          ₦ {p.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
      sortable: true,
      sortKey: 'unitPrice',
    },
    {
      header: 'Total',
      accessor: (p) => (
        <span className="text-sm font-bold text-primary">
          ₦ {p.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
      sortable: true,
      sortKey: 'totalCost',
    },
    {
      header: 'Supplier / Ref',
      accessor: (p) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text-primary">{p.supplier || 'N/A'}</span>
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">{p.invoiceRef || 'No Ref'}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'supplier',
    },
    {
      header: 'Logged By',
      accessor: (p) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
            {p.loggedBy?.name?.[0]}
          </div>
          <span className="text-xs font-medium text-text-secondary">{p.loggedBy?.name}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'loggedById',
    },
  ];

  return (
    <div className="space-y-4">
      <FilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by material, supplier, or invoice..."
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
          title: 'No purchases found',
          description: 'Try adjusting your search or log a new purchase to see it here.',
          icon: <Package className="w-6 h-6 text-text-tertiary" />,
        }}
      />
    </div>
  );
}
