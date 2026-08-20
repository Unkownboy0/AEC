import React from 'react';
import { ProfileAvatar } from '../profile/ProfileAvatar';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  alt?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  alt,
}) => {
  return <ProfileAvatar src={src} name={name} size={size} shape="rounded" className={className} alt={alt} />;
};

export default Avatar;
