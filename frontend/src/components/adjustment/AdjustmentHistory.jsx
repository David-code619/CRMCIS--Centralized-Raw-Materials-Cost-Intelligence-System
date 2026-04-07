import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Calendar, 
  User, 
  FileText, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
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
import { apiFetch } from '../../lib/api';

export function AdjustmentHistory() {
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
  } = useDataTable({ defaultSortBy: 'adjustmentDate', defaultSortOrder: 'desc' });

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

      const res = await apiFetch(`/api/adjustments?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch adjustments');
      const result = await res.json();
      setData(result);
    } catch (error) {
      addToast('Failed to load adjustments', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, page, limit, search, sortBy, sortOrder, getFilter, addToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleAction = async (id, action) => {
    setIsProcessing(id);
    try {
      const res = await apiFetch(`/api/adjustments/${id}/${action}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error(`Failed to ${action} adjustment`);
      
      addToast(`Adjustment ${action}d successfully`, 'success');
      fetchHistory();
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  const canApprove = user?.role === 'SUPER_ADMIN' || user?.role === 'BRANCH_MANAGER';

  const columns = [
    {
      header: 'Date',
      accessor: (a) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm text-text-secondary">
            {new Date(a.adjustmentDate).toLocaleDateString()}
          </span>
        </div>
      ),
      sortable: true,
      sortKey: 'adjustmentDate',
    },
    {
      header: 'Material',
      accessor: (a) => (
        <p className="font-bold text-text-primary tracking-tight">{a.material?.name}</p>
      ),
      sortable: true,
      sortKey: 'materialId',
    },
    {
      header: 'Quantity',
      accessor: (a) => (
        <span className={cn(
          "text-sm font-bold",
          a.quantity < 0 ? "text-danger" : "text-success"
        )}>
          {a.quantity > 0 ? '+' : ''}{a.quantity} {a.material?.unit}
        </span>
      ),
      sortable: true,
      sortKey: 'quantity',
    },
    {
      header: 'Reason',
      accessor: (a) => (
        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-background border border-border text-text-secondary uppercase tracking-wider">
          {a.reason}
        </span>
      ),
      sortable: true,
      sortKey: 'reason',
    },
    {
      header: 'Status',
      accessor: (a) => (
        <StatusBadge status={a.status === 'PENDING_APPROVAL' ? 'warning' : a.status === 'APPROVED' ? 'success' : 'danger'}>
          {a.status.replace('_', ' ')}
        </StatusBadge>
      ),
      sortable: true,
      sortKey: 'status',
    },
    {
      header: 'Details',
      accessor: (a) => (
        <div className="flex flex-col">
          <span className="text-xs text-text-secondary italic truncate max-w-37.5">{a.notes || 'No notes'}</span>
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mt-1">By {a.loggedBy?.name}</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (a) => (
        <div className="flex items-center justify-end">
          {a.status === 'PENDING_APPROVAL' && canApprove ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction(a.id, 'approve')}
                disabled={isProcessing === a.id}
                className="p-2 text-success hover:bg-success/10 rounded-lg transition-all"
                title="Approve"
              >
                {isProcessing === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleAction(a.id, 'reject')}
                disabled={isProcessing === a.id}
                className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-all"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest text-right">
              {a.status === 'APPROVED' ? `Approved by ${a.approvedBy?.name || 'Manager'}` : a.status === 'REJECTED' ? 'Rejected' : 'Awaiting Approval'}
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
        searchPlaceholder="Search by material, reason, or notes..."
      >
        <select 
          className="stitch-input h-10 min-w-35"
          value={getFilter('status')}
          onChange={(e) => setFilter('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
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
          title: 'No adjustments found',
          description: 'Try adjusting your search or record a new adjustment.',
          icon: <AlertTriangle className="w-6 h-6 text-text-tertiary" />,
        }}
      />
    </div>
  );
}
