import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { getEntryForLocation } from '../../navigation/navigation.utils';

export const BreadcrumbNav: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="hidden md:flex items-center gap-1.5 text-xs text-text-muted">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-text-primary transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Dashboard</span>
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const routeEntry = getEntryForLocation(to);
        const formattedLabel =
          routeEntry?.label ||
          value
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3 h-3 text-border-strong shrink-0" />
            {isLast ? (
              <span className="font-bold text-text-primary truncate max-w-[150px]">
                {formattedLabel}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-text-primary transition-colors font-medium truncate max-w-[120px]"
              >
                {formattedLabel}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
