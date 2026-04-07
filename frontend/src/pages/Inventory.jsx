import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  History, 
  AlertCircle,
  Building2,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatNumber } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DataTable } from '../components/ui/DataTable';
import { FilterToolbar } from '../components/ui/FilterToolbar';
import { useDataTable } from '../hooks/useDataTable';
import { KPICard } from '../components/ui/KPICard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';
import { apiFetch } from '../lib/api';

export function Inventory() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('stock');
  const [stats, setStats] = useState(null);
  const [branches, setBranches] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [inventoryData, setInventoryData] = useState(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);

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
  } = useDataTable({ 
    defaultSortBy: 'material.name',
    defaultSortOrder: 'asc'
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const branchId = isSuperAdmin ? getFilter('branchId') : user?.branchId;
      const queryParams = new URLSearchParams();
      if (branchId) queryParams.append('branchId', branchId);
      
      const res = await apiFetch(`/api/inventory/stats?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const result = await res.json();
      setStats(result);
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [isSuperAdmin, getFilter, user?.branchId]);

  const fetchBranches = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await apiFetch('/api/branches');
      if (!res.ok) throw new Error('Failed to fetch branches');
      const result = await res.json();
      setBranches(result);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  }, [isSuperAdmin]);

  const fetchInventory = useCallback(async () => {
    setIsLoadingInventory(true);
    try {
      const branchId = isSuperAdmin ? getFilter('branchId') : user?.branchId;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder,
      });

      if (branchId) params.append('branchId', branchId);
      const category = getFilter('category');
      if (category) params.append('category', category);
      const status = getFilter('status');
      if (status) params.append('status', status);

      const res = await apiFetch(`/api/inventory?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const result = await res.json();
      setInventoryData(result);
    } catch (error) {
      console.error('Inventory fetch error:', error);
      addToast('Could not load inventory data', 'error');
    } finally {
      setIsLoadingInventory(false);
    }
  }, [isSuperAdmin, user?.branchId, page, limit, search, sortBy, sortOrder, getFilter, addToast]);

  const fetchHistory = useCallback(async () => {
    if (activeTab !== 'history') return;
    setIsLoadingHistory(true);
    try {
      const branchId = isSuperAdmin ? getFilter('branchId') : user?.branchId;
      const queryParams = new URLSearchParams();
      if (branchId) queryParams.append('branchId', branchId);
      
      const res = await apiFetch(`/api/inventory/history?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const result = await res.json();
      setHistory(result);
    } catch (error) {
      console.error("Error fetching inventory history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [activeTab, isSuperAdmin, getFilter, user?.branchId]);

  useEffect(() => {
    fetchStats();
    fetchBranches();
  }, [fetchStats, fetchBranches]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const categories = ['All', 'Raw Material', 'Packaging', 'Chemicals', 'Other'];
  const stockStatuses = [
    { label: 'All Statuses', value: '' },
    { label: 'In Stock', value: 'IN_STOCK' },
    { label: 'Low Stock', value: 'LOW_STOCK' },
    { label: 'Out of Stock', value: 'OUT_OF_STOCK' }
  ];

  const columns = [
    {
      header: 'Material',
      accessor: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-text-primary tracking-tight">{item.material?.name}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">{item.material?.sku || 'NO SKU'}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'material.name',
    },
    {
      header: 'Category',
      accessor: (item) => (
        <span className="text-sm font-medium text-text-secondary">{item.material?.category}</span>
      ),
      sortable: true,
      sortKey: 'material.category',
    },
    ...(isSuperAdmin ? [{
      header: 'Branch',
      accessor: (item) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-sm font-medium text-text-secondary">{item.branch?.name}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'branch.name',
    }] : []),
    {
      header: 'Current Stock',
      accessor: (item) => {
        const isLow = item.currentStock > 0 && item.currentStock <= item.reorderThreshold;
        const isOut = item.currentStock === 0;
        return (
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-bold",
              isOut ? "text-danger" : isLow ? "text-warning" : "text-text-primary"
            )}>
              {item.currentStock} {item.material?.unit}
            </span>
            {isLow && <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
            {isOut && <XCircle className="w-3.5 h-3.5 text-danger" />}
          </div>
        );
      },
      sortable: true,
      sortKey: 'currentStock',
    },
    {
      header: 'Threshold',
      accessor: (item) => (
        <span className="text-sm font-medium text-text-tertiary">{item.reorderThreshold} {item.material?.unit}</span>
      ),
      sortable: true,
      sortKey: 'reorderThreshold',
    },
    {
      header: 'Status',
      accessor: (item) => {
        const isLow = item.currentStock > 0 && item.currentStock <= item.reorderThreshold;
        const isOut = item.currentStock === 0;
        return (
          <StatusBadge status={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
          </StatusBadge>
        );
      },
    },
    {
      header: 'Unit Cost',
      accessor: (item) => (
        <span className="text-sm font-medium text-text-secondary">₦{(item.avgCost || 0).toLocaleString()}</span>
      ),
      sortable: true,
      sortKey: 'avgCost',
    },
    {
      header: 'Total Value',
      accessor: (item) => (
        <span className="text-sm font-bold text-text-primary">₦{(item.currentStock * (item.avgCost || 0)).toLocaleString()}</span>
      ),
    },
    {
      header: 'Last Updated',
      accessor: (item) => (
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Clock className="w-3 h-3" />
          <span className="text-xs">{new Date(item.updatedAt).toLocaleDateString()}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'updatedAt',
    }
  ];

  const historyColumns = [
    {
      header: 'Date',
      accessor: (event) => (
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Clock className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-sm">{new Date(event.date).toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (event) => (
        <StatusBadge 
          status={
            event.type === 'PURCHASE' ? 'success' : 
            event.type === 'USAGE' ? 'danger' : 
            event.type === 'ADJUSTMENT' ? 'warning' : 'info'
          }
        >
          {event.type}
        </StatusBadge>
      ),
    },
    {
      header: 'Quantity Change',
      accessor: (event) => (
        <span className={cn(
          "text-sm font-bold",
          event.quantity > 0 ? "text-success" : "text-danger"
        )}>
          {event.quantity > 0 ? '+' : ''}{event.quantity}
        </span>
      ),
    },
    {
      header: 'Reference',
      accessor: (event) => (
        <span className="text-sm font-medium text-text-secondary">{event.reference || '-'}</span>
      ),
    },
    {
      header: 'Description',
      accessor: (event) => (
        <span className="text-sm text-text-tertiary">{event.description}</span>
      ),
    }
  ];

  const tabs = [
    { id: 'stock', label: 'Current Stock', icon: Package },
    { id: 'history', label: 'Movement History', icon: History },
    { id: 'alerts', label: 'Stock Alerts', icon: AlertCircle },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Breadcrumbs items={[{ label: 'Inventory' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Inventory Management</h1>
          <p className="text-text-tertiary mt-1">
            {isSuperAdmin 
              ? "System-wide inventory control and material tracking." 
              : "Monitor stock levels and material movements for your branch."}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoadingStats && !stats ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-background animate-pulse rounded-3xl border border-border" />
          ))
        ) : (
          <>
            <KPICard 
              title="Total Materials" 
              value={stats?.totalMaterials || 0} 
              icon={Package}
              color="primary"
            />
            <KPICard 
              title="Total Stock" 
              value={formatNumber(stats?.totalStockQuantity || 0)} 
              icon={TrendingUp}
              color="info"
            />
            <KPICard 
              title="Low Stock" 
              value={stats?.lowStockItems || 0} 
              icon={AlertTriangle}
              color="warning"
            />
            <KPICard 
              title="Out of Stock" 
              value={stats?.outOfStockItems || 0} 
              icon={XCircle}
              color="danger"
            />
            <KPICard 
              title="Inventory Value" 
              value={`₦${formatNumber(stats?.totalInventoryValue || 0)}`} 
              icon={TrendingUp}
              color="success"
            />
            <KPICard 
              title="Reorder Alerts" 
              value={stats?.pendingReorders || 0} 
              icon={AlertCircle}
              color="warning"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-background border border-border rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white text-primary shadow-sm" 
                : "text-text-tertiary hover:text-text-primary hover:bg-white/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'stock' && (
            <div className="space-y-6">
              <FilterToolbar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by material name, SKU..."
              >
                <div className="flex flex-wrap items-center gap-3">
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-text-tertiary" />
                      <select 
                        className="stitch-input h-10 min-w-40"
                        value={getFilter('branchId') || ''}
                        onChange={(e) => setFilter('branchId', e.target.value)}
                      >
                        <option value="">All Branches</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-text-tertiary" />
                    <select 
                      className="stitch-input h-10 min-w-40"
                      value={getFilter('category') || ''}
                      onChange={(e) => setFilter('category', e.target.value)}
                    >
                      {categories.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-text-tertiary" />
                    <select 
                      className="stitch-input h-10 min-w-40"
                      value={getFilter('status') || ''}
                      onChange={(e) => setFilter('status', e.target.value)}
                    >
                      {stockStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </FilterToolbar>

              <DataTable
                columns={columns}
                data={inventoryData?.data || []}
                loading={isLoadingInventory}
                pagination={{
                  currentPage: page,
                  totalPages: inventoryData?.pagination?.totalPages || 1,
                  totalItems: inventoryData?.pagination?.totalItems || 0,
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
                  title: 'No inventory found',
                  description: 'Try adjusting your filters or search terms.',
                  icon: <Package className="w-6 h-6 text-text-tertiary" />,
                }}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">Stock Movement History</h3>
                {isSuperAdmin && (
                  <select 
                    className="stitch-input h-10 min-w-50"
                    value={getFilter('branchId') || ''}
                    onChange={(e) => {
                      setFilter('branchId', e.target.value);
                      fetchHistory();
                    }}
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
              </div>

              <DataTable
                columns={historyColumns}
                data={history}
                loading={isLoadingHistory}
                emptyState={{
                  title: 'No movement history',
                  description: 'Stock movements will appear here once recorded.',
                  icon: <History className="w-6 h-6 text-text-tertiary" />,
                }}
              />
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Low Stock Alerts */}
                <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-border bg-warning/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="w-5 h-5" />
                      <h3 className="font-bold">Low Stock Items</h3>
                    </div>
                    <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-bold rounded-lg">
                      {inventoryData?.data?.filter(i => i.currentStock > 0 && i.currentStock <= i.reorderThreshold).length || 0} Items
                    </span>
                  </div>
                  <div className="divide-y divide-border max-h-100 overflow-y-auto">
                    {inventoryData?.data?.filter(i => i.currentStock > 0 && i.currentStock <= i.reorderThreshold).map(item => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-background transition-colors">
                        <div>
                          <p className="font-bold text-text-primary text-sm">{item.material?.name}</p>
                          <p className="text-xs text-text-tertiary">{item.branch?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-warning">{item.currentStock} {item.material?.unit}</p>
                          <p className="text-[10px] text-text-tertiary">Threshold: {item.reorderThreshold}</p>
                        </div>
                      </div>
                    ))}
                    {(!inventoryData?.data || inventoryData?.data?.filter(i => i.currentStock > 0 && i.currentStock <= i.reorderThreshold).length === 0) && (
                      <div className="p-12 text-center text-text-tertiary">
                        <p className="text-sm">No low stock items detected.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Out of Stock Alerts */}
                <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-border bg-danger/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-danger">
                      <XCircle className="w-5 h-5" />
                      <h3 className="font-bold">Out of Stock Items</h3>
                    </div>
                    <span className="px-2 py-1 bg-danger/10 text-danger text-xs font-bold rounded-lg">
                      {inventoryData?.data?.filter(i => i.currentStock === 0).length || 0} Items
                    </span>
                  </div>
                  <div className="divide-y divide-border max-h-100 overflow-y-auto">
                    {inventoryData?.data?.filter(i => i.currentStock === 0).map(item => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-background transition-colors">
                        <div>
                          <p className="font-bold text-text-primary text-sm">{item.material?.name}</p>
                          <p className="text-xs text-text-tertiary">{item.branch?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-danger">0 {item.material?.unit}</p>
                          <p className="text-[10px] text-text-tertiary">Threshold: {item.reorderThreshold}</p>
                        </div>
                      </div>
                    ))}
                    {(!inventoryData?.data || inventoryData?.data?.filter(i => i.currentStock === 0).length === 0) && (
                      <div className="p-12 text-center text-text-tertiary">
                        <p className="text-sm">No out of stock items detected.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
