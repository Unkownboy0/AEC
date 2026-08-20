# CampusOS Transport V2 — Map & ETA Verification Report

## 1. Google Maps-Like Experience

The interactive map experience in CampusOS Transport V2 is delivered through `LiveBusMap.tsx` and `MyBusDashboardCard.tsx`.

### Core UI Capabilities:
1. **Pulsing Radar Wave Marker**: Renders live GPS position with an emerald glow and directional heading arrow corresponding to `heading` degrees.
2. **Sequential Polyline**: Smoothly renders route segments between stops with gradient accents.
3. **Assigned Stop Pin**: Emphasizes the logged-in passenger's pickup stop with an animated blue indicator and distance badge.
4. **Campus Destination Badge**: Prominently highlights the campus terminal.
5. **Dynamic ETA Banner**: Displays current estimated time of arrival, road speed in km/h, and live distance.
6. **Recenter Control**: 1-click floating button allowing users to lock the viewport back to the bus or their stop.

---

## 2. Haversine Distance & ETA Formula Verification

The mathematical accuracy of distance and travel time calculation was tested against real Coimbatore route coordinates:

- **Origin Stop**: Vadavalli Bus Stand $(11.0254^{\circ}\text{N}, 76.9012^{\circ}\text{E})$
- **Destination**: Main Campus East Terminal $(11.0012^{\circ}\text{N}, 76.9845^{\circ}\text{E})$
- **Actual Great-Circle Distance**: $9.48\text{ km}$
- **Calculated Distance by Engine**: $9.48\text{ km}$
- **Effective Bus Speed**: $30\text{ km/h}$
- **Estimated Travel Time**: $19\text{ minutes}$

```
[PASS] Scenario 7: Haversine Distance & ETA Calculation Accuracy — Computed Distance: 9.48 km, Estimated ETA: 19 min
```

---

## 3. Map Viewport Performance

- **Bundle Size impact**: Zero heavy third-party mapping libraries loaded synchronously on startup.
- **Rendering**: Hardware-accelerated SVG with interactive transform/pan controls.
- **CSS Micro-animations**:
  - `@keyframes ping`: 1.8s ease-in-out pulse on bus beacon.
  - `@keyframes pulse`: Smooth glow on assigned passenger stop.
  - `transition: transform 0.4s ease-out`: Smooth bus heading rotation.
