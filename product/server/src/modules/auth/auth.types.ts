export interface JwtAccessPayload {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface JwtRefreshPayload {
  sessionId: string;
  userId: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    profilePhoto?: string | null;
    permissions: string[];
    menus: any[];
    forcePasswordChange?: boolean;
  };
}

export interface UserSessionData {
  id: string;
  userId: string;
  refreshToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  device: string | null;
  browser: string | null;
  expiresAt: Date;
  createdAt: Date;
}
