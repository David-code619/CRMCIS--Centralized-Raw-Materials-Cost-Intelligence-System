import React, { useState } from 'react';
import { ShoppingCart, History, TrendingUp, Plus, RefreshCw } from 'lucide-react';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { PurchaseForm } from '../components/purchase/PurchaseForm';
import { PurchaseHistory } from '../components/purchase/PurchaseHistory';
import { CostTrends } from '../components/purchase/CostTrends';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function PurchaseLog() {
  const [activeTab, setActiveTab] = useState('history');
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePurchaseSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: 'Purchase Logging' }]} />
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Purchase Logging</h1>
          <p className="text-text-tertiary mt-1 font-medium">Record new inventory purchases and track historical costs.</p>
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
          <PurchaseForm onSuccess={handlePurchaseSuccess} />
          
          <div className="stitch-card p-6 bg-primary/5 border-primary/10">
            <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Intelligence Note
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              CRMCIS automatically calculates the <strong>Weighted Average Cost (WAC)</strong> for every material purchase. 
              This ensures your branch's inventory value and shrinkage reports remain accurate even as supplier prices fluctuate.
            </p>
          </div>
        </div>

        {/* Right Column: History & Trends */}
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
              Purchase History
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
                activeTab === 'trends' 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-text-tertiary hover:text-text-primary"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Cost Intelligence
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
                <PurchaseHistory />
              ) : (
                <CostTrends />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
