import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Database, Globe } from 'lucide-react';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Profile');

  const tabs = {
    'Profile': <ProfileSettings user={user} />,
    'Security': <SecuritySettings />,
    'Notifications': <NotificationSettings />,
  };

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
            {Object.keys(tabs).map(tab => (
              <SettingsLink 
                key={tab} 
                icon={tab === 'Profile' ? User : tab === 'Security' ? Shield : Bell} 
                label={tab} 
                active={activeTab === tab} 
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          {tabs[activeTab] || <ProfileSettings user={user} />}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ user }) {
  return (
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
  );
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdatePassword = async () => {
    setError('');
    setMessage('');
    try {
      const response = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stitch-card p-6">
      <h3 className="text-lg font-bold text-text-primary mb-6">Security Settings</h3>
      <div className="space-y-4">
        {error && <p className="text-danger text-xs">{error}</p>}
        {message && <p className="text-success text-xs">{message}</p>}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Current Password</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="stitch-input w-full" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="stitch-input w-full" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="stitch-input w-full" />
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-border">
        <button onClick={handleUpdatePassword} className="stitch-button-primary">Update Password</button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    // Mock API call
    setMessage('Preferences saved (Mock)');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="stitch-card p-6">
      <h3 className="text-lg font-bold text-text-primary mb-6">Notification Preferences</h3>
      {message && <p className="text-success text-xs mb-4">{message}</p>}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Email Notifications</span>
          <input type="checkbox" className="stitch-checkbox" checked={emailNotifications} onChange={e => setEmailNotifications(e.target.checked)} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Push Notifications</span>
          <input type="checkbox" className="stitch-checkbox" checked={pushNotifications} onChange={e => setPushNotifications(e.target.checked)} />
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-border">
        <button onClick={handleSave} className="stitch-button-primary">Save Preferences</button>
        <p className="text-[10px] text-text-tertiary mt-2">Note: Backend storage for notification preferences requires a database schema update.</p>
      </div>
    </div>
  );
}

function SettingsLink({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
      active ? 'bg-primary text-white shadow-md' : 'text-text-tertiary hover:bg-background hover:text-text-primary'
    }`}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
