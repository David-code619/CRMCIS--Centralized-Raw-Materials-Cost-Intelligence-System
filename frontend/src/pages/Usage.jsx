import React, { useState } from 'react';
import { Activity, History, Plus, RefreshCw, Filter } from 'lucide-react';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { UsageForm } from '../components/usage/UsageForm';
import { UsageHistory } from '../components/usage/UsageHistory';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function Usage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUsageSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: 'Daily Usage' }]} />
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Daily Consumption</h1>
          <p className="text-text-tertiary mt-1 font-medium">Record and track daily material usage to monitor inventory depletion.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="stitch-button-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1 space-y-8">
          <UsageForm onSuccess={handleUsageSuccess} />
          
          <div className="stitch-card p-6 bg-success/5 border-success/10">
            <h4 className="text-sm font-bold text-success uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Usage Intelligence
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Accurate usage logging is critical for <strong>Cost Intelligence</strong>. 
              This data directly impacts your branch's profitability reports and automated reorder alerts.
            </p>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={refreshKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <UsageHistory />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
