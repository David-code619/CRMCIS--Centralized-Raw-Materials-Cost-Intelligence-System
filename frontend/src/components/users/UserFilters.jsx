import React from 'react';
import { Search, Building2, ShieldCheck, Filter, X } from 'lucide-react';

const ROLES = ['SUPER_ADMIN', 'BRANCH_ADMIN', 'STAFF'];

export function UserFilters({ filters, setFilters, branches }) {
  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      branchId: '',
      isActive: ''
    });
  };

  return (
    <div className="stitch-card p-4 bg-background/50 backdrop-blur-sm border-border/50">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[200px]">
          <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <select 
            className="stitch-input pl-10 w-full text-xs py-2"
            value={filters.role}
            onChange={(e) => handleChange('role', e.target.value)}
          >
            <option value="">All Roles</option>
            {ROLES.map(role => (
              <option key={role} value={role}>{role.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[200px]">
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

        <div className="relative min-w-[160px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <select 
            className="stitch-input pl-10 w-full text-xs py-2"
            value={filters.isActive}
            onChange={(e) => handleChange('isActive', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <button 
          onClick={clearFilters}
          className="p-2 text-text-tertiary hover:text-danger transition-colors ml-auto"
          title="Clear Filters"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
