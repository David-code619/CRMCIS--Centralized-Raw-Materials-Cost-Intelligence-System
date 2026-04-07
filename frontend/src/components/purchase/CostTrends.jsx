import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, TrendingDown, Package, Loader2, Search } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export function CostTrends() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [materials, setMaterials] = useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [trendData, setTrendData] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const res = await fetch('/api/materials', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch materials');
        const result = await res.json();
        const data = Array.isArray(result) ? result : result.data || [];
        setMaterials(data);
        if (data.length > 0) setSelectedMaterialId(data[0].id);
      } catch (error) {
        addToast('Failed to load materials', 'error');
      } finally {
        setIsLoadingMaterials(false);
      }
    }
    fetchMaterials();
  }, [addToast]);

  useEffect(() => {
    if (!selectedMaterialId) return;

    async function fetchTrends() {
      setIsLoadingTrends(true);
      try {
        const branchId = user?.branchId;
        const url = `/api/reports/cost-trends?materialId=${selectedMaterialId}${branchId ? `&branchId=${branchId}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch trends');
        const data = await res.json();
        setTrendData(data);
      } catch (error) {
        addToast('Failed to load cost trends', 'error');
      } finally {
        setIsLoadingTrends(false);
      }
    }
    fetchTrends();
  }, [selectedMaterialId, user, addToast]);

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);

  // Calculate trend indicator
  const getTrendIndicator = () => {
    if (trendData.length === 0) return null;
    if (trendData.length === 1) {
      return {
        hasTrend: false,
        latest: trendData[0].unitPrice
      };
    }
    const latest = trendData[trendData.length - 1].unitPrice;
    const previous = trendData[trendData.length - 2].unitPrice;
    const diff = latest - previous;
    const percent = previous > 0 ? (diff / previous) * 100 : 0;

    return {
      hasTrend: true,
      latest,
      isUp: diff > 0,
      percent: Math.abs(percent).toFixed(1),
      diff: Math.abs(diff).toFixed(2)
    };
  };

  const trend = getTrendIndicator();

  return (
    <div className="stitch-card p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="font-bold text-text-primary tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Cost Intelligence
          </h3>
          <p className="text-xs text-text-tertiary mt-1 font-medium">Historical unit price analysis for materials.</p>
        </div>

        <div className="relative w-full md:w-64">
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <select
            className="stitch-input pl-10 w-full"
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            disabled={isLoadingMaterials}
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoadingTrends ? (
        <div className="h-64 flex flex-col items-center justify-center text-text-tertiary">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="font-medium">Analyzing trends...</p>
        </div>
      ) : trendData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-text-tertiary" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">No trend data available</h3>
          <p className="text-xs text-text-tertiary max-w-[200px] mt-1">
            Log more purchases for this material to see historical trends.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {trend && (
            <div className="flex items-center gap-4 p-4 bg-background rounded-2xl border border-border">
              {trend.hasTrend ? (
                <>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                    trend.isUp ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                  )}>
                    {trend.isUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Price Variance</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-lg font-bold tracking-tight",
                        trend.isUp ? "text-danger" : "text-success"
                      )}>
                        {trend.isUp ? '+' : '-'} ₦{trend.diff}
                      </span>
                      <span className={cn(
                        "text-xs font-bold px-1.5 py-0.5 rounded-md",
                        trend.isUp ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                      )}>
                        {trend.percent}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-primary/10 text-primary">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Price Variance</p>
                    <p className="text-sm font-medium text-text-secondary">Need more data</p>
                  </div>
                </div>
              )}
              <div className="ml-auto text-right">
                <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Latest Price</p>
                <p className="text-lg font-bold text-text-primary tracking-tight">
                  ₦{trend.latest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1A73E8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DADCE0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#5F6368', fontSize: 10}} 
                  dy={10}
                  tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#5F6368', fontSize: 10}} 
                  dx={-10}
                  tickFormatter={(val) => `₦${val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value) => [`₦${value.toLocaleString()}`, 'Unit Price']}
                />
                <Area 
                  type="monotone" 
                  dataKey="unitPrice" 
                  stroke="#1A73E8" 
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  strokeWidth={2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
