import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

const colorStyles = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
};

export function KPICard({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  description, 
  className,
  color = 'primary'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'stitch-card stitch-card-hover p-5 flex flex-col gap-3',
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className={cn('p-2.5 rounded-lg', colorStyles[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full border',
            trend.isUp ? 'bg-success/5 text-success border-success/20' : 'bg-danger/5 text-danger border-danger/20'
          )}>
            {trend.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.value}
          </div>
        )}
      </div>
      
      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-text-primary tracking-tight">{value}</h3>
        {description && (
          <p className="text-xs text-text-tertiary mt-1">{description}</p>
        )}
      </div>
    </motion.div>
  );
}
