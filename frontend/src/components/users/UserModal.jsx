import React, { useState, useEffect } from 'react';
import { X, Mail, User, Shield, Building2, Lock, Loader2 } from 'lucide-react';

const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BRANCH_ADMIN: 'BRANCH_ADMIN',
  INVENTORY_OFFICER: 'INVENTORY_OFFICER',
  STAFF: 'STAFF'
};

export function UserModal({ isOpen, onClose, onSave, user, branches }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: Role.INVENTORY_OFFICER,
    branchId: '',
    password: '',
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || Role.INVENTORY_OFFICER,
        branchId: user.branchId || '',
        password: '', // Don't show password on edit
        isActive: user.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: Role.INVENTORY_OFFICER,
        branchId: '',
        password: '',
        isActive: true
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="stitch-card w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between bg-background/50">
          <h2 className="text-xl font-bold text-text-primary tracking-tight">
            {user ? 'Edit User' : 'Invite New User'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-background rounded-lg transition-colors">
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                required
                type="text"
                className="stitch-input pl-10 w-full"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                required
                type="email"
                className="stitch-input pl-10 w-full"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {!user && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">Initial Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  required
                  type="password"
                  className="stitch-input pl-10 w-full"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <p className="text-[10px] text-text-tertiary mt-1 ml-1">User can change this after first login.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">System Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <select
                  className="stitch-input pl-10 w-full"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, branchId: e.target.value === Role.SUPER_ADMIN ? '' : formData.branchId })}
                >
                  {Object.values(Role).map(role => (
                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">Assigned Branch</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <select
                  disabled={formData.role === Role.SUPER_ADMIN}
                  className="stitch-input pl-10 w-full disabled:opacity-50"
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  required={formData.role !== Role.SUPER_ADMIN}
                >
                  <option value="">Select Branch</option>
                  {Array.from(new Set(branches.map(b => b.id))).map((id) => {
                    const b = branches.find(branch => branch.id === id);
                    return <option key={id} value={id}>{b.name}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="stitch-button-secondary py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="stitch-button-primary py-2 min-w-[120px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                user ? 'Update User' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
