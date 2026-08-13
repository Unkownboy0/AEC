import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';

export class HostelService {
  async getDashboard(hostelId?: string) {
    const where: any = hostelId ? { id: hostelId } : {};
    const [hostels, totalAllocations, pendingOutings, complaints] = await Promise.all([
      prisma.hostelBuilding.findMany({ where: { ...where, deleted: false }, include: { blocks: { include: { floors: { include: { rooms: true } } } } } }),
      prisma.hostelAllocation.count({ where: { status: 'ACTIVE' } }),
      prisma.hostelOuting.count({ where: { status: { in: ['REQUESTED', 'APPROVED'] } } }),
      prisma.hostelComplaint.count({ where: { status: { in: ['OPEN', 'ASSIGNED'] } } }),
    ]);
    return { hostels, totalAllocations, pendingOutings, openComplaints: complaints };
  }

  async listHostels() {
    return prisma.hostelBuilding.findMany({ where: { deleted: false }, include: { blocks: true, students: { select: { id: true } } }, orderBy: { name: 'asc' } });
  }

  async getHostel(id: string) {
    const hostel = await prisma.hostelBuilding.findUnique({ where: { id }, include: { blocks: { include: { floors: { include: { rooms: { include: { beds: true, allocations: { where: { status: 'ACTIVE' } } } } } } } } } });
    if (!hostel || hostel.deleted) throw new NotFoundException('Hostel not found');
    return hostel;
  }

  // Room Management
  async listRooms(filters: { hostelId?: string; blockId?: string; floorId?: string; status?: string; page?: number; limit?: number }) {
    const { hostelId, blockId, floorId, status, page = 1, limit = 50 } = filters;
    const where: any = {};
    if (floorId) where.floorId = floorId;
    if (status) where.status = status;
    if (blockId) where.floor = { blockId };
    if (hostelId) where.floor = { ...where.floor, block: { hostelId } };

    const [rooms, total] = await Promise.all([
      prisma.hostelRoom.findMany({ where, skip: (page - 1) * limit, take: limit, include: { floor: { include: { block: true } }, beds: true, allocations: { where: { status: 'ACTIVE' } } }, orderBy: { roomNumber: 'asc' } }),
      prisma.hostelRoom.count({ where }),
    ]);
    return { rooms, total, page, limit };
  }

  // Allocation
  async allocateRoom(data: { studentId: string; roomId: string; bedId?: string; academicYear: string; allocatedById: string; remarks?: string }) {
    const room = await prisma.hostelRoom.findUnique({ where: { id: data.roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.occupied >= room.capacity) throw new BadRequestException('Room is full');

    const existing = await prisma.hostelAllocation.findFirst({ where: { studentId: data.studentId, status: 'ACTIVE' } });
    if (existing) throw new BadRequestException('Student already has an active hostel allocation');

    const [allocation] = await prisma.$transaction([
      prisma.hostelAllocation.create({ data: { studentId: data.studentId, roomId: data.roomId, bedId: data.bedId, academicYear: data.academicYear, allocatedById: data.allocatedById, remarks: data.remarks } }),
      prisma.hostelRoom.update({ where: { id: data.roomId }, data: { occupied: { increment: 1 }, status: room.occupied + 1 >= room.capacity ? 'FULL' : 'AVAILABLE' } }),
      ...(data.bedId ? [prisma.hostelBed.update({ where: { id: data.bedId }, data: { status: 'OCCUPIED' } })] : []),
    ]);
    return allocation;
  }

  async vacateRoom(allocationId: string) {
    const allocation = await prisma.hostelAllocation.findUnique({ where: { id: allocationId } });
    if (!allocation || allocation.status !== 'ACTIVE') throw new BadRequestException('No active allocation found');

    await prisma.$transaction([
      prisma.hostelAllocation.update({ where: { id: allocationId }, data: { status: 'VACATED', vacationDate: new Date() } }),
      prisma.hostelRoom.update({ where: { id: allocation.roomId }, data: { occupied: { decrement: 1 }, status: 'AVAILABLE' } }),
      ...(allocation.bedId ? [prisma.hostelBed.update({ where: { id: allocation.bedId }, data: { status: 'AVAILABLE' } })] : []),
    ]);
    return { message: 'Room vacated successfully' };
  }

  // Outing Management
  async requestOuting(data: { studentId: string; hostelId: string; outDate: string; outTime: string; expectedReturn: string; purpose: string; destination: string; contactNumber: string }) {
    const outDate = new Date(data.outDate);
    if (outDate < new Date()) throw new BadRequestException('Cannot request outing for past dates');

    return prisma.hostelOuting.create({ data: { ...data, outDate, expectedReturn: new Date(data.expectedReturn) } });
  }

  async reviewOuting(outingId: string, action: 'APPROVED' | 'REJECTED', approvedById: string, remarks?: string) {
    const outing = await prisma.hostelOuting.findUnique({ where: { id: outingId } });
    if (!outing) throw new NotFoundException('Outing request not found');
    if (outing.status !== 'REQUESTED') throw new BadRequestException('Outing already processed');

    return prisma.hostelOuting.update({ where: { id: outingId }, data: { status: action === 'APPROVED' ? 'APPROVED' : 'REQUESTED', approvedById, approvedAt: new Date(), remarks } });
  }

  async recordOutingReturn(outingId: string) {
    return prisma.hostelOuting.update({ where: { id: outingId }, data: { status: 'RETURNED', actualReturn: new Date() } });
  }

  // Night Attendance
  async recordNightAttendance(data: { hostelId: string; studentId: string; date: string; status: string; recordedBy: string; remarks?: string }) {
    return prisma.hostelNightAttendance.upsert({
      where: { hostelId_studentId_date: { hostelId: data.hostelId, studentId: data.studentId, date: new Date(data.date) } },
      update: { status: data.status, remarks: data.remarks },
      create: { hostelId: data.hostelId, studentId: data.studentId, date: new Date(data.date), status: data.status, recordedBy: data.recordedBy, remarks: data.remarks },
    });
  }

  // Mess Attendance
  async recordMessAttendance(data: { messId: string; studentId: string; date: string; meal: string }) {
    return prisma.hostelMessAttendance.upsert({
      where: { messId_studentId_date_meal: { messId: data.messId, studentId: data.studentId, date: new Date(data.date), meal: data.meal } },
      update: { status: 'PRESENT' },
      create: { messId: data.messId, studentId: data.studentId, date: new Date(data.date), meal: data.meal },
    });
  }

  // Visitor Management
  async registerVisitor(data: { hostelId: string; studentId: string; visitorName: string; relationship: string; visitorPhone: string; purpose: string; verifiedById: string; visitorIdType?: string; visitorIdNo?: string }) {
    return prisma.hostelVisitor.create({ data });
  }

  async checkoutVisitor(visitorId: string) {
    return prisma.hostelVisitor.update({ where: { id: visitorId }, data: { status: 'CHECKED_OUT', exitTime: new Date() } });
  }

  // Complaints
  async createComplaint(data: { hostelId: string; studentId?: string; roomId?: string; category: string; title: string; description: string; priority?: string }) {
    return prisma.hostelComplaint.create({ data: { ...data, priority: data.priority || 'MEDIUM' } });
  }

  async updateComplaintStatus(complaintId: string, status: string, resolution?: string) {
    return prisma.hostelComplaint.update({ where: { id: complaintId }, data: { status, resolution, resolvedAt: status === 'RESOLVED' ? new Date() : undefined } });
  }
}
