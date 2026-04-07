import React from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Database, Globe } from 'lucide-react';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useAuth } from '../contexts/AuthContext';

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <Breadcrumbs items={[{ label: 'Settings' }]} />
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">System Settings</h1>
        <p className="text-text-tertiary mt-1 font-medium">Manage your profile and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <nav className="space-y-1">
            <SettingsLink icon={User} label="Profile" active />
            <SettingsLink icon={Shield} label="Security" />
            <SettingsLink icon={Bell} label="Notifications" />
            <SettingsLink icon={Database} label="Data Management" />
            <SettingsLink icon={Globe} label="Localization" />
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="stitch-card p-6">
            <h3 className="text-lg font-bold text-text-primary mb-6">Profile Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Full Name</label>
                  <input type="text" className="stitch-input w-full" defaultValue={user?.name} readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Email Address</label>
                  <input type="email" className="stitch-input w-full" defaultValue={user?.email} readOnly />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Role</label>
                  <input type="text" className="stitch-input w-full" defaultValue={user?.role} readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Branch ID</label>
                  <input type="text" className="stitch-input w-full" defaultValue={user?.branchId || 'N/A'} readOnly />
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-border">
              <button className="stitch-button-primary" disabled>Update Profile</button>
              <p className="text-[10px] text-text-tertiary mt-2 italic">Profile updates are currently managed by System Administrators.</p>
            </div>
          </div>

          <div className="stitch-card p-6 border-danger/20 bg-danger/5">
            <h3 className="text-lg font-bold text-danger mb-2">Danger Zone</h3>
            <p className="text-xs text-text-secondary mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button className="px-4 py-2 bg-danger text-white rounded-xl text-xs font-bold opacity-50 cursor-not-allowed">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsLink({ icon: Icon, label, active }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
      active ? 'bg-primary text-white shadow-md' : 'text-text-tertiary hover:bg-background hover:text-text-primary'
    }`}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
