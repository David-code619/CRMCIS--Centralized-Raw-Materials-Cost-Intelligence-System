import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { Info, Maximize2, RefreshCw } from 'lucide-react';

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  onRefresh,
  onExpand,
  info,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'stitch-card p-6 flex flex-col gap-6',
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-text-primary tracking-tight">{title}</h3>
            {info && (
              <div className="group relative">
                <Info className="w-3.5 h-3.5 text-text-tertiary cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-text-primary dark:bg-surface text-white dark:text-text-primary text-[10px] rounded shadow-lg border border-transparent dark:border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {info}
                </div>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-text-tertiary mt-1 font-medium">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 hover:bg-background rounded-md transition-colors text-text-tertiary hover:text-text-primary"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1.5 hover:bg-background rounded-md transition-colors text-text-tertiary hover:text-text-primary"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-75">
        {children}
      </div>
    </motion.div>
  );
}
