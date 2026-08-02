import React from 'react';
import { UniversalProfileWorkspace } from './UniversalProfileWorkspace';

interface UniversalProfileDrawerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToUser?: (newUserId: string) => void;
}

export const UniversalProfileDrawer: React.FC<UniversalProfileDrawerProps> = ({
  userId,
  isOpen,
  onClose,
  onNavigateToUser,
}) => {
  if (!isOpen || !userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl h-full overflow-y-auto bg-slate-950 p-4 shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        <UniversalProfileWorkspace
          userId={userId}
          onNavigateToUser={onNavigateToUser}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
