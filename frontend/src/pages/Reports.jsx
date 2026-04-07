import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  Building2,
  Package,
  History,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';
import { useToast } from '../components/ui/Toast';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ReportFilters } from '../components/reports/ReportFilters';
import { KPICard } from '../components/ui/KPICard';
import { cn } from '../lib/utils';

export function Reports() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  const chartColors = {
    grid: theme === 'dark' ? '#3C4043' : '#DADCE0',
    text: theme === 'dark' ? '#9AA0A6' : '#5F6368',
    tooltipBg: theme === 'dark' ? '#202124' : '#FFFFFF',
    tooltipBorder: theme === 'dark' ? '#3C4043' : '#DADCE0',
  };
  const [filters, setFilters] = useState({
    branchId: user?.branchId || '',
    materialId: '',
    category: '',
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0], // Last 3 months
    endDate: new Date().toISOString().split('T')[0]
  });

  const [branches, setBranches] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [kpis, setKpis] = useState(null);
  const [valueTrend, setValueTrend] = useState([]);
  const [topConsumed, setTopConsumed] = useState([]);
  const [branchComparison, setBranchComparison] = useState([]);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    async function fetchStaticData() {
      try {
        const [bRes, mRes] = await Promise.all([
          fetch('/api/branches', { credentials: 'include' }),
          fetch('/api/materials', { credentials: 'include' })
        ]);
        
        if (bRes.status === 401 || mRes.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        if (!bRes.ok || !mRes.ok) throw new Error('Failed to load filter data');
        
        const bData = await bRes.json();
        const mData = await mRes.json();
        
        const branchesList = Array.isArray(bData) ? bData : bData.data || [];
        setBranches(branchesList);
        
        const materialsList = Array.isArray(mData) ? mData : mData.data || [];
        setMaterials(materialsList);
        setCategories([...new Set(materialsList.map((m) => m.category))]);
      } catch (error) {
        addToast('Failed to load filter data', 'error');
        setBranches([]);
        setMaterials([]);
      }
    }
    fetchStaticData();
  }, [addToast]);

  useEffect(() => {
    async function fetchReportData() {
      setIsLoading(true);
      try {
        const query = new URLSearchParams(filters).toString();
        const [kpiRes, trendRes, topRes, compRes] = await Promise.all([
          fetch(`/api/reports/kpis?${query}`, { credentials: 'include' }),
          fetch(`/api/reports/value-trend?${query}`, { credentials: 'include' }),
          fetch(`/api/reports/top-consumed?${query}`, { credentials: 'include' }),
          isSuperAdmin ? fetch(`/api/reports/branch-comparison?${query}`, { credentials: 'include' }) : Promise.resolve(null)
        ]);

        if (kpiRes.status === 401 || trendRes.status === 401 || topRes.status === 401 || (compRes && compRes.status === 401)) {
          window.location.href = '/login';
          return;
        }

        const kpiData = kpiRes.ok ? await kpiRes.json() : null;
        const trendData = trendRes.ok ? await trendRes.json() : [];
        const topData = topRes.ok ? await topRes.json() : [];
        
        setKpis(kpiData);
        setValueTrend(Array.isArray(trendData) ? trendData : []);
        setTopConsumed(Array.isArray(topData) ? topData : []);
        
        if (compRes && compRes.ok) {
          const compData = await compRes.json();
          setBranchComparison(Array.isArray(compData) ? compData : []);
        }
      } catch (error) {
        console.error('Report data fetch error:', error);
        addToast('Failed to load report data', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchReportData();
  }, [filters, isSuperAdmin, addToast]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: 'Intelligence Reports' }]} />
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Intelligence Reports</h1>
          <p className="text-text-tertiary mt-1 font-medium">Chain-wide cost analysis and inventory performance metrics.</p>
        </div>
      </div>

      <ReportFilters 
        filters={filters} 
        setFilters={setFilters} 
        branches={branches} 
        materials={materials} 
        categories={categories}
        isSuperAdmin={isSuperAdmin}
      />

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center text-text-tertiary">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="font-bold text-lg">Aggregating Intelligence...</p>
          <p className="text-sm">This may take a moment for large data sets.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard 
              title="Total Purchase Value" 
              value={`₦${(kpis?.totalPurchaseValue || 0).toLocaleString()}`} 
              icon={TrendingUp}
              color="primary"
              description="Total spend in period"
            />
            <KPICard 
              title="Shrinkage Rate" 
              value={`${(kpis?.shrinkageRate || 0)}%`} 
              icon={AlertTriangle}
              color={(kpis?.shrinkageRate || 0) > 5 ? "danger" : "success"}
              description="Waste/Loss relative to movement"
            />
            <KPICard 
              title="Usage Variance" 
              value={`${(kpis?.usageVariancePercent || 0).toFixed(1)}%`} 
              icon={Activity}
              color={(kpis?.usageVariancePercent || 0) > 10 ? "warning" : "info"}
              description="Actual vs. Benchmark usage"
            />
            <KPICard 
              title="Total Shrinkage Qty" 
              value={(kpis?.totalShrinkageQty || 0).toFixed(2)} 
              icon={History}
              color="warning"
              description="Total units lost/wasted"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Value Trend Chart */}
            <div className="lg:col-span-2 stitch-card p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-text-primary tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Inventory Value Trend
                  </h3>
                  <p className="text-xs text-text-tertiary mt-1 font-medium">Estimated value of stock holdings over time.</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={valueTrend}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1A73E8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: chartColors.text, fontSize: 10}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: chartColors.text, fontSize: 10}}
                      tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        borderRadius: '12px', 
                        border: '1px solid',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                      }}
                      itemStyle={{ color: theme === 'dark' ? '#E8EAED' : '#202124' }}
                      formatter={(v) => [`₦${v.toLocaleString()}`, 'Value']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#1A73E8" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Consumed Materials */}
            <div className="stitch-card p-6">
              <div className="mb-8">
                <h3 className="font-bold text-text-primary tracking-tight flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Top Consumed Materials
                </h3>
                <p className="text-xs text-text-tertiary mt-1 font-medium">Highest volume items by usage quantity.</p>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topConsumed} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: chartColors.text, fontSize: 10}}
                      width={80}
                    />
                    <Tooltip 
                      cursor={{fill: theme === 'dark' ? '#3C4043' : '#F8F9FA'}}
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        borderRadius: '12px', 
                        border: '1px solid',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                      }}
                      itemStyle={{ color: theme === 'dark' ? '#E8EAED' : '#202124' }}
                    />
                    <Bar dataKey="value" fill="#1A73E8" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Branch Comparison */}
              <div className="stitch-card p-6">
                <div className="mb-8">
                  <h3 className="font-bold text-text-primary tracking-tight flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Branch Shrinkage Comparison
                  </h3>
                  <p className="text-xs text-text-tertiary mt-1 font-medium">Shrinkage rates across all active branches.</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchComparison}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                      <XAxis 
                        dataKey="branchName" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: chartColors.text, fontSize: 10}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: chartColors.text, fontSize: 10}}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip 
                        cursor={{fill: theme === 'dark' ? '#3C4043' : '#F8F9FA'}}
                        contentStyle={{ 
                          backgroundColor: chartColors.tooltipBg,
                          borderColor: chartColors.tooltipBorder,
                          borderRadius: '12px', 
                          border: '1px solid',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                        }}
                        itemStyle={{ color: theme === 'dark' ? '#E8EAED' : '#202124' }}
                      />
                      <Bar dataKey="shrinkageRate" radius={[4, 4, 0, 0]} barSize={40}>
                        {branchComparison.map((entry) => (
                          <Cell key={entry.branchId} fill={entry.shrinkageRate > 5 ? '#EA4335' : '#34A853'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Branch Efficiency Table */}
              <div className="stitch-card overflow-hidden">
                <div className="p-6 border-b border-border bg-background/30">
                  <h3 className="font-bold text-text-primary tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Branch Efficiency Ranking
                  </h3>
                  <p className="text-xs text-text-tertiary mt-1 font-medium">Ranked by lowest shrinkage rate.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-background/50">
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Rank</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Branch</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Shrinkage Rate</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Total Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...branchComparison].sort((a, b) => a.shrinkageRate - b.shrinkageRate).map((b, index) => (
                        <tr key={b.branchId} className="hover:bg-background/50 transition-colors">
                          <td className="p-4">
                            <span className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                              index === 0 ? "bg-success/10 text-success" : "bg-background text-text-tertiary"
                            )}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-text-primary text-sm">{b.branchName}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-sm font-bold",
                                b.shrinkageRate > 5 ? "text-danger" : "text-success"
                              )}>
                                {b.shrinkageRate}%
                              </span>
                              {b.shrinkageRate > 5 ? <ArrowUpRight className="w-3 h-3 text-danger" /> : <ArrowDownRight className="w-3 h-3 text-success" />}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-text-secondary">{b.totalShrinkage.toFixed(2)} units</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Trend Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stitch-card p-6 border-l-4 border-l-primary">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Cost Increase Trend</h4>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-text-primary">
                  {kpis?.costTrend > 0 ? '+' : ''}{kpis?.costTrend || 0}%
                </p>
                <div className={cn(
                  "p-2 rounded-lg",
                  (kpis?.costTrend || 0) > 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                )}>
                  {(kpis?.costTrend || 0) > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
              </div>
              <p className="text-[10px] text-text-tertiary mt-2 font-medium">Average unit cost vs. previous period</p>
            </div>
            <div className="stitch-card p-6 border-l-4 border-l-success">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Waste Reduction</h4>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-text-primary">
                  {kpis?.wasteTrend > 0 ? '+' : ''}{kpis?.wasteTrend || 0}%
                </p>
                <div className={cn(
                  "p-2 rounded-lg",
                  (kpis?.wasteTrend || 0) > 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                )}>
                  {(kpis?.wasteTrend || 0) > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
              </div>
              <p className="text-[10px] text-text-tertiary mt-2 font-medium">Total waste quantity vs. previous period</p>
            </div>
            <div className="stitch-card p-6 border-l-4 border-l-warning">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Highest Variance Category</h4>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-text-primary">{kpis?.highestVarianceCategory || 'N/A'}</p>
                <div className="p-2 bg-warning/10 text-warning rounded-lg">
                  <Info className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] text-text-tertiary mt-2 font-medium">Category with highest usage variance</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
