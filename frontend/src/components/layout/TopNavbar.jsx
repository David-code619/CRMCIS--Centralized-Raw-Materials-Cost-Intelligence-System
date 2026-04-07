import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Search, User, LogOut, Settings, HelpCircle, Menu, AlertCircle, Package, ArrowRightLeft, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from '../ThemeToggle';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';

export function TopNavbar({ onMenuClick, className }) {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch('/api/notifications?limit=5');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
      
      const countRes = await apiFetch('/api/notifications/unread-count');
      if (countRes.ok) {
        const { count } = await countRes.json();
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const markRead = async (id) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const deleted = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (deleted && !deleted.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getIcon = (title) => {
    const t = title.toLowerCase();
    if (t.includes('stock') || t.includes('inventory')) return Package;
    if (t.includes('transfer')) return ArrowRightLeft;
    if (t.includes('alert') || t.includes('warning')) return AlertCircle;
    return Bell;
  };

  return (
    <header className={cn(
      'h-16 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm',
      className
    )}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-background rounded-md transition-colors text-text-secondary"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-background border border-border rounded-full w-80 group focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <Search className="w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="bg-transparent border-none outline-none text-sm w-full text-text-primary placeholder:text-text-tertiary"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-surface border border-border rounded text-[10px] font-bold text-text-tertiary">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 hover:bg-background rounded-full transition-colors text-text-secondary relative group"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4.5 h-4.5 px-1 bg-danger text-white text-[10px] font-bold rounded-full border-2 border-surface flex items-center justify-center group-hover:scale-110 transition-transform">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsNotificationsOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 md:w-96 bg-surface border border-border rounded-2xl shadow-2xl z-20 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-border bg-background/30 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-100 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-6 h-6 text-text-tertiary" />
                        </div>
                        <p className="text-sm font-medium text-text-primary">No notifications yet</p>
                        <p className="text-xs text-text-tertiary mt-1">We&apos;ll notify you when something important happens.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((n) => {
                          const Icon = getIcon(n.title);
                          return (
                            <div 
                              key={n.id}
                              onClick={() => {
                                if (!n.isRead) markRead(n.id);
                                if (n.link) setIsNotificationsOpen(false);
                              }}
                              className={cn(
                                "p-4 flex gap-3 hover:bg-background/50 transition-colors cursor-pointer group relative",
                                !n.isRead && "bg-primary/5"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                !n.isRead ? "bg-primary/10 text-primary" : "bg-background text-text-tertiary"
                              )}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={cn(
                                    "text-sm truncate",
                                    !n.isRead ? "font-bold text-text-primary" : "font-medium text-text-secondary"
                                  )}>
                                    {n.title}
                                  </p>
                                  <span className="text-[10px] text-text-tertiary whitespace-nowrap">
                                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-xs text-text-tertiary line-clamp-2 mt-0.5 leading-relaxed">
                                  {n.message}
                                </p>
                                {n.link && (
                                  <Link 
                                    to={n.link}
                                    className="text-[10px] font-bold text-primary hover:underline mt-2 inline-block uppercase tracking-widest"
                                  >
                                    View Details
                                  </Link>
                                )}
                              </div>
                              <button 
                                onClick={(e) => deleteNotif(e, n.id)}
                                className="absolute top-4 right-4 p-1 opacity-0 group-hover:opacity-100 hover:bg-background rounded-md transition-all text-text-tertiary"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-border bg-background/30 text-center">
                    <Link 
                      to="/settings" 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-xs font-bold text-text-secondary hover:text-primary transition-colors"
                    >
                      Notification Settings
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        <button className="p-2 hover:bg-background rounded-full transition-colors text-text-secondary">
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-8 w-px bg-border mx-2" />

        <div className="relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 hover:bg-background rounded-full transition-colors group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-text-primary tracking-tight">{user?.name}</p>
              <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">{user?.role.replace('_', ' ')}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              {user?.name.split(' ').map(n => n[0]).join('')}
            </div>
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsUserMenuOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl z-20 py-2 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-border bg-background/30">
                    <p className="text-sm font-bold text-text-primary">{user?.name}</p>
                    <p className="text-xs text-text-tertiary truncate">{user?.email}</p>
                  </div>
                  
                  <div className="p-1">
                    <UserMenuItem icon={User} label="My Profile" />
                    <UserMenuItem icon={Settings} label="Account Settings" />
                    <UserMenuItem icon={HelpCircle} label="Support Center" />
                  </div>
                  
                  <div className="border-t border-border p-1 mt-1">
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function UserMenuItem({ icon: Icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary hover:bg-background hover:text-text-primary rounded-lg transition-colors"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}