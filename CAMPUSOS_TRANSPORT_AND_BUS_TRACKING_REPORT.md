# GEETORUS CampusOS — Transport & Live Bus Tracking Engine Report

## 1. Architecture Overview
The Transport & Live Bus Tracking Engine operates as a secure, real-time telemetry and pass-management system adhering strictly to the student residency model:

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌───────────────────────┐
│ GPS Telemetry Device / │ ───> │ POST /tracking/location │ ───> │ VehicleLocation DB    │
│ Driver Mobile Client   │      └─────────────────────────┘      └───────────┬───────────┘
└────────────────────────┘                                                   │
                                                                             v
┌────────────────────────┐      ┌─────────────────────────┐      ┌───────────────────────┐
│ Student / Parent App   │ <─── │ SSE / Socket Broadcast  │ <─── │ broadcastRBACUpdate   │
│ Live Tracking UI       │      │ VEHICLE_LOCATION_UPDATED│      │ (Real-time telemetry) │
└────────────────────────┘      └─────────────────────────┘      └───────────────────────┘
```

---

## 2. Canonical Authorization Rules

1. **Hosteller Students**:
   - `student.residentialType === 'HOSTELLER'`
   - Live College Bus Tracking is **HIDDEN**.
   - API returns `{ isEligible: false, reason: 'HOSTELLER', message: 'Student is a Hosteller resident. College Bus Tracking is not applicable.' }`.
   - UI presents Hosteller residency profile and one-tap navigation to the Student Hostel Portal.

2. **Day Scholar — Non-College Bus**:
   - `student.residentialType === 'DAY_SCHOLAR'` and `student.transportMode !== 'COLLEGE_BUS'` (`OWN_VEHICLE`, `PUBLIC_TRANSPORT`, `PARENT_DROP_PICKUP`).
   - Live College Bus Tracking is **HIDDEN**.
   - API returns `{ isEligible: false, reason: 'NON_COLLEGE_BUS', transportMode, message: 'Student commute mode is set to SELF/OTHER.' }`.
   - UI presents registered commute mode with form to request a College Bus pass.

3. **Day Scholar — College Bus (Pending Allocation)**:
   - `student.transportMode === 'COLLEGE_BUS'` with no active `TransportAllocation` row.
   - API returns `{ isEligible: false, reason: 'ALLOCATION_PENDING', message: 'College Bus mode selected, but seat allocation is currently pending review...' }`.
   - UI indicates application under review with the Transport Manager.

4. **Day Scholar — College Bus (Active Allocation)**:
   - `student.transportMode === 'COLLEGE_BUS'` with active `TransportAllocation` linked to `TransportRoute` and `TransportStop`.
   - API returns authorized live tracking payload:
     - `route`: ID, Name, Code, Origin, Destination, Total Distance.
     - `assignedStop`: ID, Name, Sequence, Morning Pickup Time, Evening Drop Time, Latitude, Longitude.
     - `vehicle`: ID, Number, Type, Registration Number.
     - `driver`: Name, Work Contact Phone.
     - `liveLocation`: Real Latitude & Longitude, Speed (km/h), Heading, Recorded Timestamp, Staleness calculation (`isStale: diff > 60s`, "Updated 12s ago" or "Location temporarily unavailable").
     - `etaMinutes`: Dynamic estimated arrival time.
     - `stops`: Full route sequential progression with active student stop flagged.

---

## 3. Telemetry Ingestion & Real-Time Broadcast
- **Endpoint**: `POST /api/transport/tracking/location`
- **Payload**:
  ```json
  {
    "vehicleId": "uuid-vehicle",
    "tripId": "TRIP-2026-08",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "speed": 38.5,
    "heading": 180,
    "accuracy": 4.2,
    "source": "GPS_DEVICE"
  }
  ```
- **Execution**:
  - Inserts row into PostgreSQL `vehicle_locations` table with indexed timestamp.
  - Triggers `broadcastRBACUpdate` event `VEHICLE_LOCATION_UPDATED`.
  - Connected client apps re-render the bus position and recalculate ETA in real time without refreshing the page.
