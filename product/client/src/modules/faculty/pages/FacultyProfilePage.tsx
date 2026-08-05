import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Building, BookOpen } from 'lucide-react';
import { pageVariants } from '../../../design-system/tokens/motion';
import { useAuth } from '../../../context/AuthContext';

export const FacultyProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-3xl">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">{user?.firstName} {user?.lastName}</h1>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{user?.role}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1 p-3 bg-muted/30 rounded-xl border border-border">
            <span className="text-muted-foreground font-semibold flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-primary" /> Email</span>
            <span className="font-bold text-foreground block">{user?.email}</span>
          </div>
          <div className="space-y-1 p-3 bg-muted/30 rounded-xl border border-border">
            <span className="text-muted-foreground font-semibold flex items-center gap-1.5"><Building className="h-3.5 w-3.5 text-primary" /> Role</span>
            <span className="font-bold text-foreground block">{user?.role}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
