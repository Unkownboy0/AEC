import React, { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { isNativePlatform } from '../../platform';
import { authenticateWithBiometrics, getBiometricLockEnabled } from '../../platform/biometric-auth';
import { BiometricLockStateMachine, type BiometricLockPhase } from '../../platform/biometric-lock-state';
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
  const [phase, setPhase] = useState<BiometricLockPhase>(isNativePlatform() && user ? 'initializing' : 'disabled');
  const [error, setError] = useState<string | null>(null);
  const machineRef = useRef(new BiometricLockStateMachine(0));
  const promptRef = useRef<Promise<void> | null>(null);

  const tryUnlock = () => {
    if (promptRef.current || !machineRef.current.beginUnlock()) return promptRef.current;
    setPhase('unlocking');
    setError(null);
    const attempt = authenticateWithBiometrics('Unlock CampusOS').then((result) => {
      const next = machineRef.current.finishUnlock(result.success);
      setPhase(next.phase);
      if (!result.success) setError(result.error || 'Authentication failed. Try again.');
    }).finally(() => {
      promptRef.current = null;
    });
    promptRef.current = attempt;
    return attempt;
  };

  useEffect(() => {
    if (!isNativePlatform() || !user) {
      setPhase('disabled');
      return;
    }

    let cancelled = false;
    setPhase('initializing');
    getBiometricLockEnabled().then(async (enabled) => {
      if (cancelled) return;
      const next = machineRef.current.initialize(enabled);
      setPhase(next.phase);
      if (enabled) {
        await tryUnlock();
      }
    });

    const onForeground = () => {
      // Native biometric dialogs themselves can background/foreground the app.
      // Never treat that transition as a second unlock request.
      if (promptRef.current) return;
      const next = machineRef.current.foreground();
      setPhase(next.phase);
      if (next.phase === 'locked') {
        void tryUnlock();
      }
    };
    const onBackground = () => {
      if (promptRef.current) return;
      machineRef.current.background();
    };
    window.addEventListener('campusos_app_foreground', onForeground);
    window.addEventListener('campusos_app_background', onBackground);
    return () => {
      cancelled = true;
      window.removeEventListener('campusos_app_foreground', onForeground);
      window.removeEventListener('campusos_app_background', onBackground);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (phase === 'disabled' || phase === 'unlocked') return <>{children}</>;

  const checking = phase === 'initializing' || phase === 'unlocking';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-app-bg pt-safe pb-safe px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-base font-bold text-text-primary">CampusOS is locked</h2>
        <p className="text-xs text-text-secondary mt-1 max-w-xs">
          {phase === 'initializing' ? 'Checking app-lock security…' : 'Use your device biometrics to continue.'}
        </p>
        {error && <p className="text-xs text-danger mt-2 max-w-xs">{error}</p>}
      </div>
      <button
        type="button"
        onClick={() => void tryUnlock()}
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
