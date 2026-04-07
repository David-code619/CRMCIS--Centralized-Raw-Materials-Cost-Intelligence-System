import React, { useState } from 'react';
import { ArrowRightLeft, History, ShieldCheck, Plus, RefreshCw, Info } from 'lucide-react';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { TransferForm } from '../components/transfer/TransferForm';
import { TransferHistory } from '../components/transfer/TransferHistory';
import { TransferApprovalQueue } from '../components/transfer/TransferApprovalQueue';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export function Transfers() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('history');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransferSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: 'Inter-Branch Transfers' }]} />
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Inter-Branch Transfers</h1>
          <p className="text-text-tertiary mt-1 font-medium">Move materials between branches with Super Admin oversight.</p>
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
        {/* Left Column: Form & Info */}
        <div className="lg:col-span-1 space-y-8">
          <TransferForm onSuccess={handleTransferSuccess} />
          
          <div className="stitch-card p-6 bg-primary/5 border-primary/10">
            <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Transfer Workflow
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <strong>Request:</strong> Inventory Officer or Manager initiates a transfer request.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <strong>Approval:</strong> Super Admin reviews and approves the request in the queue.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <strong>Completion:</strong> Once approved, the transfer must be manually "Completed" to finalize stock movement.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History & Approval Queue */}
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
              Transfer History
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('approval')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
                  activeTab === 'approval' 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-text-tertiary hover:text-text-primary"
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                Approval Queue
              </button>
            )}
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
                <TransferHistory />
              ) : (
                <TransferApprovalQueue />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
