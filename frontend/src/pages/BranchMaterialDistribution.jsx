import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Filter, 
  Package, 
  AlertTriangle,
  Loader2,
  Settings2,
  Power,
  Building2,
  Eye,
  Info,
  ArrowRightLeft
} from 'lucide-react';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DataTable } from '../components/ui/DataTable';
import { FilterToolbar } from '../components/ui/FilterToolbar';
import { useDataTable } from '../hooks/useDataTable';
import { Modal } from '../components/ui/Modal';

export function BranchMaterialDistribution() {
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
  } = useDataTable({ defaultSortBy: 'material.name', defaultSortOrder: 'asc' });

  const [data, setData] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // Super Admin specific state
  const [branches, setBranches] = useState([]);
  const [breakdownMaterial, setBreakdownMaterial] = useState(null);
  const [breakdownData, setBreakdownData] = useState([]);
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Activation form state
  const [activationData, setActivationData] = useState({
    materialId: '',
    reorderThreshold: 0
  });

  // Edit form state
  const [editData, setEditData] = useState({
    reorderThreshold: 0,
    isActive: true
  });

  const categories = ['All', 'Raw Material', 'Packaging', 'Chemicals', 'Other'];

  const fetchBranches = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch('/api/branches', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch branches');
      const result = await res.json();
      setBranches(result);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  }, [isSuperAdmin]);

  const fetchBranchMaterials = useCallback(async () => {
    const branchId = isSuperAdmin ? getFilter('branchId') : user?.branchId;
    if (!branchId && !isSuperAdmin) return;

    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
        category: getFilter('category'),
        branchId: branchId || ''
      });

      const url = isSuperAdmin 
        ? `/api/branch-materials?${queryParams.toString()}`
        : `/api/branches/${branchId}/materials?${queryParams.toString()}`;

      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch branch materials');
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching branch materials:", error);
      addToast('Error fetching branch materials', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, isSuperAdmin, page, limit, search, sortBy, sortOrder, getFilter, addToast]);

  const fetchMaterialBreakdown = useCallback(async (materialId) => {
    setIsBreakdownLoading(true);
    try {
      const res = await fetch(`/api/branch-materials/${materialId}/breakdown`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch breakdown');
      const result = await res.json();
      setBreakdownData(result);
    } catch (error) {
      console.error("Error fetching branch breakdown:", error);
      addToast('Error fetching branch breakdown', 'error');
    } finally {
      setIsBreakdownLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (breakdownMaterial) {
      fetchMaterialBreakdown(breakdownMaterial.materialId);
    }
  }, [breakdownMaterial, fetchMaterialBreakdown]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/materials', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch catalog');
      const result = await res.json();
      setCatalog(Array.isArray(result) ? result : result.data || []);
    } catch (error) {
      console.error("Error fetching catalog:", error);
      addToast('Error fetching material catalog', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    fetchBranchMaterials();
  }, [fetchBranchMaterials]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!user?.branchId) {
      addToast('No branch associated with your account', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/branches/${user.branchId}/materials/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(activationData)
      });

      if (!response.ok) throw new Error('Failed to activate material');
      
      addToast('Material activated for this branch', 'success');
      setIsActivationModalOpen(false);
      fetchBranchMaterials();
    } catch (error) {
      console.error("Error activating material:", error);
      addToast('Error activating material', 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingMaterial) return;

    try {
      const response = await fetch(`/api/branch-materials/${editingMaterial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData)
      });

      if (!response.ok) throw new Error('Failed to update material');
      
      addToast('Material settings updated', 'success');
      setIsEditModalOpen(false);
      fetchBranchMaterials();
    } catch (error) {
      console.error("Error updating material:", error);
      addToast('Error updating material', 'error');
    }
  };

  const toggleStatus = async (bm) => {
    try {
      const response = await fetch(`/api/branch-materials/${bm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !bm.isActive })
      });

      if (!response.ok) throw new Error('Failed to toggle status');
      
      addToast(`Material ${!bm.isActive ? 'activated' : 'deactivated'}`, 'success');
      fetchBranchMaterials();
    } catch (error) {
      console.error("Error toggling status:", error);
      addToast('Error toggling status', 'error');
    }
  };

  // Get materials from catalog that are NOT yet activated for this branch
  const availableCatalog = catalog.filter(catItem => 
    !data?.data.some(bm => bm.materialId === catItem.id)
  );

  const columns = [
    {
      header: 'Material',
      accessor: (bm) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-white",
            bm.isActive ? "bg-primary" : "bg-text-tertiary"
          )}>
            <Package className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-text-primary tracking-tight">{bm.material?.name}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">{bm.material?.category}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'material.name',
    },
    {
      header: 'Status',
      accessor: (bm) => (
        <div className="flex justify-center">
          <button 
            onClick={() => toggleStatus(bm)}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              bm.isActive ? "text-success bg-success/10 hover:bg-success/20" : "text-text-tertiary bg-background hover:bg-border"
            )}
            title={bm.isActive ? "Deactivate" : "Activate"}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-center',
    },
    {
      header: 'Current Stock',
      accessor: (bm) => (
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-bold",
            bm.currentStock <= bm.reorderThreshold ? "text-warning" : "text-text-primary"
          )}>
            {bm.currentStock} {bm.material?.unit}
          </span>
          {bm.currentStock <= bm.reorderThreshold && (
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          )}
        </div>
      ),
      sortable: true,
      sortKey: 'currentStock',
    },
    {
      header: 'Reorder Threshold',
      accessor: (bm) => (
        <span className="text-sm font-medium text-text-secondary">{bm.reorderThreshold} {bm.material?.unit}</span>
      ),
      sortable: true,
      sortKey: 'reorderThreshold',
    },
    {
      header: 'Actions',
      accessor: (bm) => (
        <div className="flex justify-end gap-2">
          {isSuperAdmin && (
            <button 
              onClick={() => setBreakdownMaterial(bm)}
              className="p-2 hover:bg-background rounded-lg text-text-tertiary hover:text-primary transition-colors"
              title="View Branch Breakdown"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => {
              setEditingMaterial(bm);
              setEditData({ reorderThreshold: bm.reorderThreshold, isActive: bm.isActive });
              setIsEditModalOpen(true);
            }}
            className="p-2 hover:bg-background rounded-lg text-text-tertiary hover:text-primary transition-colors"
            title="Edit Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Breadcrumbs items={[{ label: 'Material Distribution' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Material Distribution</h1>
          <p className="text-text-tertiary mt-1">
            {isSuperAdmin 
              ? "Manage and compare material allocation across all branches." 
              : "Manage materials available for your branch and set thresholds."}
          </p>
        </div>
        {!isSuperAdmin && (
          <button 
            onClick={() => setIsActivationModalOpen(true)}
            className="stitch-button-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Activate New Material
          </button>
        )}
      </div>

      <FilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search materials, categories..."
      >
        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-text-tertiary" />
              <select 
                className="stitch-input h-10 min-w-[160px]"
                value={getFilter('branchId')}
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
              className="stitch-input h-10 min-w-[160px]"
              value={getFilter('category')}
              onChange={(e) => setFilter('category', e.target.value)}
            >
              {categories.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
            </select>
          </div>
        </div>
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
          title: 'No materials allocated',
          description: 'Activate materials from the catalog to start tracking them in this branch.',
          icon: <ArrowRightLeft className="w-6 h-6 text-text-tertiary" />,
        }}
        rowClassName={(bm) => !bm.isActive ? "opacity-60 grayscale-[0.5]" : ""}
      />

      {/* Activation Modal */}
      <AnimatePresence>
        {isActivationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActivationModalOpen(false)}
              className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-background/50">
                <h2 className="text-xl font-bold text-text-primary tracking-tight">Activate Material</h2>
                <p className="text-sm text-text-tertiary mt-1">Select a material from the catalog to track in your branch.</p>
              </div>

              <form onSubmit={handleActivate} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Select Material</label>
                  <select 
                    required
                    className="stitch-input w-full"
                    value={activationData.materialId}
                    onChange={(e) => setActivationData({ ...activationData, materialId: e.target.value })}
                  >
                    <option value="">-- Choose a material --</option>
                    {availableCatalog.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Reorder Threshold</label>
                  <input 
                    type="number"
                    min="0"
                    className="stitch-input w-full"
                    placeholder="Alert when stock falls below..."
                    value={activationData.reorderThreshold}
                    onChange={(e) => setActivationData({ ...activationData, reorderThreshold: Number(e.target.value) })}
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsActivationModalOpen(false)}
                    className="flex-1 stitch-button-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!activationData.materialId}
                    className="flex-1 stitch-button-primary disabled:opacity-50"
                  >
                    Activate
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Settings Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-background/50">
                <h2 className="text-xl font-bold text-text-primary tracking-tight">Material Settings</h2>
                <p className="text-sm text-text-tertiary mt-1">{editingMaterial.material?.name}</p>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Reorder Threshold</label>
                  <input 
                    type="number"
                    min="0"
                    className="stitch-input w-full"
                    value={editData.reorderThreshold}
                    onChange={(e) => setEditData({ ...editData, reorderThreshold: Number(e.target.value) })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border">
                  <div>
                    <p className="text-sm font-bold text-text-primary">Active Status</p>
                    <p className="text-xs text-text-tertiary">Disable to stop tracking this material.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setEditData({ ...editData, isActive: !editData.isActive })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      editData.isActive ? "bg-success" : "bg-text-tertiary"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      editData.isActive ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 stitch-button-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 stitch-button-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Branch Breakdown Modal */}
      <Modal
        isOpen={!!breakdownMaterial}
        onClose={() => setBreakdownMaterial(null)}
        title="Branch-wise Stock Breakdown"
        description={breakdownMaterial?.material?.name}
      >
        <div className="space-y-4">
          {isBreakdownLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="font-medium">Fetching branch data...</p>
            </div>
          ) : breakdownData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-6 h-6 text-text-tertiary" />
              </div>
              <p className="text-text-primary font-bold">No branch records found</p>
              <p className="text-text-tertiary text-sm">This material is not active in any branch.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/50 border-b border-border">
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Branch</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Stock</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Threshold</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {breakdownData.map((item) => {
                    const isLow = item.currentStock > 0 && item.currentStock <= item.reorderThreshold;
                    const isOut = item.currentStock === 0;
                    
                    return (
                      <tr key={item.id} className="hover:bg-background/30 transition-colors">
                        <td className="p-3 font-bold text-text-primary text-sm">{item.branch?.name}</td>
                        <td className="p-3 text-sm text-text-secondary">
                          {item.currentStock} {breakdownMaterial?.material?.unit}
                        </td>
                        <td className="p-3 text-sm text-text-secondary">
                          {item.reorderThreshold} {breakdownMaterial?.material?.unit}
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            isOut ? "bg-danger/10 text-danger" :
                            isLow ? "bg-warning/10 text-warning" :
                            "bg-success/10 text-success"
                          )}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="pt-4">
            <button 
              onClick={() => setBreakdownMaterial(null)}
              className="w-full stitch-button-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
