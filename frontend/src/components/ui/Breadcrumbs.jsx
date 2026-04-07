import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Breadcrumbs({ items, className }) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from path if items not provided
  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumbs = items || pathnames.map((value, index) => {
    const path = `/${pathnames.slice(0, index + 1).join('/')}`;
    return {
      label: value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' '),
      path,
    };
  });

  return (
    <nav className={cn('flex items-center gap-2 text-xs font-medium mb-6', className)}>
      <Link
        to="/"
        className="text-text-tertiary hover:text-primary transition-colors flex items-center gap-1"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Home</span>
      </Link>

      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <React.Fragment key={item.path || index}>
            <ChevronRight className="w-3.5 h-3.5 text-border" />
            {isLast ? (
              <span className="text-text-primary font-bold tracking-tight">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path || '#'}
                className="text-text-tertiary hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
