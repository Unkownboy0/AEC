import React, { createContext, useContext, useState } from 'react';
import { UniversalProfileDrawer } from '../components/profile/UniversalProfileDrawer';

interface ProfileDrawerContextType {
  openProfile: (userId: string) => void;
  closeProfile: () => void;
}

const ProfileDrawerContext = createContext<ProfileDrawerContextType | undefined>(undefined);

export const ProfileDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openProfile = (userId: string) => {
    if (!userId) return;
    setActiveUserId(userId);
    setIsOpen(true);
  };

  const closeProfile = () => {
    setIsOpen(false);
    setActiveUserId(null);
  };

  return (
    <ProfileDrawerContext.Provider value={{ openProfile, closeProfile }}>
      {children}
      <UniversalProfileDrawer
        userId={activeUserId}
        isOpen={isOpen}
        onClose={closeProfile}
        onNavigateToUser={(newId) => setActiveUserId(newId)}
      />
    </ProfileDrawerContext.Provider>
  );
};

export const useProfileDrawer = () => {
  const context = useContext(ProfileDrawerContext);
  if (!context) {
    throw new Error('useProfileDrawer must be used within a ProfileDrawerProvider');
  }
  return context;
};
