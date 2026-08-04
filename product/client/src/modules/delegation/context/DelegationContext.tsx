import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '@/lib/axios';

export interface DelegationContextType {
  principalStatus: 'ONLINE' | 'BUSY' | 'OFFLINE';
  delegationStatus: 'INACTIVE' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  isActingPrincipal: boolean;
  actingPrincipalUserId: string | null;
  actingUser: { id: string; name: string; role: string } | null;
  delegationId: string | null;
  delegationStartsAt: string | null;
  delegationEndsAt: string | null;
  permissions: string[];
  permissionVersion: number;
  pendingPrincipalRequests: number;
  pendingActingRequests: number;
  latestHandoverId: string | null;
  loading: boolean;
  refreshStatus: () => Promise<void>;
  updateStatus: (dto: {
    status: 'ONLINE' | 'BUSY' | 'OFFLINE';
    reason?: string;
    startsAt?: string;
    endsAt?: string;
    actingUserId?: string;
    permissions?: string[];
    emergencyContactNote?: string;
    messageToVp?: string;
  }) => Promise<void>;
  revokeDelegation: () => Promise<void>;
}

const DelegationContext = createContext<DelegationContextType | undefined>(undefined);

export const DelegationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [principalStatus, setPrincipalStatus] = useState<'ONLINE' | 'BUSY' | 'OFFLINE'>('ONLINE');
  const [delegationStatus, setDelegationStatus] = useState<'INACTIVE' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'>('INACTIVE');
  const [isActingPrincipal, setIsActingPrincipal] = useState<boolean>(false);
  const [actingPrincipalUserId, setActingPrincipalUserId] = useState<string | null>(null);
  const [actingUser, setActingUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [delegationId, setDelegationId] = useState<string | null>(null);
  const [delegationStartsAt, setDelegationStartsAt] = useState<string | null>(null);
  const [delegationEndsAt, setDelegationEndsAt] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionVersion, setPermissionVersion] = useState<number>(1);
  const [pendingPrincipalRequests, setPendingPrincipalRequests] = useState<number>(0);
  const [pendingActingRequests, setPendingActingRequests] = useState<number>(0);
  const [latestHandoverId, setLatestHandoverId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userRole = (typeof user.role === 'object' ? (user.role as any)?.name : String(user.role || '')).toUpperCase();
      const endpoint = userRole.includes('VP') || userRole.includes('VICE')
        ? '/vp/acting-principal/context'
        : '/principal/availability/context';

      const res = await api.get(endpoint);

      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        // Normalize legacy AVAILABLE → ONLINE
        const normalizedStatus = d.principalStatus === 'AVAILABLE' ? 'ONLINE' : d.principalStatus;
        setPrincipalStatus(normalizedStatus || 'ONLINE');
        setDelegationStatus(d.delegationStatus || 'INACTIVE');
        setIsActingPrincipal(Boolean(d.isActingPrincipal));
        setActingPrincipalUserId(d.actingPrincipalUserId || null);
        setActingUser(d.actingUser || null);
        setDelegationId(d.delegationId || null);
        setDelegationStartsAt(d.delegationStartsAt || null);
        setDelegationEndsAt(d.delegationEndsAt || null);
        setPermissions(d.permissions || []);
        setPermissionVersion(d.permissionVersion || 1);
        setPendingPrincipalRequests(d.pendingPrincipalRequests || 0);
        setPendingActingRequests(d.pendingActingRequests || 0);
        setLatestHandoverId(d.latestHandoverId || null);
      }
    } catch (err) {
      console.error('Failed to fetch authoritative delegation context:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
    // Poll every 5 seconds to ensure synchronized realtime state across all devices
    const interval = setInterval(fetchStatus, 5000);

    const handleCustomEvent = () => {
      fetchStatus();
    };

    window.addEventListener('principal_status_changed', handleCustomEvent);
    return () => {
      clearInterval(interval);
      window.removeEventListener('principal_status_changed', handleCustomEvent);
    };
  }, [fetchStatus]);

  const updateStatus = async (dto: any) => {
    try {
      const res = await api.post('/principal/availability', dto);
      if (res.status === 200) {
        await fetchStatus();
        window.dispatchEvent(new Event('principal_status_changed'));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const revokeDelegation = async () => {
    if (!delegationId) return;
    try {
      const res = await api.post(`/principal/delegations/${delegationId}/revoke`, {
        reason: 'PRINCIPAL_MANUAL_REVOKE'
      });
      if (res.status === 200) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Failed to revoke delegation:', err);
    }
  };

  return (
    <DelegationContext.Provider
      value={{
        principalStatus,
        delegationStatus,
        isActingPrincipal,
        actingPrincipalUserId,
        actingUser,
        delegationId,
        delegationStartsAt,
        delegationEndsAt,
        permissions,
        permissionVersion,
        pendingPrincipalRequests,
        pendingActingRequests,
        latestHandoverId,
        loading,
        refreshStatus: fetchStatus,
        updateStatus,
        revokeDelegation
      }}
    >
      {children}
    </DelegationContext.Provider>
  );
};

export const useDelegationContext = () => {
  const context = useContext(DelegationContext);
  if (!context) {
    throw new Error('useDelegationContext must be used within a DelegationProvider');
  }
  return context;
};
