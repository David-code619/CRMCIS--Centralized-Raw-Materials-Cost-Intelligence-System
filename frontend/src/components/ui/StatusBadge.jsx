import React from 'react';
import { cn } from '../../lib/utils';

const statusStyles = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200',
};

export function StatusBadge({ status, children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border',
        statusStyles[status],
        className
      )}
    >
      {children}
    </span>
  );
}
