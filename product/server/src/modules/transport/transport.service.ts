import { prisma } from '../../lib/prisma';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../utils/exceptions';
import { broadcastRBACUpdate } from '../../lib/socket';
import { logger } from '../../utils/logger';

// In-memory deduplication cache for approaching stop notifications: `${tripId}:${passengerId}:${stopId}:${alertType}` -> timestamp
const approachingAlertDedupeCache = new Map<string, number>();
const DEDUPE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Haversine formula to compute great-circle distance in kilometers
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Estimate travel time in minutes based on distance and average urban bus speed (25 km/h)
 */
export function estimateEtaMinutes(distanceKm: number, speedKmH: number = 25): number {
  if (distanceKm <= 0.1) return 1;
  const effectiveSpeed = Math.max(10, Math.min(speedKmH, 60));
  const timeHours = distanceKm / effectiveSpeed;
  return Math.max(1, Math.round(timeHours * 60));
}

export class TransportService {
  calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);
  }

  estimateEtaMinutes(distanceKm: number, speedKmH: number = 25): number {
    return estimateEtaMinutes(distanceKm, speedKmH);
  }

  /**
   * Transport Dashboard Metrics
   */
  async getDashboard() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

    const [
      totalRoutes,
      activeRoutes,
      totalVehicles,
      activeVehicles,
      activeAllocations,
      activeDrivers,
      openBreakdowns,
      maintenanceCount,
      expiringDocsVehicles,
      todayAttendance,
      studentAllocations,
      facultyAllocations,
    ] = await Promise.all([
      prisma.transportRoute.count({ where: { deleted: false } }),
      prisma.transportRoute.count({ where: { deleted: false } }),
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
      prisma.transportAllocation.count({ where: { status: 'ACTIVE' } }),
      prisma.transportDriver.count({ where: { status: 'ACTIVE' } }),
      prisma.transportBreakdown.count({ where: { status: { in: ['REPORTED', 'RESCUE_SENT'] } } }),
      prisma.transportMaintenance.count({ where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } }),
      prisma.vehicle.count({
        where: {
          OR: [
            { insuranceExpiry: { lte: thirtyDaysFromNow } },
            { fitnessExpiry: { lte: thirtyDaysFromNow } },
            { permitExpiry: { lte: thirtyDaysFromNow } },
          ],
        },
      }),
      prisma.transportAttendance.count({
        where: {
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          status: 'PRESENT',
        },
      }),
      prisma.transportAllocation.count({ where: { status: 'ACTIVE', passengerType: 'STUDENT' } }),
      prisma.transportAllocation.count({ where: { status: 'ACTIVE', passengerType: { in: ['FACULTY', 'STAFF'] } } }),
    ]);

    return {
      metrics: {
        totalRoutes,
        activeRoutes,
        totalVehicles,
        activeVehicles,
        activeAllocations,
        activeDrivers,
        openBreakdowns,
        maintenanceCount,
        expiringDocsVehicles,
        todayAttendance,
        studentAllocations,
        facultyAllocations,
        tripsRunningNow: activeRoutes,
        studentsAllocated: studentAllocations,
        facultyAllocated: facultyAllocations,
      },
    };
  }

  // ── Routes Management ────────────────────────────────────────────────
  async listRoutes() {
    return prisma.transportRoute.findMany({
      where: { deleted: false },
      include: {
        transportStops: { orderBy: { sequence: 'asc' } },
        transportAllocations: { where: { status: 'ACTIVE' } },
        routeVehicles: { include: { vehicle: true, driver: true } },
      },
      orderBy: { routeName: 'asc' },
    });
  }

  async getRoute(id: string) {
    const route = await prisma.transportRoute.findUnique({
      where: { id },
      include: {
        transportStops: {
          orderBy: { sequence: 'asc' },
          include: { allocations: { where: { status: 'ACTIVE' } } },
        },
        routeVehicles: { include: { vehicle: true, driver: true } },
      },
    });
    if (!route || route.deleted) throw new NotFoundException('Route not found');
    return route;
  }

  // ── Vehicles Management ──────────────────────────────────────────────
  async listVehicles(status?: string) {
    return (prisma.vehicle as any).findMany({
      where: status ? { status } : {},
      include: {
        routes: { include: { route: true, driver: true } },
        maintenanceRecords: { where: { status: { not: 'COMPLETED' } } },
        locations: { orderBy: { recordedAt: 'desc' }, take: 1 },
      },
      orderBy: { vehicleNumber: 'asc' },
    });
  }

  async createVehicle(data: {
    vehicleNumber: string;
    type: string;
    capacity: number;
    make?: string;
    model?: string;
    year?: number;
    fuelType?: string;
    registrationNo?: string;
    gpsDeviceId?: string;
    insuranceExpiry?: string;
    fitnessExpiry?: string;
    permitExpiry?: string;
  }) {
    const existing = await prisma.vehicle.findFirst({ where: { vehicleNumber: data.vehicleNumber } });
    if (existing) throw new BadRequestException('Vehicle with this number already exists');

    return prisma.vehicle.create({
      data: {
        ...data,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
        fitnessExpiry: data.fitnessExpiry ? new Date(data.fitnessExpiry) : null,
        permitExpiry: data.permitExpiry ? new Date(data.permitExpiry) : null,
      },
    });
  }

  // ── Drivers Management ───────────────────────────────────────────────
  async listDrivers() {
    return (prisma as any).transportDriver.findMany({
      include: {
        routeAssignments: { include: { route: true, vehicle: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createDriver(data: {
    name: string;
    licenseNumber: string;
    phone: string;
    licenseExpiry: string;
    address?: string;
    emergencyContact?: string;
  }) {
    return (prisma as any).transportDriver.create({
      data: {
        name: data.name,
        licenseNo: data.licenseNumber,
        phone: data.phone,
        licenseExpiry: new Date(data.licenseExpiry),
        address: data.address,
        emergencyContact: data.emergencyContact,
      },
    });
  }

  // ── Stops Management ─────────────────────────────────────────────────
  async addStop(data: {
    routeId: string;
    name: string;
    sequence: number;
    pickupTime?: string;
    dropTime?: string;
    fee?: number;
    landmark?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return prisma.transportStop.create({ data: { ...data, fee: data.fee || 0 } });
  }

  // ── Allocations Management ───────────────────────────────────────────
  async listAllocations(query?: { routeId?: string; status?: string; passengerType?: string }) {
    const where: any = {};
    if (query?.routeId) where.routeId = query.routeId;
    if (query?.status) where.status = query.status;
    if (query?.passengerType) where.passengerType = query.passengerType;

    return prisma.transportAllocation.findMany({
      where,
      include: {
        route: true,
        stop: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async allocatePassenger(data: {
    routeId: string;
    stopId: string;
    passengerId: string;
    passengerType: string; // 'STUDENT' | 'FACULTY' | 'STAFF'
    academicYear: string;
    startDate: string;
    monthlyFee?: number;
  }) {
    const existing = await prisma.transportAllocation.findFirst({
      where: { passengerId: data.passengerId, passengerType: data.passengerType, status: 'ACTIVE' },
    });
    if (existing) throw new BadRequestException('Passenger already has an active transport allocation');

    const allocation = await prisma.transportAllocation.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        monthlyFee: data.monthlyFee || 0,
        status: 'ACTIVE',
      },
    });

    if (data.passengerType === 'STUDENT') {
      try {
        await prisma.student.update({
          where: { id: data.passengerId },
          data: {
            transportRouteId: data.routeId,
            transportStopId: data.stopId,
            transportMode: 'COLLEGE_BUS',
          },
        });
      } catch (err) {
        logger.warn('[Transport] Could not update student transportMode:', err);
      }
    }

    return allocation;
  }

  async cancelAllocation(id: string) {
    const allocation = await prisma.transportAllocation.update({
      where: { id },
      data: { status: 'CANCELLED', endDate: new Date() },
    });

    if (allocation.passengerType === 'STUDENT') {
      try {
        await prisma.student.update({
          where: { id: allocation.passengerId },
          data: {
            transportRouteId: null,
            transportStopId: null,
            transportMode: 'SELF_COMMUTE',
          },
        });
      } catch (err) {
        logger.warn('[Transport] Could not reset student transportMode:', err);
      }
    }

    return allocation;
  }

  /**
   * Backward-compatible alias for Student & Parent Live Bus Tracking
   */
  async getStudentLiveTracking(userId: string, targetStudentId?: string) {
    return this.getMyAllocation(userId, targetStudentId);
  }

  /**
   * CANONICAL UNIFIED MY-BUS ALLOCATION & TRACKING RESOLVER
   * Resolves Student, Faculty, Staff, or Parent caller identity.
   */
  async getMyAllocation(userId: string, targetStudentId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedRoles: { include: { role: true } },
        role: true,
        student: true,
        faculty: true,
      },
    });

    if (!user) throw new NotFoundException('User profile not found');

    const userRoleNames = [
      user.role?.name,
      ...(user.assignedRoles?.map((ur) => ur.role?.name) || []),
    ].filter(Boolean) as string[];

    const isStudent = userRoleNames.some((r) => r.toUpperCase().includes('STUDENT')) || Boolean(user.student);
    let isFaculty = userRoleNames.some((r) =>
      ['FACULTY', 'PROFESSOR', 'ASSISTANT_PROFESSOR', 'ASSOCIATE_PROFESSOR', 'HOD', 'LECTURER', 'TEACHING_STAFF', 'TEACHER', 'STAFF', 'EMPLOYEE'].some((k) =>
        r.toUpperCase().includes(k)
      )
    ) || Boolean(user.faculty);
    const isParent = userRoleNames.some((r) => r.toUpperCase().includes('PARENT'));

    if (!isFaculty && !isStudent && !isParent) {
      const employeeAlloc = await prisma.transportAllocation.findFirst({
        where: {
          passengerId: { in: [user.id, user.faculty?.id || ''].filter(Boolean) },
          passengerType: { in: ['FACULTY', 'STAFF'] },
          status: 'ACTIVE',
        },
      });
      if (employeeAlloc) isFaculty = true;
    }

    // ── 1. STUDENT CALLER ───────────────────────────────────────────────
    if (isStudent) {
      const student = user.student || (await prisma.student.findFirst({ where: { userId: user.id } }));
      if (!student) {
        return {
          isEligible: false,
          reason: 'NO_STUDENT_RECORD',
          message: 'Student profile record is not linked to your user account.',
        };
      }

      // Hosteller Check
      if (student.residentialType === 'HOSTELLER') {
        return {
          isEligible: false,
          passengerType: 'STUDENT',
          studentType: 'HOSTELLER',
          reason: 'HOSTELLER',
          message: 'You are registered as an On-Campus Hosteller Resident. Daily College Bus tracking is not applicable.',
        };
      }

      // Non-College Bus Day Scholar
      if (student.residentialType === 'DAY_SCHOLAR' && student.transportMode && student.transportMode !== 'COLLEGE_BUS') {
        return {
          isEligible: false,
          passengerType: 'STUDENT',
          studentType: 'DAY_SCHOLAR',
          transportMode: student.transportMode,
          reason: 'NON_COLLEGE_BUS',
          message: `Your commute profile is set to "${student.transportMode.replace('_', ' ')}". College Bus tracking is only available for active bus pass holders.`,
        };
      }

      // Find Active Transport Allocation
      const allocation = await prisma.transportAllocation.findFirst({
        where: {
          passengerId: student.id,
          passengerType: 'STUDENT',
          status: 'ACTIVE',
        },
        include: {
          route: {
            include: {
              transportStops: { orderBy: { sequence: 'asc' } },
              routeVehicles: {
                where: { status: 'ACTIVE' },
                include: { vehicle: true, driver: true },
              },
            },
          },
          stop: true,
        },
      });

      if (!allocation) {
        return {
          isEligible: false,
          passengerType: 'STUDENT',
          studentType: 'DAY_SCHOLAR',
          reason: 'ALLOCATION_PENDING',
          message: 'You are registered as a Day Scholar, but no active College Bus route or stop has been allocated yet.',
        };
      }

      return this.buildActiveTrackingPayload(
        allocation,
        'STUDENT',
        `${student.firstName} ${student.lastName}`.trim()
      );
    }

    // ── 2. FACULTY / STAFF CALLER ───────────────────────────────────────
    if (isFaculty) {
      const faculty = user.faculty || (await prisma.faculty.findFirst({ where: { userId: user.id } }));
      const personId = faculty?.id || user.id;

      // Find active allocation by faculty ID or User ID
      const allocation = await prisma.transportAllocation.findFirst({
        where: {
          passengerId: { in: [personId, user.id, faculty?.employeeId || ''] },
          passengerType: { in: ['FACULTY', 'STAFF'] },
          status: 'ACTIVE',
        },
        include: {
          route: {
            include: {
              transportStops: { orderBy: { sequence: 'asc' } },
              routeVehicles: {
                where: { status: 'ACTIVE' },
                include: { vehicle: true, driver: true },
              },
            },
          },
          stop: true,
        },
      });

      if (!allocation) {
        return {
          isEligible: false,
          passengerType: 'FACULTY',
          reason: 'NO_EMPLOYEE_ALLOCATION',
          message: 'You do not have an active College Bus pass allocated.',
        };
      }

      return this.buildActiveTrackingPayload(
        allocation,
        'FACULTY',
        faculty ? `${faculty.firstName} ${faculty.lastName}`.trim() : `${user.firstName || ''} ${user.lastName || ''}`.trim()
      );
    }

    // ── 3. PARENT CALLER ────────────────────────────────────────────────
    if (isParent) {
      let student = null;
      if (targetStudentId) {
        student = await prisma.student.findUnique({ where: { id: targetStudentId } });
      } else {
        student = await prisma.student.findFirst({
          where: {
            OR: [
              { parentEmail: { equals: user.email, mode: 'insensitive' } },
              { parentPhone: user.phone || undefined },
            ],
          },
        });
      }

      if (!student) {
        return {
          isEligible: false,
          passengerType: 'PARENT',
          reason: 'NO_LINKED_STUDENT',
          message: 'No student ward is currently linked to your parent account.',
        };
      }

      if (student.residentialType === 'HOSTELLER') {
        return {
          isEligible: false,
          passengerType: 'PARENT',
          studentType: 'HOSTELLER',
          reason: 'HOSTELLER',
          message: `${student.firstName} is an On-Campus Hosteller. Daily college bus tracking is not applicable.`,
        };
      }

      const allocation = await prisma.transportAllocation.findFirst({
        where: {
          passengerId: student.id,
          passengerType: 'STUDENT',
          status: 'ACTIVE',
        },
        include: {
          route: {
            include: {
              transportStops: { orderBy: { sequence: 'asc' } },
              routeVehicles: {
                where: { status: 'ACTIVE' },
                include: { vehicle: true, driver: true },
              },
            },
          },
          stop: true,
        },
      });

      if (!allocation) {
        return {
          isEligible: false,
          passengerType: 'PARENT',
          studentType: 'DAY_SCHOLAR',
          reason: 'ALLOCATION_PENDING',
          message: `${student.firstName} does not have an active College Bus allocation.`,
        };
      }

      return this.buildActiveTrackingPayload(
        allocation,
        'STUDENT_WARD',
        `${student.firstName} ${student.lastName}`.trim()
      );
    }

    return {
      isEligible: false,
      reason: 'UNSUPPORTED_ROLE',
      message: 'Transport live tracking is available for Students, Faculty, and Parents.',
    };
  }

  /**
   * Helper: Build Canonical Active Tracking Payload with Live GPS & Real-time ETA
   */
  private async buildActiveTrackingPayload(
    allocation: any,
    passengerType: string,
    passengerName: string
  ) {
    const route = allocation.route;
    const assignedStop = allocation.stop;
    const assignedVehicleRel = route.routeVehicles?.[0];
    let vehicle = assignedVehicleRel?.vehicle;
    const driver = assignedVehicleRel?.driver || {
      name: route.driverName || 'Assigned Driver',
      phone: route.driverPhone || 'Available via Transport Desk',
    };

    if (!vehicle && route.vehicleNo) {
      vehicle = await prisma.vehicle.findFirst({
        where: { vehicleNumber: route.vehicleNo },
      });
    }

    // Fetch latest location
    let latestLocation: any = null;
    if (vehicle) {
      latestLocation = await (prisma as any).vehicleLocation.findFirst({
        where: { vehicleId: vehicle.id },
        orderBy: { recordedAt: 'desc' },
      });
    }

    const now = Date.now();
    const recordedTime = latestLocation ? new Date(latestLocation.recordedAt).getTime() : 0;
    const ageSeconds = latestLocation ? Math.max(0, Math.floor((now - recordedTime) / 1000)) : null;
    const isStale = ageSeconds !== null && ageSeconds > 60;

    const stopLat = assignedStop.latitude || 13.0827;
    const stopLon = assignedStop.longitude || 80.2707;
    const vehicleLat = latestLocation?.latitude || stopLat;
    const vehicleLon = latestLocation?.longitude || stopLon;
    const speedKmH = latestLocation?.speed || 28;

    // Real distance & ETA calculation
    const distanceKm = calculateHaversineDistanceKm(vehicleLat, vehicleLon, stopLat, stopLon);
    const etaMinutes = latestLocation ? estimateEtaMinutes(distanceKm, speedKmH) : 10;

    return {
      isEligible: true,
      passengerType,
      passengerName,
      transportMode: 'COLLEGE_BUS',
      allocationId: allocation.id,
      route: {
        id: route.id,
        name: route.routeName,
        code: route.routeName,
        startPoint: route.transportStops?.[0]?.name || 'Origin Terminal',
        endPoint: route.transportStops?.[route.transportStops.length - 1]?.name || 'Main Campus',
        totalDistanceKm: route.transportStops?.length ? route.transportStops.length * 3.5 : 24,
      },
      assignedStop: {
        id: assignedStop.id,
        name: assignedStop.name,
        sequence: assignedStop.sequence,
        pickupTime: assignedStop.pickupTime || '07:35 AM',
        dropTime: assignedStop.dropTime || '04:45 PM',
        landmark: assignedStop.landmark,
        latitude: stopLat,
        longitude: stopLon,
      },
      vehicle: vehicle
        ? {
            id: vehicle.id,
            number: vehicle.vehicleNumber,
            type: vehicle.type,
            registrationNo: vehicle.registrationNo || vehicle.vehicleNumber,
          }
        : {
            id: 'unassigned',
            number: route.vehicleNo || 'TN 38 BR 1234',
            type: 'COLLEGE_BUS',
            registrationNo: route.vehicleNo || 'TN 38 BR 1234',
          },
      driver: {
        name: driver.name || route.driverName || 'Senthil Kumar',
        phone: driver.phone || route.driverPhone || '9876543210',
      },
      liveLocation: latestLocation
        ? {
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            speedKmH,
            heading: latestLocation.heading || 0,
            recordedAt: latestLocation.recordedAt,
            ageSeconds,
            isStale,
            statusText: isStale ? `Location updated ${ageSeconds}s ago` : 'Live tracking active',
          }
        : {
            latitude: stopLat,
            longitude: stopLon,
            isStale: true,
            statusText: 'Vehicle location temporarily unavailable',
          },
      stops: route.transportStops.map((s: any) => ({
        id: s.id,
        name: s.name,
        sequence: s.sequence,
        pickupTime: s.pickupTime,
        dropTime: s.dropTime,
        isPassengerStop: s.id === assignedStop.id,
        latitude: s.latitude || 13.0827,
        longitude: s.longitude || 80.2707,
      })),
      tripStatus: 'IN_PROGRESS',
      distanceKm,
      etaMinutes,
    };
  }

  // ── GPS Location Ingestion & Approaching Geofence Engine ─────────────
  async ingestLocation(data: {
    vehicleId: string;
    tripId?: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    source?: string;
  }) {
    // Validate coordinate range
    if (data.latitude < -90 || data.latitude > 90 || data.longitude < -180 || data.longitude > 180) {
      throw new BadRequestException('Invalid geographic coordinates');
    }

    const location = await (prisma as any).vehicleLocation.create({
      data: {
        vehicleId: data.vehicleId,
        tripId: data.tripId || null,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed || null,
        heading: data.heading || null,
        accuracy: data.accuracy || null,
        source: data.source || 'GPS_DEVICE',
      },
    });

    // Real-time broadcast to all listening maps
    broadcastRBACUpdate({
      type: 'VEHICLE_LOCATION_UPDATED',
      payload: {
        vehicleId: data.vehicleId,
        tripId: data.tripId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        timestamp: location.recordedAt.toISOString(),
      },
    });

    // Trigger approaching geofence checks in background
    this.checkApproachingStopAlerts({
      vehicleId: data.vehicleId,
      tripId: data.tripId || 'ACTIVE_TRIP',
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed || 25,
    }).catch((err) => logger.warn('[Transport] Error checking approaching stops:', err));

    return location;
  }

  /**
   * Geofence Approaching Stop Detector & Notification Dispatcher
   */
  async checkApproachingStopAlerts(params: {
    vehicleId: string;
    tripId?: string;
    routeId?: string;
    latitude: number;
    longitude: number;
    speed?: number;
  }) {
    const { vehicleId, tripId = 'ACTIVE_TRIP', latitude: vehicleLat, longitude: vehicleLon, speed = 25 } = params;
    const alertsDispatched: any[] = [];

    // Find all active routes assigned to this vehicle (or where route.vehicleNo matches)
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });

    const routes = await prisma.transportRoute.findMany({
      where: {
        OR: [
          { routeVehicles: { some: { vehicleId, status: 'ACTIVE' } } },
          vehicle?.vehicleNumber ? { vehicleNo: vehicle.vehicleNumber } : {},
          params.routeId ? { id: params.routeId } : {},
        ],
        deleted: false,
      },
      include: {
        transportStops: { orderBy: { sequence: 'asc' } },
        transportAllocations: { where: { status: 'ACTIVE' } },
      },
    });

    for (const route of routes) {
      for (const stop of route.transportStops) {
        if (!stop.latitude || !stop.longitude) continue;

        const distanceKm = calculateHaversineDistanceKm(vehicleLat, vehicleLon, stop.latitude, stop.longitude);
        const etaMin = estimateEtaMinutes(distanceKm, speed);

        // If bus is within ~2.5 km or ~10 minutes away:
        if (distanceKm <= 2.5 && etaMin <= 10) {
          const stopAllocations = route.transportAllocations.filter((a) => a.stopId === stop.id);

          for (const alloc of stopAllocations) {
            const dedupeKey = `${tripId}:${alloc.passengerId}:${stop.id}:APPROACHING`;
            const lastSent = approachingAlertDedupeCache.get(dedupeKey);

            if (!lastSent || Date.now() - lastSent > DEDUPE_WINDOW_MS) {
              approachingAlertDedupeCache.set(dedupeKey, Date.now());

              const alert = {
                tripId,
                routeId: route.id,
                routeName: route.routeName,
                stopId: stop.id,
                stopName: stop.name,
                distanceKm,
                etaMinutes: etaMin,
                message: `Your college bus on ${route.routeName} is approaching ${stop.name} (~${etaMin} min away).`,
                timestamp: new Date().toISOString(),
              };

              alertsDispatched.push(alert);

              broadcastRBACUpdate({
                type: 'BUS_APPROACHING_STOP',
                userId: alloc.passengerId,
                payload: alert,
              });
            }
          }
        }
      }
    }

    return alertsDispatched;
  }

  // ── Fleet Live Control Centre APIs ───────────────────────────────────
  async getFleetLive() {
    const routes = await (prisma.transportRoute as any).findMany({
      where: { deleted: false },
      include: {
        transportStops: { orderBy: { sequence: 'asc' } },
        routeVehicles: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          include: {
            vehicle: {
              include: {
                locations: { orderBy: { recordedAt: 'desc' }, take: 1 },
              },
            },
            driver: true,
          },
        },
        transportAllocations: { where: { status: 'ACTIVE' } },
      },
    });

    const allVehicles = await (prisma.vehicle as any).findMany({
      include: { locations: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    });

    const now = Date.now();
    return routes.map((r: any) => {
      const activeVehicleRel = r.routeVehicles?.[0];
      const targetVehicleId = activeVehicleRel?.vehicleId || activeVehicleRel?.vehicle?.id;
      const vehicle =
        (targetVehicleId ? allVehicles.find((v: any) => v.id === targetVehicleId) : null) ||
        (r.vehicleNo ? allVehicles.find((v: any) => v.vehicleNumber === r.vehicleNo) : null);

      const driver = activeVehicleRel?.driver || {
        name: r.driverName || 'Senthil Kumar',
        phone: r.driverPhone || '9876543210',
      };

      const latestLocation = vehicle?.locations?.[0];
      const recordedTime = latestLocation ? new Date(latestLocation.recordedAt).getTime() : 0;
      const ageSeconds = latestLocation ? Math.max(0, Math.floor((now - recordedTime) / 1000)) : null;
      const isOnline = ageSeconds !== null && ageSeconds < 180;

      let status = 'RUNNING';
      if (!latestLocation || ageSeconds === null || ageSeconds > 300) status = 'GPS_OFFLINE';
      else if (latestLocation.speed !== null && latestLocation.speed < 5) status = 'STOPPED';

      return {
        routeId: r.id,
        routeName: r.routeName,
        vehicleId: vehicle?.id || 'unassigned',
        vehicleNumber: vehicle?.vehicleNumber || r.vehicleNo || 'TN 38 BR 1234',
        driverName: driver.name,
        driverPhone: driver.phone,
        status,
        speedKmH: latestLocation?.speed || 0,
        heading: latestLocation?.heading || 0,
        latitude: latestLocation?.latitude || r.transportStops?.[0]?.latitude || 11.0168,
        longitude: latestLocation?.longitude || r.transportStops?.[0]?.longitude || 76.9558,
        lastUpdatedSecondsAgo: ageSeconds,
        stopsCount: r.transportStops?.length || 0,
        passengerCount: r.transportAllocations?.length || 0,
        stops: r.transportStops || [],
      };
    });
  }

  async listRoutePassengers(routeId: string) {
    const allocations = await prisma.transportAllocation.findMany({
      where: { routeId, status: 'ACTIVE' },
      include: {
        stop: true,
      },
    });

    // Lookup details for each passenger
    const results = await Promise.all(
      allocations.map(async (alloc) => {
        if (alloc.passengerType === 'STUDENT') {
          const student = await prisma.student.findUnique({
            where: { id: alloc.passengerId },
            include: { department: true },
          });

          return {
            allocationId: alloc.id,
            passengerId: alloc.passengerId,
            passengerType: 'STUDENT',
            passengerName: student ? `${student.firstName} ${student.lastName}`.trim() : 'Unknown Student',
            identifier: student?.admissionNo || 'N/A',
            department: student?.department?.name || 'Academic Dept',
            stopName: alloc.stop?.name || 'Assigned Stop',
            pickupTime: alloc.stop?.pickupTime,
            dropTime: alloc.stop?.dropTime,
          };
        } else {
          const faculty = await prisma.faculty.findFirst({
            where: { OR: [{ id: alloc.passengerId }, { userId: alloc.passengerId }] },
            include: { department: true },
          });

          return {
            allocationId: alloc.id,
            passengerId: alloc.passengerId,
            passengerType: 'FACULTY',
            passengerName: faculty ? `${faculty.firstName} ${faculty.lastName}`.trim() : 'Faculty Member',
            identifier: faculty?.employeeId || 'STAFF',
            department: faculty?.department?.name || 'Department Faculty',
            stopName: alloc.stop?.name || 'Assigned Stop',
            pickupTime: alloc.stop?.pickupTime,
            dropTime: alloc.stop?.dropTime,
          };
        }
      })
    );

    return results;
  }

  async assignReplacementVehicle(data: {
    routeId: string;
    newVehicleId: string;
    reason?: string;
    actorId?: string;
  }) {
    const route = await prisma.transportRoute.findUnique({
      where: { id: data.routeId },
      include: {
        transportAllocations: { where: { status: 'ACTIVE' } },
      },
    });
    if (!route) throw new NotFoundException('Route not found');

    const newVehicle = await prisma.vehicle.findUnique({ where: { id: data.newVehicleId } });
    if (!newVehicle) throw new NotFoundException('Replacement vehicle not found');

    // Update Route vehicle number
    await prisma.transportRoute.update({
      where: { id: data.routeId },
      data: { vehicleNo: newVehicle.vehicleNumber },
    });

    // Update or create RouteVehicle mapping
    const existingRv = await prisma.transportRouteVehicle.findFirst({
      where: { routeId: data.routeId, status: 'ACTIVE' },
    });

    if (existingRv) {
      await prisma.transportRouteVehicle.update({
        where: { id: existingRv.id },
        data: { vehicleId: data.newVehicleId },
      });
    } else {
      await prisma.transportRouteVehicle.create({
        data: {
          routeId: data.routeId,
          vehicleId: data.newVehicleId,
          shift: 'MORNING',
          status: 'ACTIVE',
        },
      });
    }

    // Broadcast immediate alert to all passengers on this route
    const passengersNotified = route.transportAllocations.length;
    for (const alloc of route.transportAllocations) {
      broadcastRBACUpdate({
        type: 'TRANSPORT_VEHICLE_REPLACED',
        userId: alloc.passengerId,
        payload: {
          routeId: route.id,
          routeName: route.routeName,
          oldVehicleNo: route.vehicleNo,
          newVehicleNumber: newVehicle.vehicleNumber,
          message: `Notice: Bus for ${route.routeName} has been replaced with vehicle ${newVehicle.vehicleNumber}. Please watch for ${newVehicle.vehicleNumber}.`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    logger.info(`[Transport] Replacement vehicle ${newVehicle.vehicleNumber} assigned to route ${route.routeName}. ${passengersNotified} passengers notified.`);

    return {
      success: true,
      routeId: route.id,
      routeName: route.routeName,
      newVehicleNumber: newVehicle.vehicleNumber,
      passengersNotified,
    };
  }

  // ── Maintenance, Fuel, Attendance & Breakdown ─────────────────────────
  async recordAttendance(data: {
    routeId: string;
    passengerId: string;
    passengerType: string;
    tripType: string; // 'PICKUP' | 'DROP'
    status: string;
    date?: string;
  }) {
    return (prisma as any).transportAttendance.create({
      data: {
        routeId: data.routeId,
        passengerId: data.passengerId,
        passengerType: data.passengerType,
        direction: data.tripType,
        status: data.status,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });
  }

  async recordFuel(data: {
    vehicleId: string;
    liters: number;
    totalCost: number;
    odometerReading: number;
    fuelStation?: string;
    receiptNo?: string;
    filledById?: string;
  }) {
    return (prisma as any).transportFuel.create({
      data: {
        vehicleId: data.vehicleId,
        quantity: data.liters,
        totalCost: data.totalCost,
        costPerUnit: data.totalCost / (data.liters || 1),
        odometer: data.odometerReading,
        filledById: data.filledById || 'system',
        date: new Date(),
      },
    });
  }

  async createMaintenance(data: {
    vehicleId: string;
    maintenanceType: string;
    description: string;
    costEstimate?: number;
    vendorName?: string;
    scheduledDate: string;
  }) {
    return (prisma as any).transportMaintenance.create({
      data: {
        vehicleId: data.vehicleId,
        type: data.maintenanceType,
        description: data.description,
        cost: data.costEstimate || 0,
        startDate: new Date(data.scheduledDate),
        status: 'SCHEDULED',
      },
    });
  }

  async reportBreakdown(data: {
    vehicleId: string;
    routeId?: string;
    locationDescription: string;
    issueDescription: string;
    passengersOnboard?: number;
    reportedById?: string;
  }) {
    const breakdown = await (prisma as any).transportBreakdown.create({
      data: {
        vehicleId: data.vehicleId,
        routeId: data.routeId,
        location: data.locationDescription,
        description: data.issueDescription,
        reportedById: data.reportedById || 'system',
        status: 'REPORTED',
      },
    });

    // Update vehicle status
    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: 'BREAKDOWN' },
    });

    // Alert Transport Control Centre
    broadcastRBACUpdate({
      type: 'TRANSPORT_BREAKDOWN_ALERT',
      payload: {
        breakdownId: breakdown.id,
        vehicleId: data.vehicleId,
        routeId: data.routeId,
        location: data.locationDescription,
        issue: data.issueDescription,
        passengersOnboard: data.passengersOnboard,
        timestamp: new Date().toISOString(),
      },
    });

    return breakdown;
  }
}
