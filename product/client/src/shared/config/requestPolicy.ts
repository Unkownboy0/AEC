import { useEffect, useState } from 'react';
import api from '../../lib/axios';

export interface RequestPolicy {
  odMinAdvanceDays: number;
  leaveMinAdvanceDays: number;
}

const SAFE_DEFAULT: RequestPolicy = { odMinAdvanceDays: 2, leaveMinAdvanceDays: 0 };

export function useRequestPolicy(): RequestPolicy {
  const [policy, setPolicy] = useState<RequestPolicy>(SAFE_DEFAULT);

  useEffect(() => {
    let active = true;
    api.get('/settings/request-policy')
      .then((response) => {
        const value = response.data?.data;
        if (active && Number.isInteger(value?.odMinAdvanceDays) && value.odMinAdvanceDays >= 0) {
          setPolicy({
            odMinAdvanceDays: value.odMinAdvanceDays,
            leaveMinAdvanceDays: Number.isInteger(value.leaveMinAdvanceDays) ? value.leaveMinAdvanceDays : 0,
          });
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  return policy;
}

export function minimumRequestDate(type: string, policy: RequestPolicy): string {
  const min = new Date();
  min.setHours(12, 0, 0, 0);
  min.setDate(min.getDate() + (type === 'OD' ? policy.odMinAdvanceDays : policy.leaveMinAdvanceDays));
  return min.toISOString().slice(0, 10);
}
