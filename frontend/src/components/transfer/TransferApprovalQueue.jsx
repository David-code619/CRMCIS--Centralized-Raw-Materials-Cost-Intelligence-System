import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Package, 
  Building2, 
  ArrowRight, 
  Clock, 
  FileText,
  ShieldCheck,
  AlertCircle,
  Search
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { DataTable } from '../ui/DataTable';
import { FilterToolbar } from '../ui/FilterToolbar';
import { useDataTable } from '../../hooks/useDataTable';

export function TransferApprovalQueue() {
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
  } = useDataTable({ defaultSortBy: 'transferDate', defaultSortOrder: 'desc' });

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState({});

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
        status: 'REQUESTED',
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transfers?${queryParams.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch requests');
      const result = await res.json();
      setData(result);
    } catch (error) {
      addToast('Failed to load approval queue', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder, addToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id, action) => {
    setIsProcessing(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transfers/${id}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: approvalNotes[id] || '' }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${action} transfer`);
      }
      
      addToast(`Transfer ${action}d successfully`, 'success');
      fetchRequests();
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="stitch-card p-12 flex flex-col items-center justify-center text-center">
        <ShieldCheck className="w-12 h-12 text-text-tertiary mb-4" />
        <h3 className="text-lg font-bold text-text-primary">Super Admin Access Only</h3>
        <p className="text-sm text-text-tertiary max-w-xs mt-1">
          Only the Super Admin can approve or reject inter-branch transfer requests.
        </p>
      </div>
    );
  }

  const columns = [
    {
      header: 'Request Details',
      accessor: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">{r.material.name}</p>
            <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
              {r.quantity} {r.material.unit} Requested
            </p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'materialId',
    },
    {
      header: 'Route',
      accessor: (r) => (
        <div className="flex items-center gap-4 p-2 bg-background rounded-lg border border-border/50">
          <div className="flex-1">
            <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mb-0.5">From</p>
            <p className="text-xs font-bold text-text-primary flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {r.fromBranch.name}
            </p>
          </div>
          <ArrowRight className="w-3 h-3 text-text-tertiary" />
          <div className="flex-1">
            <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mb-0.5">To</p>
            <p className="text-xs font-bold text-text-primary flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {r.toBranch.name}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'fromBranchId',
    },
    {
      header: 'Notes',
      accessor: (r) => (
        <div className="max-w-xs">
          <p className="text-xs text-text-secondary italic line-clamp-2">
            {r.notes || 'No notes provided'}
          </p>
          <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mt-1">
            By {r.loggedBy.name}
          </p>
        </div>
      ),
    },
    {
      header: 'Decision',
      accessor: (r) => (
        <div className="space-y-3 min-w-50">
          <textarea
            className="stitch-input w-full text-[10px] py-1.5 min-h-15"
            placeholder="Add notes..."
            value={approvalNotes[r.id] || ''}
            onChange={(e) => setApprovalNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(r.id, 'approve')}
              disabled={isProcessing === r.id}
              className="stitch-button-primary flex-1 py-1.5 text-[10px] flex items-center justify-center gap-2"
            >
              {isProcessing === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Approve
            </button>
            <button
              onClick={() => handleAction(r.id, 'reject')}
              disabled={isProcessing === r.id}
              className="stitch-button-secondary flex-1 py-1.5 text-[10px] text-danger hover:bg-danger/5 hover:border-danger/20 flex items-center justify-center gap-2"
            >
              <XCircle className="w-3 h-3" />
              Reject
            </button>
          </div>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Approval Queue
          {data?.pagination?.totalItems && data.pagination?.totalItems > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
              {data?.pagination?.totalItems}
            </span>
          )}
        </h3>
      </div>

      <FilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by material or branch..."
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
          title: 'Queue Clear',
          description: 'There are no pending transfer requests awaiting your approval.',
          icon: <CheckCircle2 className="w-6 h-6 text-text-tertiary" />,
        }}
      />
    </div>
  );
}
