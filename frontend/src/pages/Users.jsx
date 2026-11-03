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
import { usersApi, branchesApi, api } from '../lib/api';

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
      const result = await usersApi.list({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        role: getFilter('role'),
        branchId: getFilter('branchId'),
        isActive: getFilter('isActive'),
      });
      setData(result);
    } catch (error) {
      console.error('Fetch users error:', error);
      addToast(error.message || 'Failed to load users', 'error');
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
        const data = await branchesApi.list();
        setBranches(Array.isArray(data) ? data : data?.data || []);
      } catch (error) {
        addToast(error.message || 'Failed to load branches', 'error');
        setBranches([]);
      }
    }
    fetchBranches();
  }, [addToast]);

  const handleSaveUser = async (formData) => {
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, formData);
        addToast('User updated successfully', 'success');
      } else {
        await usersApi.create(formData);
        addToast('User invited successfully', 'success');
      }
      fetchUsers();
    } catch (error) {
      addToast(error.message || 'Failed to save user', 'error');
      throw error;
    }
  };

  const handleToggleStatus = async (id, isActive) => {
    try {
      await api.patch(`/api/users/${id}/toggle-status`, { isActive });
      addToast(`User ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchUsers();
    } catch (error) {
      addToast(error.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await usersApi.delete(id);
      addToast('User deleted successfully', 'success');
      fetchUsers();
    } catch (error) {
      addToast(error.message || 'Failed to delete user', 'error');
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
      accessor: (user) => {
        const canEdit = currentUser?.role === 'SUPER_ADMIN' || (currentUser?.role === 'BRANCH_MANAGER' && user.role === 'INVENTORY_OFFICER');
        
        if (!canEdit) return null;

        return (
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
      );
    },
      className: 'text-right',
    },
  ];

  return (
    <div className="w-full space-y-8 pb-8">
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
          value={(data?.data || []).filter(u => u.isActive).length || 0} 
          icon={ShieldCheck}
          color="success"
          description="Users with system access"
        />
        <KPICard 
          title="Super Admins" 
          value={(data?.data || []).filter(u => u.role === 'SUPER_ADMIN').length || 0} 
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
          className="stitch-input h-10 min-w-35"
          value={getFilter('role')}
          onChange={(e) => setFilter('role', e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="BRANCH_MANAGER">Branch Manager</option>
          <option value="INVENTORY_OFFICER">Inventory Officer</option>
        </select>

        <select 
          className="stitch-input h-10 min-w-35"
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
          className="stitch-input h-10 min-w-35"
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
        currentUser={currentUser}
      />
    </div>
  );
}
