import { prisma } from '../../lib/prisma';
import { NotFoundException } from '../../utils/exceptions';
import crypto from 'crypto';

export class CampusSecurityService {
  // Gate Passes
  async createGatePass(data: { requesterId: string; requesterType: string; purpose: string; destination?: string; validFrom: string; validUntil: string; vehicleNo?: string }) {
    const passNumber = `GP-${Date.now().toString(36).toUpperCase()}`;
    const qrToken = crypto.randomBytes(16).toString('hex');
    return prisma.gatePass.create({ data: { ...data, passNumber, qrToken, validFrom: new Date(data.validFrom), validUntil: new Date(data.validUntil) } });
  }

  async approveGatePass(id: string, approvedById: string) {
    return prisma.gatePass.update({ where: { id }, data: { status: 'APPROVED', approvedById, approvedAt: new Date() } });
  }

  async useGatePass(qrToken: string) {
    const pass = await prisma.gatePass.findUnique({ where: { qrToken } });
    if (!pass) throw new NotFoundException('Gate pass not found');
    if (pass.status !== 'APPROVED') return { valid: false, reason: 'Pass not approved' };
    if (new Date() > pass.validUntil) return { valid: false, reason: 'Pass expired' };
    await prisma.gatePass.update({ where: { id: pass.id }, data: { status: 'USED', usedAt: new Date() } });
    return { valid: true, pass };
  }

  async listGatePasses(filters: { status?: string; requesterType?: string; page?: number; limit?: number }) {
    const { status, requesterType, page = 1, limit = 20 } = filters;
    const where: any = {};
    if (status) where.status = status;
    if (requesterType) where.requesterType = requesterType;
    const [passes, total] = await Promise.all([
      prisma.gatePass.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.gatePass.count({ where }),
    ]);
    return { passes, total, page, limit };
  }

  // Visitors
  async registerVisitor(data: { visitorName: string; visitorPhone: string; purpose: string; hostId?: string; hostType?: string; hostName?: string; verifiedById: string; visitorIdType?: string; visitorIdNo?: string; vehicleNo?: string; entryGate?: string; organization?: string }) {
    return prisma.visitorRecord.create({ data });
  }

  async checkoutVisitor(id: string, exitGate?: string) {
    return prisma.visitorRecord.update({ where: { id }, data: { status: 'CHECKED_OUT', exitTime: new Date(), exitGate } });
  }

  async listVisitors(filters: { status?: string; date?: string; page?: number; limit?: number }) {
    const { status, date, page = 1, limit = 20 } = filters;
    const where: any = {};
    if (status) where.status = status;
    if (date) { const d = new Date(date); where.entryTime = { gte: d, lt: new Date(d.getTime() + 86400000) }; }
    const [visitors, total] = await Promise.all([
      prisma.visitorRecord.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { entryTime: 'desc' } }),
      prisma.visitorRecord.count({ where }),
    ]);
    return { visitors, total, page, limit };
  }

  // Entry/Exit Logs
  async logEntryExit(data: { personId: string; personType: string; direction: string; gate?: string; method?: string; verifiedById?: string; remarks?: string }) {
    return prisma.entryExitLog.create({ data: { ...data, method: data.method || 'QR_SCAN' } });
  }

  async getEntryExitLogs(personId: string, personType: string, limit = 50) {
    return prisma.entryExitLog.findMany({ where: { personId, personType }, take: limit, orderBy: { timestamp: 'desc' } });
  }

  // Security Incidents
  async reportIncident(data: { type: string; severity: string; location: string; description: string; reportedById: string; witnesses?: string; attachments?: string }) {
    const incidentNumber = `INC-${Date.now().toString(36).toUpperCase()}`;
    return prisma.securityIncident.create({ data: { ...data, incidentNumber, witnesses: data.witnesses || '[]', attachments: data.attachments || '[]' } });
  }

  async updateIncident(id: string, data: { status?: string; assignedToId?: string; resolution?: string; resolvedById?: string }) {
    const update: any = { ...data };
    if (data.status === 'RESOLVED') { update.resolvedAt = new Date(); }
    return prisma.securityIncident.update({ where: { id }, data: update });
  }

  async listIncidents(filters: { type?: string; status?: string; page?: number; limit?: number }) {
    const { type, status, page = 1, limit = 20 } = filters;
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    const [incidents, total] = await Promise.all([
      prisma.securityIncident.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { reportedAt: 'desc' } }),
      prisma.securityIncident.count({ where }),
    ]);
    return { incidents, total, page, limit };
  }

  // QR Verification
  async verifyQR(data: { verifierId: string; targetId: string; targetType: string; method?: string; qrPayload?: string; ipAddress?: string; deviceId?: string }) {
    let result = 'FAILED';
    let responseData: any = null;

    if (data.targetType === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { id: data.targetId }, select: { id: true, firstName: true, lastName: true, admissionNo: true, status: true, department: { select: { name: true } }, program: { select: { name: true } }, section: { select: { name: true } } } });
      if (student && student.status === 'ACTIVE') { result = 'VERIFIED'; responseData = JSON.stringify(student); }
    } else if (data.targetType === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({ where: { id: data.targetId }, select: { id: true, firstName: true, lastName: true, employeeId: true, status: true, designation: true, department: { select: { name: true } } } });
      if (faculty && faculty.status === 'ACTIVE') { result = 'VERIFIED'; responseData = JSON.stringify(faculty); }
    }

    await prisma.securityVerification.create({ data: { ...data, result, responseData, method: data.method || 'QR' } });
    return { result, data: responseData ? JSON.parse(responseData) : null };
  }

  // Dashboard
  async getDashboard() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [activeVisitors, todayEntries, pendingPasses, openIncidents, todayVerifications] = await Promise.all([
      prisma.visitorRecord.count({ where: { status: 'CHECKED_IN' } }),
      prisma.entryExitLog.count({ where: { timestamp: { gte: today } } }),
      prisma.gatePass.count({ where: { status: 'REQUESTED' } }),
      prisma.securityIncident.count({ where: { status: { in: ['REPORTED', 'INVESTIGATING'] } } }),
      prisma.securityVerification.count({ where: { timestamp: { gte: today } } }),
    ]);
    return { activeVisitors, todayEntries, pendingPasses, openIncidents, todayVerifications };
  }
}
