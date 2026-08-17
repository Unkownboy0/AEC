export class ScreenSecurityService {
  private static privacyOverlay: HTMLDivElement | null = null;

  /**
   * Initializes privacy overlay for app-switcher protection on mobile.
   */
  public static init(): void {
    if (typeof document === 'undefined') return;

    // On native Android/iOS WebViews, window blur fires during keyboard/input events;
    // Native OS already manages app-switcher snapshots securely.
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      return;
    }

    window.addEventListener('blur', () => {
      this.showPrivacyShield();
    });

    window.addEventListener('focus', () => {
      this.hidePrivacyShield();
    });
  }

  public static showPrivacyShield(): void {
    if (this.privacyOverlay) return;
    this.privacyOverlay = document.createElement('div');
    this.privacyOverlay.id = 'campusos-privacy-shield';
    this.privacyOverlay.style.position = 'fixed';
    this.privacyOverlay.style.top = '0';
    this.privacyOverlay.style.left = '0';
    this.privacyOverlay.style.width = '100vw';
    this.privacyOverlay.style.height = '100vh';
    this.privacyOverlay.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
    this.privacyOverlay.style.backdropFilter = 'blur(20px)';
    this.privacyOverlay.style.zIndex = '999999';
    this.privacyOverlay.style.display = 'flex';
    this.privacyOverlay.style.flexDirection = 'column';
    this.privacyOverlay.style.alignItems = 'center';
    this.privacyOverlay.style.justifyContent = 'center';
    this.privacyOverlay.style.color = '#ffffff';
    this.privacyOverlay.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 28px; font-weight: 800; margin-bottom: 8px;">CampusOS</div>
        <div style="font-size: 12px; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase;">Protected Institutional Session</div>
      </div>
    `;
    document.body.appendChild(this.privacyOverlay);
  }

  public static hidePrivacyShield(): void {
    if (this.privacyOverlay) {
      this.privacyOverlay.remove();
      this.privacyOverlay = null;
    }
  }
}
