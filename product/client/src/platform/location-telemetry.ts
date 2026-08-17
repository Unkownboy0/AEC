import { deviceCapabilities } from './device-capabilities.manager';
import api from '../lib/axios';
import type { DriverGpsLocation } from './platform.types';

export class LocationTelemetryService {
  private static watchId: number | null = null;
  private static isBroadcasting = false;

  /**
   * Starts broadcasting live GPS telemetry for an authorized driver on an active route.
   */
  public static async startDriverBroadcast(
    routeId: string,
    onLocationUpdate?: (loc: DriverGpsLocation) => void,
    onError?: (err: string) => void
  ): Promise<boolean> {
    const perm = await deviceCapabilities.requestLocationPermission();
    if (perm !== 'GRANTED') {
      if (perm === 'DISABLED_BY_SUPER_ADMIN') {
        onError?.('Driver GPS telemetry is disabled by institutional policy.');
      } else {
        onError?.('Location permission required for route telemetry broadcast.');
      }
      return false;
    }

    if (this.isBroadcasting) return true;

    try {
      this.isBroadcasting = true;
      let lastBroadcastTime = 0;

      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const loc: DriverGpsLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
          };

          onLocationUpdate?.(loc);

          // Throttle network dispatch to every 5 seconds to preserve battery
          const now = Date.now();
          if (now - lastBroadcastTime > 5000) {
            lastBroadcastTime = now;
            try {
              await api.post(`/transport/routes/${routeId}/telemetry`, loc).catch(() => null);
            } catch {
              // Ignore network glitches
            }
          }
        },
        (error) => {
          onError?.(error.message);
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
      );

      return true;
    } catch (err: any) {
      onError?.(err.message || 'Failed to start GPS');
      return false;
    }
  }

  /**
   * Stops the active GPS telemetry broadcast.
   */
  public static stopDriverBroadcast(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isBroadcasting = false;
  }

  public static isTracking(): boolean {
    return this.isBroadcasting;
  }
}
