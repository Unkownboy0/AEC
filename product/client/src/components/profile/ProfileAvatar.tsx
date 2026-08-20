import React, { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import api from '../../lib/axios';

export type ProfileAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ProfileAvatarShape = 'circle' | 'rounded' | 'square';

export interface ProfileAvatarPerson {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  gender?: string | null;
  profilePhoto?: string | null;
  profileImage?: { fileId?: string | null; url?: string | null; version?: string | null } | null;
}

export interface ProfileAvatarProps {
  person?: ProfileAvatarPerson | null;
  user?: ProfileAvatarPerson | null;
  src?: string | null;
  fileId?: string | null;
  gender?: string | null;
  name?: string | null;
  size?: ProfileAvatarSize;
  shape?: ProfileAvatarShape;
  className?: string;
  alt?: string;
}

const SIZE_CLASSES: Record<ProfileAvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl sm:w-28 sm:h-28 sm:text-3xl',
};
const SHAPE_CLASSES: Record<ProfileAvatarShape, string> = { circle: 'rounded-full', rounded: 'rounded-xl', square: 'rounded-none' };
const BG_COLORS = ['bg-indigo-600', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600', 'bg-teal-600'];

function initials(value?: string | null) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function bgColor(value?: string | null) {
  const name = String(value || 'User');
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = name.charCodeAt(index) + ((hash << 5) - hash);
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

function apiEndpoint(value: string): string | null {
  if (value.startsWith('data:') || value.startsWith('blob:')) return null;
  if (value.startsWith('/api/')) return value.slice(4);
  if (/^https?:\/\//i.test(value)) {
    try {
      const target = new URL(value);
      const apiBase = new URL(String(api.defaults.baseURL || '/api'), window.location.origin);
      if (target.origin !== apiBase.origin) return null;
    } catch { return null; }
  }
  return value;
}

function genderDefault(value?: string | null): string | null {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'MALE' || normalized === 'M' || normalized === 'MAN') return '/avatars/default-male.svg';
  if (normalized === 'FEMALE' || normalized === 'F' || normalized === 'WOMAN') return '/avatars/default-female.svg';
  if (normalized === 'OTHER' || normalized === 'PREFER_NOT_TO_SAY') return '/avatars/default-neutral.svg';
  return null;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  person: personProp, user, src, fileId, gender, name, size = 'md', shape = 'rounded', className, alt,
}) => {
  const person = personProp || user;
  const displayName = name || person?.fullName || [person?.firstName, person?.lastName].filter(Boolean).join(' ') || 'User';
  const displayGender = gender ?? person?.gender;
  const imageRef = src || person?.profileImage?.url || person?.profilePhoto
    || ((fileId || person?.profileImage?.fileId) && person?.id ? `/users/${person.id}/avatar` : null);
  
  const isDirectUrl = imageRef && (imageRef.startsWith('data:') || imageRef.startsWith('blob:') || imageRef.startsWith('http://') || imageRef.startsWith('https://') || imageRef.startsWith('/uploads/'));
  const endpoint = !isDirectUrl && imageRef ? apiEndpoint(imageRef) : null;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [realImageFailed, setRealImageFailed] = useState(false);
  const [defaultFailed, setDefaultFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    setObjectUrl(null);
    setRealImageFailed(false);

    if (isDirectUrl) {
      setObjectUrl(imageRef);
      return () => { active = false; };
    }

    if (!endpoint) {
      if (imageRef && !isDirectUrl) setRealImageFailed(true);
      return () => { active = false; };
    }

    api.get(endpoint, { responseType: 'blob' })
      .then((response) => {
        if (!active || !response.data?.size) throw new Error('Empty image');
        createdUrl = URL.createObjectURL(response.data);
        setObjectUrl(createdUrl);
      })
      .catch(() => { if (active) setRealImageFailed(true); });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [endpoint, imageRef, isDirectUrl]);

  useEffect(() => setDefaultFailed(false), [displayGender]);
  const defaultAsset = useMemo(() => genderDefault(displayGender), [displayGender]);
  const showDefault = (!imageRef || realImageFailed) && defaultAsset && !defaultFailed;

  return (
    <div
      className={clsx('relative flex shrink-0 select-none items-center justify-center overflow-hidden font-bold text-white shadow-xs', SIZE_CLASSES[size], SHAPE_CLASSES[shape], !objectUrl && !showDefault && bgColor(displayName), className)}
      aria-label={alt || displayName}
    >
      {objectUrl && !realImageFailed ? (
        <img src={objectUrl} alt={alt || displayName} className="h-full w-full object-cover" onError={() => setRealImageFailed(true)} />
      ) : showDefault ? (
        <img src={defaultAsset!} alt={alt || displayName} className="h-full w-full object-cover" onError={() => setDefaultFailed(true)} />
      ) : (
        <span>{initials(displayName)}</span>
      )}
    </div>
  );
};

export default ProfileAvatar;
