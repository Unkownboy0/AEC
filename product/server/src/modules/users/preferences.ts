import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserPreferences {
  theme: 'system' | 'light' | 'dark';
  fontScale: 'compact' | 'default' | 'comfortable' | 'large';
  language: string;
  notificationsEnabled: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  fontScale: 'default',
  language: 'en',
  notificationsEnabled: true,
};

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.notificationPreferences) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const parsed = JSON.parse(user.notificationPreferences);
    return {
      theme: parsed.theme || DEFAULT_PREFERENCES.theme,
      fontScale: parsed.fontScale || DEFAULT_PREFERENCES.fontScale,
      language: parsed.language || DEFAULT_PREFERENCES.language,
      notificationsEnabled: parsed.notificationsEnabled !== undefined ? parsed.notificationsEnabled : DEFAULT_PREFERENCES.notificationsEnabled,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function updateUserPreferences(userId: string, input: Partial<UserPreferences>): Promise<UserPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  let current: Partial<UserPreferences> = {};
  if (user.notificationPreferences) {
    try {
      current = JSON.parse(user.notificationPreferences);
    } catch {}
  }

  const updated: UserPreferences = {
    theme: input.theme !== undefined ? input.theme : (current.theme || DEFAULT_PREFERENCES.theme),
    fontScale: input.fontScale !== undefined ? input.fontScale : (current.fontScale || DEFAULT_PREFERENCES.fontScale),
    language: input.language !== undefined ? input.language : (current.language || DEFAULT_PREFERENCES.language),
    notificationsEnabled: input.notificationsEnabled !== undefined ? input.notificationsEnabled : (current.notificationsEnabled !== undefined ? current.notificationsEnabled : DEFAULT_PREFERENCES.notificationsEnabled),
  };

  await prisma.user.update({
    where: { id: userId },
    data: {
      notificationPreferences: JSON.stringify(updated),
    },
  });

  return updated;
}
