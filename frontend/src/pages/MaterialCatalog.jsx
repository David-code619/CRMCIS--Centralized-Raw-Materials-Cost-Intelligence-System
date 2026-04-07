import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Package, 
  Loader2,
} from 'lucide-react';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DataTable } from '../components/ui/DataTable';
import { FilterToolbar } from '../components/ui/FilterToolbar';
import { useDataTable } from '../hooks/useDataTable';

export function MaterialCatalog() {
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
  } = useDataTable({ defaultSortBy: 'name', defaultSortOrder: 'asc' });

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const { addToast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Raw Material',
    unit: 'kg',
    description: ''
  });

  const categories = ['All', 'Raw Material', 'Packaging', 'Chemicals', 'Other'];
  const units = ['kg', 'g', 'L', 'ml', 'pcs', 'box', 'roll', 'bag'];

  const fetchMaterials = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
        category: getFilter('category'),
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/materials?${queryParams.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch materials');
      const result = await response.json();
      setData(result);
    } catch (error) {
      addToast('Error fetching material catalog', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder, getFilter, addToast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleOpenModal = (material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        category: material.category,
        unit: material.unit,
        description: material.description || ''
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        name: '',
        category: 'Raw Material',
        unit: 'kg',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingMaterial ? `${import.meta.env.VITE_API_URL}/api/materials/${editingMaterial.id}` : `${import.meta.env.VITE_API_URL}/api/materials`;
      const method = editingMaterial ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save material');
      
      addToast(editingMaterial ? 'Material updated' : 'Material added to catalog', 'success');
      setIsModalOpen(false);
      fetchMaterials();
    } catch (error) {
      addToast('Error saving material', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this material from the global catalog? This may affect branch inventory.')) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/materials/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) throw new Error('Failed to delete material');
      addToast('Material removed from catalog', 'success');
      fetchMaterials();
    } catch (error) {
      addToast('Error deleting material', 'error');
    }
  };

  const columns = [
    {
      header: 'Material Name',
      accessor: (material) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-text-primary">{material.name}</p>
            <p className="text-xs text-text-tertiary truncate max-w-[200px]">{material.description || 'No description'}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'name',
    },
    {
      header: 'Category',
      accessor: (material) => (
        <span className="px-2 py-1 bg-background border border-border rounded-md text-[10px] font-bold uppercase tracking-wider text-text-secondary">
          {material.category}
        </span>
      ),
      sortable: true,
      sortKey: 'category',
    },
    {
      header: 'Default Unit',
      accessor: (material) => (
        <span className="text-sm font-medium text-text-secondary">{material.unit}</span>
      ),
      sortable: true,
      sortKey: 'unit',
    },
    {
      header: 'Last Updated',
      accessor: (material) => new Date(material.updatedAt).toLocaleDateString(),
      sortable: true,
      sortKey: 'updatedAt',
    },
    {
      header: 'Actions',
      accessor: (material) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => handleOpenModal(material)}
            className="p-2 hover:bg-background rounded-lg text-text-tertiary hover:text-primary transition-colors"
            title="Edit Material"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(material.id)}
            className="p-2 hover:bg-background rounded-lg text-text-tertiary hover:text-error transition-colors"
            title="Delete Material"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'Material Catalog' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Material Catalog</h1>
          <p className="text-text-tertiary mt-1">Manage the master list of raw materials for all branches.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="stitch-button-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Material
        </button>
      </div>

      <FilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search materials by name or description..."
      >
        <select 
          className="stitch-input h-10 min-w-[160px]"
          value={getFilter('category')}
          onChange={(e) => setFilter('category', e.target.value === 'All' ? undefined : e.target.value)}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
      />

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface rounded-3xl shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-6 border-bottom border-border bg-background/50">
                <h2 className="text-xl font-bold text-text-primary tracking-tight">
                  {editingMaterial ? 'Edit Material' : 'Add New Material'}
                </h2>
                <p className="text-sm text-text-tertiary mt-1">
                  {editingMaterial ? 'Update material details in the global catalog.' : 'Define a new raw material for the entire chain.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Material Name</label>
                  <input 
                    required
                    type="text"
                    className="stitch-input w-full"
                    placeholder="e.g., Fresh Chicken Breast"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Category</label>
                    <select 
                      className="stitch-input w-full"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Default Unit</label>
                    <select 
                      className="stitch-input w-full"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Description (Optional)</label>
                  <textarea 
                    className="stitch-input w-full min-h-[100px] py-3"
                    placeholder="Brief description of the material..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 stitch-button-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 stitch-button-primary"
                  >
                    {editingMaterial ? 'Update Material' : 'Add to Catalog'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
