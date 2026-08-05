import React from 'react';
import { motion } from 'framer-motion';
import { cardHoverVariants } from '../tokens/motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  comparison?: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  isPositive,
  comparison,
  icon: Icon,
  colorClass = 'bg-primary/10 text-primary',
  onClick,
}) => {
  return (
    <motion.div
      variants={cardHoverVariants}
      initial="rest"
      whileHover={onClick ? 'hover' : undefined}
      onClick={onClick}
      className={`border bg-card p-4 rounded-xl shadow-sm transition-colors duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-primary/50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-extrabold tracking-tight block text-foreground">{value}</span>
        {trend && (
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend}
            </span>
            {comparison && <span className="text-[9px] text-muted-foreground">{comparison}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
};
