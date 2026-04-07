import React from 'react';
import { Search, Package, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export function EmptyState({
  title,
  description,
  icon: Icon = Package,
  action,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center bg-surface border border-dashed border-border rounded-xl',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-text-tertiary" />
      </div>
      
      <h3 className="text-lg font-bold text-text-primary mb-2 tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mx-auto leading-relaxed mb-8">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </motion.div>
  );
}
