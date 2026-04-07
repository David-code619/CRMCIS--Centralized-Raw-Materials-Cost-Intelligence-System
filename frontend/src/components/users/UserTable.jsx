import React from 'react';
import { Edit2, Power, Trash2, Shield, Building2, Mail, Calendar, User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { StatusBadge } from '../ui/StatusBadge';

export function UserTable({ users, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="stitch-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-background/50">
              <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">User</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Role</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Branch</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Status</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Joined</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-text-tertiary">
                  <UserIcon className="w-10 h-10 mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-lg">No users found</p>
                  <p className="text-sm">Try adjusting your filters or invite a new user.</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-background/50 transition-colors group">
                  <td className="p-4">
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
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Shield className={cn(
                        "w-4 h-4",
                        user.role === 'SUPER_ADMIN' ? "text-primary" : "text-text-tertiary"
                      )} />
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm font-medium text-text-secondary">
                        {user.branch?.name || 'Global Access'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={user.isActive ? 'success' : 'danger'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-tertiary" />
                      <span className="text-xs text-text-tertiary font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(user)}
                        className="p-2 text-text-tertiary hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(user.id, !user.isActive)}
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
                            onDelete(user.id);
                          }
                        }}
                        className="p-2 text-text-tertiary hover:text-danger hover:bg-danger/5 rounded-lg transition-all"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
