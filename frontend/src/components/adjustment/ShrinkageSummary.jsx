import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity, 
  Loader2, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { KPICard } from '../ui/KPICard';

export function ShrinkageSummary() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const branchId = user?.branchId;
        if (!branchId && user?.role !== 'SUPER_ADMIN') return;

        const url = branchId ? `${import.meta.env.VITE_API_URL}/api/reports/shrinkage?branchId=${branchId}` : `${import.meta.env.VITE_API_URL}/api/reports/shrinkage`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch shrinkage metrics');
        const data = await res.json();
        setMetrics(data);
      } catch (error) {
        addToast('Failed to load shrinkage metrics', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchMetrics();
  }, [user, addToast]);

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-text-tertiary">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-medium">Calculating shrinkage...</p>
      </div>
    );
  }

  if (!metrics) return null;

  const isHighShrinkage = metrics.shrinkageRate > 5;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Shrinkage Rate" 
          value={`${(metrics.shrinkageRate || 0).toFixed(2)}%`} 
          icon={Activity}
          color={isHighShrinkage ? "danger" : "success"}
          description="Waste/Loss relative to total movement"
        />
        <KPICard 
          title="Total Adjusted Qty" 
          value={(metrics.totalAdjustedQty || 0).toFixed(2)} 
          icon={AlertTriangle}
          color="warning"
          description="Sum of all approved waste and loss"
        />
        <KPICard 
          title="Adjustment Count" 
          value={(metrics.adjustmentCount || 0).toString()} 
          icon={TrendingUp}
          color="info"
          description="Total approved incidents this month"
        />
      </div>

      <div className="stitch-card p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-text-primary tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Shrinkage Analysis
            </h3>
            <p className="text-xs text-text-tertiary mt-1 font-medium">Monthly stock movement vs. adjustments.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
            <Calendar className="w-3 h-3" /> Current Month
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Stock Movement', value: metrics.totalMovement || 0 },
              { name: 'Adjustments', value: Math.abs(metrics.totalAdjustedQty || 0) }
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DADCE0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#5F6368', fontSize: 11}} dy={10} />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: '#F8F9FA'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                <Cell fill="#1A73E8" />
                <Cell fill="#EA4335" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shadow-sm",
              isHighShrinkage ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
            )}>
              {isHighShrinkage ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">
                {isHighShrinkage ? 'High Variance Detected' : 'Healthy Stock Variance'}
              </p>
              <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
                {isHighShrinkage ? 'Above 5% threshold' : 'Within acceptable limits'}
              </p>
            </div>
          </div>
          <button className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">View Audit Log</button>
        </div>
      </div>
    </div>
  );
}
