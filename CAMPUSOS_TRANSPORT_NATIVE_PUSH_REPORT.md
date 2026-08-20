# CampusOS Transport V2 — Native Push Notification Report

## 1. Native Push Infrastructure

CampusOS Transport V2 integrates `@capacitor/push-notifications` and `@capacitor/local-notifications` with real-time Socket.IO broadcasts for seamless web and native Android/iOS alert delivery.

---

## 2. Notification Triggers & Payloads

### 2.1 Approaching Stop Geofence Alert
- **Trigger**: Ingested GPS location is within $\le 2.5\text{ km}$ or $\le 10\text{ minutes}$ of a passenger's assigned stop.
- **Event**: `BUS_APPROACHING_STOP`
- **Deduplication**: 30-minute in-memory cache keyed by `${tripId}:${passengerId}:${stopId}:APPROACHING`.

```json
{
  "tripId": "TRIP-2026-08-20-001",
  "routeId": "154a4046-4b3b-4f24-ae14-28991c840e52",
  "routeName": "Route 06 — Vadavalli Metro",
  "stopId": "136ea64f-fe18-43cc-a84d-7d432d789cfc",
  "stopName": "Navavoor Pirivu",
  "distanceKm": 0.12,
  "etaMinutes": 1,
  "message": "Your college bus on Route 06 — Vadavalli Metro is approaching Navavoor Pirivu (~1 min away).",
  "timestamp": "2026-08-20T04:45:00.000Z"
}
```

### 2.2 Vehicle Replacement & Breakdown Broadcast
- **Trigger**: Transport Manager invokes `/trips/replace-vehicle` or Driver reports breakdown.
- **Event**: `TRANSPORT_VEHICLE_REPLACED`
- **Audience**: Broadcasted directly to all active `TransportAllocation` holders on the affected route.

```json
{
  "routeId": "154a4046-4b3b-4f24-ae14-28991c840e52",
  "routeName": "Route 06 — Vadavalli Metro",
  "oldVehicleNo": "TN 38 BR 1234",
  "newVehicleNumber": "TN 38 BR 9999",
  "message": "Notice: Bus for Route 06 — Vadavalli Metro has been replaced with vehicle TN 38 BR 9999. Please watch for TN 38 BR 9999.",
  "timestamp": "2026-08-20T04:45:05.000Z"
}
```

---

## 3. Automated Push Verification

```
[PASS] Scenario 8a: Geofence Approaching Stop Detector Fired — Alerts emitted: 1
[PASS] Scenario 8b: 30-Minute Geofence Alert Deduplication Suppression
[PASS] Scenario 11: Emergency Breakdown & Replacement Vehicle Workflow — Replaced bus with: TN 38 BR 9999, Passengers Broadcasted: 14
```

### Verification Findings:
1. **Zero Duplicate Spam**: Running back-to-back telemetry pings within the geofence threshold generates exactly **1 notification** within a 30-minute window.
2. **Instant Replacement Broadcast**: When replacement bus `TN 38 BR 9999` was assigned, all 14 allocated passengers received immediate push notifications.
