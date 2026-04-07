import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  BookOpen, 
  Store, 
  ShoppingCart, 
  History, 
  ArrowLeftRight, 
  BarChart3, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar({ isCollapsed, onToggleCollapse, className }) {
  const { user } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_OFFICER'] },
    { icon: Package, label: 'Inventory', path: '/inventory', roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'] },
    { icon: BookOpen, label: 'Material Catalog', path: '/material-catalog', roles: ['SUPER_ADMIN'] },
    { icon: Store, label: 'Material Distribution', path: '/branch-materials' },
    { icon: ShoppingCart, label: 'Purchase Log', path: '/purchases' },
    { icon: History, label: 'Adjustments', path: '/adjustments' },
    { icon: ArrowLeftRight, label: 'Transfers', path: '/transfers' },
    { icon: ClipboardList, label: 'Usage Log', path: '/usage' },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'] },
    { icon: Users, label: 'User Management', path: '/users', roles: ['SUPER_ADMIN'] },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className={cn(
      'flex flex-col bg-surface border-r border-border transition-all duration-300 ease-in-out z-30',
      isCollapsed ? 'w-20' : 'w-72',
      className
    )}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm">
          <Package className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <span className="ml-3 font-bold text-xl tracking-tight text-text-primary">CRMCIS</span>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
              isActive 
                ? 'bg-primary/10 text-primary font-bold shadow-sm' 
                : 'text-text-secondary hover:bg-background hover:text-text-primary'
            )}
          >
            <item.icon className={cn(
              'w-5 h-5 shrink-0 transition-transform group-hover:scale-110',
              isCollapsed && 'mx-auto'
            )} />
            {!isCollapsed && <span className="text-sm tracking-tight">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-background hover:bg-surface border border-border transition-colors text-text-secondary hover:text-text-primary"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Collapse Menu</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
