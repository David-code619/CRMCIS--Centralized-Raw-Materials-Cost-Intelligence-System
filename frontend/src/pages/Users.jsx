import React, { useState, useEffect, useCallback } from 'react';
import { Plus, UserPlus, Loader2, Users as UsersIcon, ShieldCheck, Mail, Calendar, Edit2, Power, Trash2, Shield, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { UserModal } from '../components/users/UserModal';
import { KPICard } from '../components/ui/KPICard';
import { DataTable } from '../components/ui/DataTable';
import { FilterToolbar } from '../components/ui/FilterToolbar';
import { useDataTable } from '../hooks/useDataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { cn } from '../lib/utils';

export function Users() {
  const { user: currentUser } = useAuth();
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
  } = useDataTable({ defaultSortBy: 'name', defaultSortOrder: 'asc' });

  const [data, setData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
        role: getFilter('role'),
        branchId: getFilter('branchId'),
        isActive: getFilter('isActive'),
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users?${queryParams.toString()}`, { credentials: 'include' });
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Fetch users error:', error);
      addToast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder, getFilter, addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/branches`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to load branches');
        const data = await response.json();
        if (Array.isArray(data)) {
          setBranches(data);
        } else {
          console.error('Invalid branches data:', data);
          setBranches([]);
        }
      } catch (error) {
        addToast('Failed to load branches', 'error');
        setBranches([]);
      }
    }
    fetchBranches();
  }, [addToast]);

  const handleSaveUser = async (formData) => {
    try {
      const method = editingUser ? 'PATCH' : 'POST';
      const url = editingUser ? `${import.meta.env.VITE_API_URL}/api/users/${editingUser.id}` : `${import.meta.env.VITE_API_URL}/api/users`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save user');
      }

      addToast(editingUser ? 'User updated successfully' : 'User invited successfully', 'success');
      fetchUsers();
    } catch (error) {
      addToast(error.message, 'error');
      throw error;
    }
  };

  const handleToggleStatus = async (id, isActive) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update status');
      }

      addToast(`User ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchUsers();
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete user');
      }

      addToast('User deleted successfully', 'success');
      fetchUsers();
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: 'User',
      accessor: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shadow-inner">
            {user.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary tracking-tight">{user.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3 h-3 text-text-tertiary" />
              <p className="text-[10px] text-text-tertiary font-medium">{user.email}</p>
            </div>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'name',
    },
    {
      header: 'Role',
      accessor: (user) => (
        <div className="flex items-center gap-2">
          <Shield className={cn(
            "w-4 h-4",
            user.role === 'SUPER_ADMIN' ? "text-primary" : "text-text-tertiary"
          )} />
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            {user.role.replace('_', ' ')}
          </span>
        </div>
      ),
      sortable: true,
      sortKey: 'role',
    },
    {
      header: 'Branch',
      accessor: (user) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm font-medium text-text-secondary">
            {user.branch?.name || 'Global Access'}
          </span>
        </div>
      ),
      sortable: true,
      sortKey: 'branchId',
    },
    {
      header: 'Status',
      accessor: (user) => (
        <StatusBadge status={user.isActive ? 'success' : 'danger'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
      sortable: true,
      sortKey: 'isActive',
    },
    {
      header: 'Joined',
      accessor: (user) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-tertiary" />
          <span className="text-xs text-text-tertiary font-medium">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
      sortable: true,
      sortKey: 'createdAt',
    },
    {
      header: 'Actions',
      accessor: (user) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEditModal(user)}
            className="p-2 text-text-tertiary hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
            title="Edit User"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(user.id, !user.isActive)}
            className={cn(
              "p-2 rounded-lg transition-all",
              user.isActive 
                ? "text-text-tertiary hover:text-danger hover:bg-danger/5" 
                : "text-text-tertiary hover:text-success hover:bg-success/5"
            )}
            title={user.isActive ? "Deactivate User" : "Activate User"}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                handleDeleteUser(user.id);
              }
            }}
            className="p-2 text-text-tertiary hover:text-danger hover:bg-danger/5 rounded-lg transition-all"
            title="Delete User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: 'User Management' }]} />
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Users & Roles</h1>
          <p className="text-text-tertiary mt-1 font-medium">Manage system access, roles, and branch assignments.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="stitch-button-primary flex items-center gap-2 py-2.5"
        >
          <UserPlus className="w-4 h-4" />
          Invite New User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Total Users" 
          value={data?.pagination?.totalItems || 0} 
          icon={UsersIcon}
          color="primary"
          description="Registered team members"
        />
        <KPICard 
          title="Active Users" 
          value={data?.data.filter(u => u.isActive).length || 0} 
          icon={ShieldCheck}
          color="success"
          description="Users with system access"
        />
        <KPICard 
          title="Super Admins" 
          value={data?.data.filter(u => u.role === 'SUPER_ADMIN').length || 0} 
          icon={ShieldCheck}
          color="info"
          description="Full system control"
        />
      </div>

      <FilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by name or email..."
      >
        <select 
          className="stitch-input h-10 min-w-[140px]"
          value={getFilter('role')}
          onChange={(e) => setFilter('role', e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="BRANCH_MANAGER">Branch Manager</option>
          <option value="INVENTORY_OFFICER">Inventory Officer</option>
        </select>

        <select 
          className="stitch-input h-10 min-w-[140px]"
          value={getFilter('branchId')}
          onChange={(e) => setFilter('branchId', e.target.value)}
        >
          <option value="">All Branches</option>
          {Array.from(new Set(branches.map(b => b.id))).map((id) => {
            const b = branches.find(branch => branch.id === id);
            return <option key={id} value={id}>{b.name}</option>;
          })}
        </select>

        <select 
          className="stitch-input h-10 min-w-[140px]"
          value={getFilter('isActive')}
          onChange={(e) => setFilter('isActive', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
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

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveUser} 
        user={editingUser}
        branches={branches}
      />
    </div>
  );
}
