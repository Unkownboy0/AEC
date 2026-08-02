import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UniversalProfileWorkspace } from '../../components/profile/UniversalProfileWorkspace';

export const UniversalProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const activeId = userId || 'me';

  const handleNavigateToUser = (newUserId: string) => {
    navigate(`/profile/${newUserId}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <UniversalProfileWorkspace
        userId={activeId}
        onNavigateToUser={handleNavigateToUser}
      />
    </div>
  );
};

export default UniversalProfilePage;
