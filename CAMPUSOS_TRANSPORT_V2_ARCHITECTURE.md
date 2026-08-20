# CampusOS Transport V2 — Architecture & Real-Time Engine Specification

## 1. Executive Summary

CampusOS Transport V2 modernizes college transportation into a high-precision, real-time fleet tracking and transit management system. Built upon the foundational principle:

$$\text{Person} \longrightarrow \text{Transport Eligibility} \longrightarrow \text{Active Allocation} \longrightarrow \text{Route} \longrightarrow \text{Stop} \longrightarrow \text{Trip} \longrightarrow \text{Vehicle} \longrightarrow \text{GPS Location} \longrightarrow \text{Live Map / ETA} \longrightarrow \text{Native Push}$$

Transport V2 delivers a Google Maps-grade experience accessible across web and native mobile (Android/iOS) for **Students**, **Cross-Department Faculty & Staff**, **Parents**, and **Transport Fleet Controllers**.

---

## 2. Core Architecture Pipeline

```mermaid
flowchart TD
    subgraph Caller_Resolution ["1. Unified Identity & Eligibility Resolver"]
        UserToken[Bearer JWT Token] --> AuthMiddleware[Auth Guard]
        AuthMiddleware --> Resolver[TransportService.getMyAllocation]
        Resolver --> StudentCheck{Is Student?}
        Resolver --> FacultyCheck{Is Faculty / Staff?}
        Resolver --> ParentCheck{Is Parent?}
    end

    subgraph Eligibility_Rules ["2. Role Policy Evaluation"]
        StudentCheck -->|Residential = HOSTELLER| HostelRedirect[Status: HOSTELLER -> Deep Link Hostel Portal]
        StudentCheck -->|Mode != COLLEGE_BUS| CommuteProfile[Status: SELF_COMMUTE -> Commute Profile]
        StudentCheck -->|Active Allocation| AllocValid[Fetch Route, Stop & Trip]
        FacultyCheck -->|Active Allocation| AllocValid
        ParentCheck -->|Ward Allocation| AllocValid
    end

    subgraph Telemetry_Engine ["3. Telemetry & Geofence Engine"]
        GPSHardware[Onboard GPS Hardware / App Telemetry] -->|POST /api/transport/tracking/location| Ingestion[Location Ingestion Gateway]
        Ingestion --> BoundsCheck{Lat/Lon Bounds Valid?}
        BoundsCheck -->|Valid| DBStore[(vehicle_locations)]
        DBStore --> SocketBroadcast[Socket.IO RBAC Broadcast]
        DBStore --> GeofenceDetector[Approaching Stop Detector]
        GeofenceDetector --> DedupeCheck{Deduplication Window > 30 min?}
        DedupeCheck -->|Yes| PushBroadcast[Targeted Push Notification]
    end

    subgraph Frontend_Presentation ["4. Frontend & Mobile Map Experience"]
        AllocValid --> LivePayload[Live Allocation & Telemetry Payload]
        SocketBroadcast --> LiveBusMap[LiveBusMap Vector/SVG Map UI]
        LivePayload --> LiveBusMap
        LiveBusMap --> PulseBus[Animated Bus Marker & Heading Angle]
        LiveBusMap --> StopTimeline[Ordered Stops Timeline & Distance/ETA]
    end
```

---

## 3. Data Model & Entity Relationships

The relational architecture ensures zero duplication between academic department hierarchies and physical transportation routes.

```mermaid
erDiagram
    TransportRoute ||--o{ TransportStop : "has ordered"
    TransportRoute ||--o{ TransportRouteVehicle : "assigns"
    TransportRoute ||--o{ TransportAllocation : "allocates"
    Vehicle ||--o{ TransportRouteVehicle : "mapped to"
    Vehicle ||--o{ VehicleLocation : "telemetry stream"
    User ||--o| Student : "profile"
    User ||--o| Faculty : "profile"
    Student ||--o{ TransportAllocation : "passenger"
    Faculty ||--o{ TransportAllocation : "passenger"

    TransportRoute {
        string id PK
        string routeName
        string vehicleNo
        string driverName
        string driverPhone
        float monthlyFee
        boolean deleted
    }

    TransportStop {
        string id PK
        string routeId FK
        string name
        int sequence
        float latitude
        float longitude
        string pickupTime
        string dropTime
    }

    Vehicle {
        string id PK
        string vehicleNumber
        string type
        int capacity
        string status
    }

    VehicleLocation {
        string id PK
        string vehicleId FK
        float latitude
        float longitude
        float speed
        float heading
        datetime recordedAt
        string source
    }

    TransportAllocation {
        string id PK
        string passengerId
        string passengerType "STUDENT | FACULTY | STAFF"
        string routeId FK
        string stopId FK
        string academicYear
        string status "ACTIVE | CANCELLED"
    }
```

---

## 4. Mathematical Geofencing & ETA Formulation

### 4.1 Great-Circle Distance (Haversine Formula)

Distance between vehicle coordinate $(\phi_1, \lambda_1)$ and assigned stop coordinate $(\phi_2, \lambda_2)$:

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c \quad (R = 6371\text{ km})$$

### 4.2 Dynamic Speed-Adjusted ETA Estimation

$$\text{Effective Speed } v_{\text{eff}} = \max(10, \min(v_{\text{current}}, 60)) \quad [\text{km/h}]$$
$$\text{ETA (Minutes)} = \max\left(1, \text{round}\left(\frac{d}{v_{\text{eff}}} \cdot 60\right)\right)$$

### 4.3 Approaching Geofence Alert Rule

An approaching stop alert is triggered when:
$$d \le 2.5\text{ km} \quad \text{AND} \quad \text{ETA} \le 10\text{ minutes}$$

Deduplication suppression key:
$$\text{key} = \text{tripId} : \text{passengerId} : \text{stopId} : \text{"APPROACHING"}$$
$$\text{Suppression Window } T_{\text{window}} = 30 \text{ minutes}$$

---

## 5. Security & Isolation Guarantee

1. **Academic Department Independence**: Faculty members (e.g. Dr. Arun in Computer Science, Prof. Venkatesh in Mechanical) can ride the same transit corridor (Route 06) without modifying academic structures.
2. **Hosteller Data Privacy**: Hostellers cannot query transit telemetry and are automatically redirected to their dedicated Hostel Resident Workspace.
3. **Hardware GPS Validation**: Out-of-bounds telemetry (Latitude $\notin [-90, 90]$ or Longitude $\notin [-180, 180]$) is rejected with HTTP 400 Bad Request.
