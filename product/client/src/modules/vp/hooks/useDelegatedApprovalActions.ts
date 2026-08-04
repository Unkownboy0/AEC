import { useState } from 'react';
import api from '@/lib/axios';

export const useDelegatedApprovalActions = (onSuccess?: () => void) => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const approveRequest = async (requestId: string, remarks?: string) => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await api.post(`/vp/acting-principal/approvals/${requestId}/approve`, { remarks });
      if (onSuccess) onSuccess();
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Approval failed';
      setActionError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const rejectRequest = async (requestId: string, remarks?: string) => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await api.post(`/vp/acting-principal/approvals/${requestId}/reject`, { remarks });
      if (onSuccess) onSuccess();
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Rejection failed';
      setActionError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const returnRequest = async (requestId: string, remarks?: string) => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await api.post(`/vp/acting-principal/approvals/${requestId}/return`, { remarks });
      if (onSuccess) onSuccess();
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Return failed';
      setActionError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const requestInfo = async (requestId: string, remarks?: string) => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await api.post(`/vp/acting-principal/approvals/${requestId}/request-info`, { remarks });
      if (onSuccess) onSuccess();
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Request info failed';
      setActionError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    approveRequest,
    rejectRequest,
    returnRequest,
    requestInfo,
    submitting,
    actionError,
  };
};
