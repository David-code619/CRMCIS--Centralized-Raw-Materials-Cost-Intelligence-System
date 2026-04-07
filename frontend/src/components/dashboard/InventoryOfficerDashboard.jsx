import React from 'react';
import { 
  ShoppingCart, 
  Activity, 
  RefreshCw, 
  ArrowLeftRight, 
  ClipboardCheck, 
  History, 
  AlertTriangle,
  ArrowRight,
  Truck,
  Scale,
  Settings2,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { StatusBadge } from '../ui/StatusBadge';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export function InventoryOfficerDashboard({ stats, onRefresh }) {
  const recentEntries = stats.recentActivity || [];
  const lowStockItems = stats.lowStockItems || [];
  const incomingTransfers = stats.incomingTransfers || [];
  const pendingTasks = stats.pendingTasks || [];

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs />
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Inventory Workspace</h2>
          <p className="text-text-secondary mt-1 font-medium">
            Daily operations and stock management tools.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={onRefresh} className="stitch-button-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Sync Data</span>
          </button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickActionCard 
          title="Log Purchase" 
          description="Record new stock arrival" 
          icon={ShoppingCart} 
          color="primary"
          href="/purchases"
        />
        <QuickActionCard 
          title="Log Usage" 
          description="Record daily consumption" 
          icon={Activity} 
          color="success"
          href="/usage"
        />
        <QuickActionCard 
          title="Stock Adjustment" 
          description="Correct inventory levels" 
          icon={Settings2} 
          color="warning"
          href="/inventory"
        />
        <QuickActionCard 
          title="Request Transfer" 
          description="Move stock between branches" 
          icon={ArrowLeftRight} 
          color="info"
          href="/transfers"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Entries */}
        <div className="lg:col-span-2 space-y-6">
          <div className="stitch-card overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-background/30">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-text-primary tracking-tight">Your Recent Entries</h3>
              </div>
              <button className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">View History</button>
            </div>
            <div className="divide-y divide-border">
              {recentEntries.length > 0 ? (
                recentEntries.map((entry) => (
                  <EntryItem 
                    key={entry.id}
                    type={entry.type} 
                    item={entry.detail.split(' ').slice(1).join(' ')} 
                    amount={entry.detail.split(' ')[0]} 
                    time={new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    status={entry.type === 'Purchase' ? 'success' : entry.type === 'Usage' ? 'info' : 'warning'}
                  />
                ))
              ) : (
                <div className="p-8 text-center text-text-tertiary">No recent entries found</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="stitch-card p-6 bg-danger/5 border-danger/10">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-danger" />
                <h4 className="font-bold text-text-primary tracking-tight">Low Stock Alerts</h4>
              </div>
              <div className="space-y-3">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <LowStockItem key={item.id || item.item} item={item.item} stock={item.stock} threshold={item.threshold} />
                  ))
                ) : (
                  <div className="text-xs text-text-tertiary">No low stock items</div>
                )}
              </div>
              <button className="w-full mt-4 py-2 bg-danger text-white rounded-lg text-xs font-bold hover:bg-danger/90 transition-all">
                Create Reorder Request
              </button>
            </div>

            <div className="stitch-card p-6 bg-primary/5 border-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-text-primary tracking-tight">Incoming Transfers</h4>
              </div>
              <div className="space-y-3">
                {incomingTransfers.length > 0 ? (
                  incomingTransfers.map((transfer) => (
                    <IncomingTransfer key={transfer.id} item={transfer.item} qty={transfer.qty} from={transfer.from} />
                  ))
                ) : (
                  <div className="text-xs text-text-tertiary">No incoming transfers</div>
                )}
              </div>
              <button className="w-full mt-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all">
                View All Transfers
              </button>
            </div>
          </div>
        </div>

        {/* Status & Tasks */}
        <div className="space-y-6">
          <div className="stitch-card p-6">
            <h3 className="font-bold text-text-primary tracking-tight mb-6 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Pending Approvals
            </h3>
            <div className="space-y-4">
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task) => (
                  <PendingTask 
                    key={task.id}
                    title={task.title} 
                    status={task.status} 
                    time={task.time}
                  />
                ))
              ) : (
                <div className="text-xs text-text-tertiary">No pending tasks</div>
              )}
            </div>
            <div className="mt-8 p-4 bg-background rounded-xl border border-border">
              <p className="text-xs font-bold text-text-primary mb-2">Daily Checklist</p>
              <div className="space-y-2">
                <ChecklistItem label="Log morning deliveries" checked={true} />
                <ChecklistItem label="Update daily usage logs" checked={false} />
                <ChecklistItem label="Verify low stock items" checked={false} />
                <ChecklistItem label="Submit end-of-day report" checked={false} />
              </div>
            </div>
          </div>

          <div className="stitch-card p-6 bg-background/50">
            <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-widest mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.entriesToday || 0}</p>
                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Entries Today</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.itemsTracked || 0}</p>
                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Items Tracked</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon: Icon, color, href }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
    success: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
    info: 'bg-info/10 text-info border-info/20 hover:bg-info/20',
  };

  return (
    <Link to={href}>
      <motion.div 
        whileHover={{ y: -4 }}
        className={cn(
          "p-6 rounded-2xl border flex flex-col items-start text-left transition-all group h-full cursor-pointer",
          colorClasses[color]
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-text-primary tracking-tight">{title}</h3>
        <p className="text-xs text-text-tertiary mt-1">{description}</p>
        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          Start Now <ArrowRight className="w-3 h-3" />
        </div>
      </motion.div>
    </Link>
  );
}

function EntryItem({ type, item, amount, time, status }) {
  return (
    <div className="p-5 flex items-center justify-between hover:bg-background transition-colors group">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
          status === 'success' ? 'bg-success/10 text-success' : 
          status === 'info' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
        )}>
          {type === 'Purchase' ? <ShoppingCart className="w-5 h-5" /> : 
           type === 'Usage' ? <Activity className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary tracking-tight">
            {item} <span className="font-medium text-text-tertiary">({type})</span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-text-secondary">{amount}</span>
            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">• {time}</span>
          </div>
        </div>
      </div>
      <StatusBadge status={status}>Logged</StatusBadge>
    </div>
  );
}

function LowStockItem({ item, stock, threshold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-text-primary">{item}</span>
      <span className="text-xs font-bold text-danger">{stock} <span className="text-[10px] text-text-tertiary font-medium">/ {threshold}</span></span>
    </div>
  );
}

function IncomingTransfer({ item, qty, from }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-text-primary">{item} ({qty})</p>
        <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">From {from}</p>
      </div>
      <StatusBadge status="info">In Transit</StatusBadge>
    </div>
  );
}

function PendingTask({ title, status, time }) {
  return (
    <div className="p-3 bg-background rounded-lg border border-border">
      <p className="text-xs font-bold text-text-primary">{title}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">{status}</span>
        <span className="text-[10px] text-text-tertiary font-medium">{time}</span>
      </div>
    </div>
  );
}

function ChecklistItem({ label, checked }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
        checked ? "bg-primary border-primary" : "border-border"
      )}>
        {checked && <Plus className="w-2.5 h-2.5 text-white rotate-45" />}
      </div>
      <span className={cn(
        "text-[11px] font-medium transition-colors",
        checked ? "text-text-tertiary line-through" : "text-text-secondary"
      )}>{label}</span>
    </div>
  );
}
