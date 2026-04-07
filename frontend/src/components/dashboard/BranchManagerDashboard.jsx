import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  Activity,
  RefreshCw,
  Plus,
  Layers
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { KPICard } from '../ui/KPICard';
import { ChartCard } from '../ui/ChartCard';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { StatusBadge } from '../ui/StatusBadge';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';

export function BranchManagerDashboard({ stats, onRefresh }) {
  const { theme } = useTheme();
  
  const topConsumedData = stats.topConsumedMaterials || [];
  const stockLevelData = stats.stockComposition || [];
  const alerts = stats.alerts || [];
  const recentActivity = stats.recentActivity || [];

  const chartColors = {
    grid: theme === 'dark' ? '#3C4043' : '#DADCE0',
    text: theme === 'dark' ? '#9AA0A6' : '#5F6368',
    tooltipBg: theme === 'dark' ? '#202124' : '#FFFFFF',
    tooltipBorder: theme === 'dark' ? '#3C4043' : '#DADCE0',
    cursor: theme === 'dark' ? '#3C4043' : '#F8F9FA',
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handleAuditBranch = async () => {
    try {
      const res = await apiFetch('/api/usage/audit-all', { method: 'POST' });
      if (res.ok) {
        onRefresh();
      } else {
        throw new Error('Failed to audit branch logs');
      }
    } catch (error) {
      console.error('Audit branch error:', error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs />
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Branch Intelligence</h2>
          <p className="text-text-secondary mt-1 font-medium">
            Real-time analytics for your assigned branch.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/branch-materials" className="stitch-button-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Manage Materials</span>
          </Link>
          <button onClick={onRefresh} className="stitch-button-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button className="stitch-button-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Branch Stock Value" 
          value={`$${formatCurrency(stats.totalStockValue || 0)}`} 
          trend={{ 
            value: `${Math.abs(stats.trends?.purchases || 0)}%`, 
            isUp: (stats.trends?.purchases || 0) >= 0 
          }}
          icon={DollarSign}
          color="success"
          description="Total value of current inventory"
        />
        <KPICard 
          title="Shrinkage Rate" 
          value={`${stats.shrinkageRate || 0}%`} 
          trend={{ 
            value: `${Math.abs(stats.trends?.usage || 0)}%`, 
            isUp: (stats.trends?.usage || 0) >= 0 
          }}
          icon={Activity}
          color="warning"
          description="Deviation from benchmark usage"
        />
        <KPICard 
          title="Critical Alerts" 
          value={stats.criticalAlertsCount || 0} 
          icon={AlertTriangle}
          color="danger"
          description="Items below reorder threshold"
        />
        <KPICard 
          title="Monthly Purchases" 
          value={`$${formatCurrency(stats.totalPurchases || 0)}`} 
          trend={{ 
            value: `${Math.abs(stats.trends?.purchases || 0)}%`, 
            isUp: (stats.trends?.purchases || 0) >= 0 
          }}
          icon={TrendingUp}
          color="info"
          description="Total spend on materials this month"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ChartCard 
            title="Top Consumed Materials" 
            subtitle="Consumption volume by material type"
            onRefresh={onRefresh}
          >
            <div className="h-80">
              {topConsumedData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topConsumedData} margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: chartColors.text, fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: chartColors.text, fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: chartColors.cursor}}
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        borderRadius: '12px', 
                        border: '1px solid',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                      }}
                      itemStyle={{ color: chartColors.text }}
                      labelStyle={{ color: chartColors.text }}
                      formatter={(value, name, props) => [`${value} ${props.payload.unit || ''}`, 'Consumption']}
                    />
                    <Bar dataKey="value" fill="#1A73E8" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-tertiary">No consumption data available</div>
              )}
            </div>
          </ChartCard>
        </div>

        <div className="lg:col-span-1">
          <ChartCard 
            title="Inventory Composition" 
            subtitle="Stock value by category"
          >
            <div className="h-80">
              {stockLevelData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockLevelData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stockLevelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: chartColors.tooltipBg,
                          borderColor: chartColors.tooltipBorder,
                          borderRadius: '12px', 
                          border: '1px solid',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                        }}
                        itemStyle={{ color: theme === 'dark' ? '#E8EAED' : '#202124' }}
                        formatter={(value) => [`${value}%`, 'Share']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {stockLevelData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs font-medium text-text-secondary">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-text-tertiary">No category data available</div>
              )}
            </div>
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Usage Variance Alerts */}
        <div className="stitch-card overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center bg-background/30">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-text-primary tracking-tight">Usage Variance Alerts</h3>
            </div>
            <button 
              onClick={handleAuditBranch}
              className="text-xs font-bold text-primary hover:text-primary-hover transition-colors"
            >
              Audit Branch
            </button>
          </div>
          <div className="divide-y divide-border">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <AlertItem 
                  key={alert.id}
                  item={alert.item} 
                  variance={alert.variance} 
                  status={alert.status}
                  time={new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  description={alert.description}
                />
              ))
            ) : (
              <div className="p-8 text-center text-text-tertiary">No critical variances detected</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="stitch-card p-6">
          <h3 className="font-bold text-text-primary tracking-tight mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <ActivityLine 
                  key={activity.id}
                  title={activity.title} 
                  detail={activity.detail} 
                  time={new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  user={activity.user}
                />
              ))
            ) : (
              <div className="p-8 text-center text-text-tertiary">No recent activity found</div>
            )}
          </div>
          <Link 
            to="/usage?isSuspicious=true"
            className="w-full mt-8 py-3 bg-background border border-border rounded-xl text-xs font-bold text-text-tertiary uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center"
          >
            View Full Audit Log
          </Link>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ item, variance, status, time, description }) {
  return (
    <div className="p-5 flex items-center justify-between hover:bg-background transition-colors group">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
          status === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
        )}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary tracking-tight">
            {item} <span className="font-bold text-danger ml-2">{variance}</span>
          </p>
          <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={status}>{status === 'danger' ? 'Critical' : 'Warning'}</StatusBadge>
            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">{time}</span>
          </div>
        </div>
      </div>
      <button className="stitch-button-secondary text-xs py-1.5">Investigate</button>
    </div>
  );
}

function ActivityLine({ title, detail, time, user }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
        <div className="w-px flex-1 bg-border my-1" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <p className="text-sm font-bold text-text-primary">{title}</p>
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">{time}</span>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">{detail}</p>
        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mt-1">By {user}</p>
      </div>
    </div>
  );
}