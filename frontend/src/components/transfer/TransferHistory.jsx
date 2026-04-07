import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowRightLeft, 
  Package, 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { StatusBadge } from '../ui/StatusBadge';
import { DataTable } from '../ui/DataTable';
import { FilterToolbar } from '../ui/FilterToolbar';
import { useDataTable } from '../../hooks/useDataTable';

export function TransferHistory() {
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
  } = useDataTable({ defaultSortBy: 'transferDate', defaultSortOrder: 'desc' });

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null);

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
        status: getFilter('status'),
        ...(branchId ? { branchId } : {}),
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transfers?${queryParams.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch transfers');
      const result = await res.json();
      setData(result);
    } catch (error) {
      addToast('Failed to load transfers', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, page, limit, search, sortBy, sortOrder, getFilter, addToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleComplete = async (id) => {
    setIsProcessing(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transfers/${id}/complete`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to complete transfer');
      }
      
      addToast('Transfer completed successfully. Stock updated.', 'success');
      fetchHistory();
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REQUESTED': return 'warning';
      case 'PENDING_APPROVAL': return 'warning';
      case 'APPROVED': return 'info';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'danger';
      case 'CANCELLED': return 'danger';
      default: return 'neutral';
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: (t) => (
        <span className="text-sm text-text-secondary">
          {new Date(t.transferDate).toLocaleDateString()}
        </span>
      ),
      sortable: true,
      sortKey: 'transferDate',
    },
    {
      header: 'Route',
      accessor: (t) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-text-primary">{t.fromBranch?.name}</span>
            <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">Source</span>
          </div>
          <ArrowRight className="w-3 h-3 text-text-tertiary" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-text-primary">{t.toBranch?.name}</span>
            <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">Dest</span>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'fromBranchId',
    },
    {
      header: 'Material',
      accessor: (t) => (
        <p className="font-bold text-text-primary tracking-tight">{t.material?.name}</p>
      ),
      sortable: true,
      sortKey: 'materialId',
    },
    {
      header: 'Quantity',
      accessor: (t) => (
        <span className="text-sm font-bold text-primary">
          {t.quantity} {t.material?.unit}
        </span>
      ),
      sortable: true,
      sortKey: 'quantity',
    },
    {
      header: 'Status',
      accessor: (t) => (
        <StatusBadge status={getStatusColor(t.status)}>
          {t.status.replace('_', ' ')}
        </StatusBadge>
      ),
      sortable: true,
      sortKey: 'status',
    },
    {
      header: 'Actions',
      accessor: (t) => (
        <div className="flex items-center justify-end">
          {t.status === 'APPROVED' ? (
            <button
              onClick={() => handleComplete(t.id)}
              disabled={isProcessing === t.id}
              className="stitch-button-primary py-1.5 px-3 text-[10px] flex items-center gap-2"
            >
              {isProcessing === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Complete
            </button>
          ) : t.status === 'REQUESTED' ? (
            <div className="flex items-center gap-1 text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              Awaiting Approval
            </div>
          ) : t.status === 'COMPLETED' ? (
            <div className="flex items-center gap-1 text-[10px] text-success font-bold uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3" />
              Finished
            </div>
          ) : (
            <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
              {t.status.replace('_', ' ')}
            </div>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-4">
      <FilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by material or branch..."
      >
        <select 
          className="stitch-input h-10 min-w-35"
          value={getFilter('status')}
          onChange={(e) => setFilter('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="REQUESTED">Requested</option>
          <option value="APPROVED">Approved</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </FilterToolbar>

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
          title: 'No transfers found',
          description: 'Try adjusting your search or request a new transfer.',
          icon: <ArrowRightLeft className="w-6 h-6 text-text-tertiary" />,
        }}
      />
    </div>
  );
}
