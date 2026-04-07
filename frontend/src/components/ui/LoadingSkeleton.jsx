import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-border rounded-md',
        className
      )}
    />
  );
}

export function KPICardSkeleton() {
  return (
    <div className="stitch-card p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex justify-between items-start">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-32 h-8" />
        <Skeleton className="w-48 h-3" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="stitch-card overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-border bg-background">
        <Skeleton className="w-48 h-4" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="px-6 py-4 flex gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton key={cIdx} className="flex-1 h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
