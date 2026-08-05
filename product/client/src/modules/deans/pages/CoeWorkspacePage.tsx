import React from 'react';
import { motion } from 'framer-motion';
import { Award, AlertCircle, CheckSquare, Clock } from 'lucide-react';
import { pageVariants } from '../../../design-system/tokens/motion';

export const CoeWorkspacePage: React.FC = () => {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Controller of Examinations (COE) Workspace</h1>
            <p className="text-xs text-muted-foreground">Examination scheduling, evaluation control, and grade sheet publishing.</p>
          </div>
        </div>

        <div className="p-4 bg-muted/40 rounded-xl border border-border/80 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-foreground block">Backend API Dependency Notice</span>
            <p className="text-muted-foreground">
              Examination schedules and mark sheet management currently consume shared enterprise endpoints. Dedicated COE backend services will automatically connect as backend capabilities are expanded.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
