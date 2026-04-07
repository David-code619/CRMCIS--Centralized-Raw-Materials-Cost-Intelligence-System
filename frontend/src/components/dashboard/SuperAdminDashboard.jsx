import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Activity,
  Download,
  RefreshCw,
  Plus,
  ClipboardCheck,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { KPICard } from '../ui/KPICard';
import { ChartCard } from '../ui/ChartCard';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { StatusBadge } from '../ui/StatusBadge';
import { exportToCSV } from '../../lib/exportUtils';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';

export function SuperAdminDashboard({ stats, onRefresh }) {
  const { theme } = useTheme();

  const branchComparisonData = stats.branchComparison || [];
  const costTrendData = stats.costTrends || [];
  const alerts = stats.alerts || [];

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

  const handleAuditAll = async () => {
    try {
      const res = await apiFetch('/api/usage/audit-all', { method: 'POST' });
      if (res.ok) {
        onRefresh();
      } else {
        throw new Error('Failed to audit logs');
      }
    } catch (error) {
      console.error('Audit all error:', error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs />
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">HQ Intelligence</h2>
          <p className="text-text-secondary mt-1 font-medium">
            Real-time cost and inventory overview across all branches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/material-catalog" className="stitch-button-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Manage Catalog</span>
          </Link>
          <button onClick={onRefresh} className="stitch-button-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={() => exportToCSV(stats.branchComparison, 'branch-comparison', [
            { header: 'Branch', accessor: 'name' },
            { header: 'Value', accessor: 'value' }
          ])} className="stitch-button-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Global Report</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Stock Value"
          value={`$${formatCurrency(stats.totalStockValue || 0)}`}
          trend={{
            value: `${Math.abs(stats.trends?.purchases || 0)}%`,
            isUp: (stats.trends?.purchases || 0) >= 0
          }}
          icon={DollarSign}
          color="success"
          description="Consolidated value across all branches"
        />
        <KPICard
          title="Chain Cost Increase"
          value={`${stats.chainCostIncrease || 0}%`}
          trend={{
            value: `${Math.abs(stats.trends?.cost || 0)}%`,
            isUp: (stats.trends?.cost || 0) >= 0
          }}
          icon={TrendingUp}
          color="danger"
          description="Average material cost rise this month"
        />
        <KPICard
          title="Highest Shrinkage"
          value={stats.highestShrinkageBranch || 'N/A'}
          icon={AlertTriangle}
          color="warning"
          description={`Current branch with ${stats.highestShrinkageValue || '0%'} variance`}
        />
        <KPICard
          title="Pending Approvals"
          value={stats.pendingApprovalsCount || 0}
          icon={ClipboardCheck}
          color="info"
          description="Inter-branch transfers awaiting HQ"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ChartCard
            title="Branch Value Distribution"
            subtitle="Inventory capital allocation by location"
            onRefresh={onRefresh}
          >
            <div className="h-80">
              {branchComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchComparisonData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={chartColors.grid} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: chartColors.cursor }}
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        borderRadius: '12px',
                        border: '1px solid',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                      itemStyle={{ color: chartColors.text }}
                      labelStyle={{ color: chartColors.text }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                    />
                    <Bar dataKey="value" fill="#1A73E8" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-tertiary">No branch data available</div>
              )}
            </div>
          </ChartCard>
        </div>

        <div className="lg:col-span-1">
          <ChartCard
            title="Global Cost Trend"
            subtitle="Monthly expenditure growth"
          >
            <div className="h-80">
              {costTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={costTrendData}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 12 }} dy={10} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        borderRadius: '12px',
                        border: '1px solid',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                      itemStyle={{ color: chartColors.text }}
                      labelStyle={{ color: chartColors.text }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Total Cost']}
                    />
                    <Area type="monotone" dataKey="cost" stroke="#1A73E8" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-tertiary">No trend data available</div>
              )}
            </div>
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Suspicious Usage Alerts */}
        <div className="stitch-card overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center bg-background/30">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-text-primary tracking-tight">Chain-wide Alerts</h3>
            </div>
            <button
              onClick={handleAuditAll}
              className="text-xs font-bold text-primary hover:text-primary-hover transition-colors"
            >
              Audit All
            </button>
          </div>
          <div className="divide-y divide-border">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  branch={alert.branch}
                  item={alert.item}
                  variance={alert.variance}
                  status={alert.status}
                  time={new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
              ))
            ) : (
              <div className="p-8 text-center text-text-tertiary">No critical alerts detected</div>
            )}
          </div>
        </div>

        {/* Quick Access Reports */}
        <div className="stitch-card p-6">
          <h3 className="font-bold text-text-primary tracking-tight mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Global Intelligence Reports
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReportButton title="Weighted Avg Cost Analysis" date="Updated 1h ago" />
            <ReportButton title="Branch Shrinkage Audit" date="Updated 4h ago" />
            <ReportButton title="Supplier Price Variance" date="Updated 12h ago" />
            <ReportButton title="Inventory Turnover Ratio" date="Updated 1d ago" />
          </div>
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div>
                <p className="text-sm font-bold text-text-primary">Quarterly Cost Forecast</p>
                <p className="text-xs text-text-tertiary">AI-driven projection for Q2 2026</p>
              </div>
              <Link to="/reports" className="stitch-button-primary text-xs py-2">Generate</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ branch, item, variance, status, time }) {
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
            {item} <span className="font-medium text-text-tertiary">at</span> {branch}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={status}>{status === 'danger' ? 'Critical Variance' : 'Warning'}</StatusBadge>
            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">{time}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          "text-sm font-bold tracking-tight",
          status === 'danger' ? 'text-danger' : 'text-warning'
        )}>{variance}</p>
        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mt-0.5">Above expected</p>
      </div>
    </div>
  );
}

function ReportButton({ title, date }) {
  return (
    <Link to="/reports" className="flex flex-col items-start p-4 bg-background border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left group">
      <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{title}</span>
      <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mt-1">{date}</span>
    </Link>
  );
}