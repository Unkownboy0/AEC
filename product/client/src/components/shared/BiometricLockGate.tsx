import React, { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { isNativePlatform } from '../../platform';
import { authenticateWithBiometrics, getBiometricLockEnabled } from '../../platform/biometric-auth';
import { useAuth } from '../../context/AuthContext';

/*
  Gates the app behind a biometric prompt on cold launch and on foreground-resume,
  but only when the user has opted in via Settings > Security ("Biometric App Lock").
  Disabled (default): renders children immediately, no native calls made.
  A failed/cancelled prompt keeps the lock screen up with a retry — it never signs
  the user out on its own; "Log out instead" is an explicit user choice.
*/
export const BiometricLockGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockEnabledRef = useRef(false);

  const tryUnlock = async () => {
    setChecking(true);
    setError(null);
    const result = await authenticateWithBiometrics('Unlock CampusOS');
    setChecking(false);
    if (result.success) {
      setLocked(false);
    } else {
      setError(result.error || 'Authentication failed. Try again.');
    }
  };

  useEffect(() => {
    if (!isNativePlatform() || !user) return;

    let cancelled = false;
    getBiometricLockEnabled().then((enabled) => {
      if (cancelled) return;
      lockEnabledRef.current = enabled;
      if (enabled) {
        setLocked(true);
        tryUnlock();
      }
    });

    const onForeground = () => {
      if (lockEnabledRef.current) {
        setLocked(true);
        tryUnlock();
      }
    };
    window.addEventListener('campusos_app_foreground', onForeground);
    return () => {
      cancelled = true;
      window.removeEventListener('campusos_app_foreground', onForeground);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-app-bg pt-safe pb-safe px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-base font-bold text-text-primary">CampusOS is locked</h2>
        <p className="text-xs text-text-secondary mt-1 max-w-xs">
          Use your device biometrics to continue.
        </p>
        {error && <p className="text-xs text-danger mt-2 max-w-xs">{error}</p>}
      </div>
      <button
        type="button"
        onClick={tryUnlock}
        disabled={checking}
        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60 touch-target"
      >
        {checking ? 'Verifying…' : 'Unlock'}
      </button>
      <button
        type="button"
        onClick={() => logout()}
        className="text-xs font-semibold text-text-secondary underline touch-target"
      >
        Log out instead
      </button>
    </div>
  );
};
