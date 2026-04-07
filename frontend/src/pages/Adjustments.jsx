import React, { useState } from 'react';
import { AlertTriangle, History, Activity, Plus, RefreshCw, Filter } from 'lucide-react';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { AdjustmentForm } from '../components/adjustment/AdjustmentForm';
import { AdjustmentHistory } from '../components/adjustment/AdjustmentHistory';
import { ShrinkageSummary } from '../components/adjustment/ShrinkageSummary';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function Adjustments() {
  const [activeTab, setActiveTab] = useState('history');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdjustmentSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: 'Stock Adjustments' }]} />
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Stock Adjustments</h1>
          <p className="text-text-tertiary mt-1 font-medium">Record and approve inventory corrections, waste, and loss.</p>
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
          <AdjustmentForm onSuccess={handleAdjustmentSuccess} />
          
          <div className="stitch-card p-6 bg-warning/5 border-warning/10">
            <h4 className="text-sm font-bold text-warning uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Approval Policy
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              All stock adjustments require <strong>Manager Approval</strong> before they impact the branch's current stock levels. 
              Once approved, the adjustment is permanent and recorded in the audit log.
            </p>
          </div>
        </div>

        {/* Right Column: History & Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 p-1 bg-background border border-border rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
                activeTab === 'history' 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-text-tertiary hover:text-text-primary"
              )}
            >
              <History className="w-4 h-4" />
              Adjustment History
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
                activeTab === 'summary' 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-text-tertiary hover:text-text-primary"
              )}
            >
              <Activity className="w-4 h-4" />
              Shrinkage Summary
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + refreshKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'history' ? (
                <AdjustmentHistory />
              ) : (
                <ShrinkageSummary />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
