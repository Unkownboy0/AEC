import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';

export class TransportService {
  async getDashboard() {
    const [totalRoutes, totalVehicles, activeAllocations, breakdowns] = await Promise.all([
      prisma.transportRoute.count({ where: { deleted: false } }),
      prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
      prisma.transportAllocation.count({ where: { status: 'ACTIVE' } }),
      prisma.transportBreakdown.count({ where: { status: { in: ['REPORTED', 'RESCUE_SENT'] } } }),
    ]);
    return { totalRoutes, totalVehicles, activeAllocations, activeBreakdowns: breakdowns };
  }

  async listRoutes() {
    return prisma.transportRoute.findMany({ where: { deleted: false }, include: { transportStops: { orderBy: { sequence: 'asc' } }, routeVehicles: { include: { vehicle: true, driver: true } } }, orderBy: { routeName: 'asc' } });
  }

  async getRoute(id: string) {
    const route = await prisma.transportRoute.findUnique({ where: { id }, include: { transportStops: { orderBy: { sequence: 'asc' }, include: { allocations: { where: { status: 'ACTIVE' } } } }, routeVehicles: { include: { vehicle: true, driver: true } } } });
    if (!route || route.deleted) throw new NotFoundException('Route not found');
    return route;
  }

  // Vehicles
  async listVehicles(status?: string) {
    return prisma.vehicle.findMany({ where: status ? { status } : {}, orderBy: { vehicleNumber: 'asc' } });
  }

  async createVehicle(data: { vehicleNumber: string; type: string; capacity: number; make?: string; model?: string; year?: number; fuelType?: string }) {
    return prisma.vehicle.create({ data: { ...data, status: 'ACTIVE' } });
  }

  // Drivers
  async listDrivers() {
    return prisma.transportDriver.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } });
  }

  async createDriver(data: { name: string; phone: string; licenseNo: string; licenseExpiry: string; experience?: number; address?: string }) {
    return prisma.transportDriver.create({ data: { ...data, licenseExpiry: new Date(data.licenseExpiry), experience: data.experience || 0 } });
  }

  // Stops
  async addStop(data: { routeId: string; name: string; sequence: number; pickupTime?: string; dropTime?: string; fee?: number; landmark?: string; latitude?: number; longitude?: number }) {
    return prisma.transportStop.create({ data: { ...data, fee: data.fee || 0 } });
  }

  // Allocation
  async allocatePassenger(data: { routeId: string; stopId: string; passengerId: string; passengerType: string; academicYear: string; startDate: string; monthlyFee?: number }) {
    const existing = await prisma.transportAllocation.findFirst({ where: { passengerId: data.passengerId, passengerType: data.passengerType, status: 'ACTIVE' } });
    if (existing) throw new BadRequestException('Passenger already has an active transport allocation');

    return prisma.transportAllocation.create({ data: { ...data, startDate: new Date(data.startDate), monthlyFee: data.monthlyFee || 0, status: 'ACTIVE' } });
  }

  async cancelAllocation(allocationId: string) {
    return prisma.transportAllocation.update({ where: { id: allocationId }, data: { status: 'CANCELLED', endDate: new Date() } });
  }

  // Attendance
  async recordAttendance(data: { routeId: string; passengerId: string; passengerType: string; date: string; direction: string; vehicleId?: string }) {
    return prisma.transportAttendance.upsert({
      where: { routeId_passengerId_date_direction: { routeId: data.routeId, passengerId: data.passengerId, date: new Date(data.date), direction: data.direction } },
      update: { status: 'BOARDED', boardingTime: new Date() },
      create: { routeId: data.routeId, passengerId: data.passengerId, passengerType: data.passengerType, date: new Date(data.date), direction: data.direction, vehicleId: data.vehicleId, status: 'BOARDED', boardingTime: new Date() },
    });
  }

  // Fuel
  async recordFuel(data: { vehicleId: string; date: string; quantity: number; costPerUnit: number; odometer?: number; filledById: string; receiptUrl?: string }) {
    return prisma.transportFuel.create({ data: { ...data, date: new Date(data.date), totalCost: data.quantity * data.costPerUnit } });
  }

  // Maintenance
  async createMaintenance(data: { vehicleId: string; type: string; description: string; startDate: string; cost?: number; vendorId?: string }) {
    return prisma.transportMaintenance.create({ data: { ...data, startDate: new Date(data.startDate), cost: data.cost || 0, status: 'SCHEDULED' } });
  }

  // Breakdown
  async reportBreakdown(data: { vehicleId: string; routeId?: string; location?: string; description: string; severity: string; reportedById: string }) {
    return prisma.transportBreakdown.create({ data });
  }
}
