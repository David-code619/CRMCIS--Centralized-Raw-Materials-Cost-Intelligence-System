import { 
  Calendar, 
  Building2, 
  Package, 
  Tag, 
  Download, 
  Filter,
  X
} from 'lucide-react';


export function ReportFilters({ 
  filters, 
  setFilters, 
  branches, 
  materials, 
  categories,
  isSuperAdmin 
}) {
  
  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      branchId: isSuperAdmin ? '' : filters.branchId,
      materialId: '',
      category: '',
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="stitch-card p-4 bg-background/50 backdrop-blur-sm border-border/50">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-xl">
          <Calendar className="w-4 h-4 text-text-tertiary" />
          <input 
            type="date"
            className="text-xs font-bold text-text-primary bg-transparent outline-none border-none"
            value={filters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
          <span className="text-text-tertiary text-[10px] font-bold">TO</span>
          <input 
            type="date" 
            className="text-xs font-bold text-text-primary bg-transparent outline-none border-none"
            value={filters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>

        {isSuperAdmin && (
          <div className="relative min-w-40">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <select 
              className="stitch-input pl-10 w-full text-xs py-2"
              value={filters.branchId}
              onChange={(e) => handleChange('branchId', e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <div className="relative min-w-40">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <select 
            className="stitch-input pl-10 w-full text-xs py-2"
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="relative min-w-40">
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <select 
            className="stitch-input pl-10 w-full text-xs py-2"
            value={filters.materialId}
            onChange={(e) => handleChange('materialId', e.target.value)}
          >
            <option value="">All Materials</option>
            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button 
            onClick={clearFilters}
            className="p-2 text-text-tertiary hover:text-danger transition-colors"
            title="Clear Filters"
          >
            <X className="w-4 h-4" />
          </button>
          <button className="stitch-button-secondary flex items-center gap-2 py-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
