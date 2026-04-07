import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const alertStyles = {
  success: { container: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: CheckCircle2, iconColor: 'text-emerald-500' },
  warning: { container: 'bg-amber-50 border-amber-200 text-amber-800', icon: AlertTriangle, iconColor: 'text-amber-500' },
  danger: { container: 'bg-rose-50 border-rose-200 text-rose-800', icon: AlertCircle, iconColor: 'text-rose-500' },
  info: { container: 'bg-blue-50 border-blue-200 text-blue-800', icon: Info, iconColor: 'text-blue-500' },
};

export function AlertPanel({
  type,
  title,
  children,
  onClose,
  className,
  showIcon = true,
}) {
  const { container, icon: Icon, iconColor } = alertStyles[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'p-4 rounded-lg border flex gap-3 relative',
        container,
        className
      )}
    >
      {showIcon && <Icon className={cn('w-5 h-5 shrink-0', iconColor)} />}
      
      <div className="flex-1">
        {title && <h4 className="text-sm font-bold mb-1">{title}</h4>}
        <div className="text-sm opacity-90 leading-relaxed">{children}</div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded-full transition-colors h-fit"
        >
          <X className="w-4 h-4 opacity-50" />
        </button>
      )}
    </motion.div>
  );
}
