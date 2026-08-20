export type BiometricLockPhase = 'initializing' | 'disabled' | 'locked' | 'unlocking' | 'unlocked';

export interface BiometricLockSnapshot {
  phase: BiometricLockPhase;
  enabled: boolean;
  backgroundedAt: number | null;
}

export class BiometricLockStateMachine {
  private snapshot: BiometricLockSnapshot = {
    phase: 'initializing',
    enabled: false,
    backgroundedAt: null,
  };

  constructor(private readonly timeoutMs = 0) {}

  get value(): BiometricLockSnapshot {
    return { ...this.snapshot };
  }

  initialize(enabled: boolean): BiometricLockSnapshot {
    this.snapshot = {
      phase: enabled ? 'locked' : 'disabled',
      enabled,
      backgroundedAt: null,
    };
    return this.value;
  }

  background(now = Date.now()): BiometricLockSnapshot {
    if (this.snapshot.enabled) this.snapshot.backgroundedAt = now;
    return this.value;
  }

  foreground(now = Date.now()): BiometricLockSnapshot {
    const { enabled, backgroundedAt } = this.snapshot;
    if (enabled && backgroundedAt !== null && now - backgroundedAt >= this.timeoutMs) {
      this.snapshot.phase = 'locked';
    }
    this.snapshot.backgroundedAt = null;
    return this.value;
  }

  beginUnlock(): boolean {
    if (!this.snapshot.enabled || this.snapshot.phase === 'unlocking') return false;
    this.snapshot.phase = 'unlocking';
    return true;
  }

  finishUnlock(success: boolean): BiometricLockSnapshot {
    this.snapshot.phase = success ? 'unlocked' : 'locked';
    return this.value;
  }

  logout(): BiometricLockSnapshot {
    this.snapshot.phase = this.snapshot.enabled ? 'locked' : 'disabled';
    this.snapshot.backgroundedAt = null;
    return this.value;
  }
}
