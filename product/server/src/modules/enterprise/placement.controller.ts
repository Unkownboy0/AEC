import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export class PlacementController {
  /**
   * Aggregate placement analytics and department metrics for Executive / Principal Dashboard
   */
  getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear, departmentId, program, batch } = req.query as Record<string, string>;

      // 1. Fetch all active departments
      const departments = await prisma.department.findMany({
        where: { archived: false },
        select: { id: true, name: true, code: true }
      });

      // 2. Fetch all placement records
      const placementRecords = await prisma.placementRecord.findMany({
        orderBy: { driveDate: 'desc' }
      });

      // 3. Fetch students to map departments and registration status
      const students = await prisma.student.findMany({
        where: { deleted: false, status: 'ACTIVE' },
        include: {
          department: { select: { id: true, name: true, code: true } },
          user: { select: { profilePhoto: true } }
        }
      });

      // 4. Fetch internship records
      const internships = await prisma.internship.findMany({
        select: { id: true, studentId: true, company: true, role: true, status: true }
      });

      // Combine student details with placement records
      const studentRollMap = new Map<string, any>();
      students.forEach(std => {
        if (std.admissionNo) studentRollMap.set(std.admissionNo.toUpperCase(), std);
      });

      // Filter placement records based on query parameters if provided
      const filteredRecords = placementRecords.filter(rec => {
        const std = studentRollMap.get(rec.studentRoll.toUpperCase());
        if (departmentId && departmentId !== 'ALL' && std?.departmentId !== departmentId) return false;
        return true;
      });

      const selectedRecords = filteredRecords.filter(r => r.status === 'SELECTED' || r.status === 'PLACED');
      const packages = selectedRecords.map(r => r.package).filter(p => typeof p === 'number' && p > 0);

      const totalEligible = students.length;
      const totalRegistered = students.length;
      const totalPlaced = selectedRecords.length;
      const totalOffers = filteredRecords.length;
      const placementPct = totalEligible > 0 ? Math.round((totalPlaced / totalEligible) * 100) : 0;

      const highestPackage = packages.length > 0 ? Math.max(...packages) : null;
      const lowestPackage = packages.length > 0 ? Math.min(...packages) : null;
      const averagePackage = packages.length > 0
        ? parseFloat((packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(2))
        : null;

      // Unique companies count
      const uniqueCompanies = new Set(filteredRecords.map(r => r.company.trim()));
      const totalCompanies = uniqueCompanies.size;

      // Drives breakdown
      const now = new Date();
      const ongoingDrives = filteredRecords.filter(r => new Date(r.driveDate).toDateString() === now.toDateString()).length;
      const upcomingDrives = filteredRecords.filter(r => new Date(r.driveDate) > now).length;
      const completedDrives = filteredRecords.filter(r => new Date(r.driveDate) < now).length;

      const departmentStatsMap = new Map<string, any>();

      departments.forEach(department => {
        const code = (department.code || department.name).toUpperCase();
        departmentStatsMap.set(code, {
          departmentName: department.name,
          departmentCode: code,
          eligibleStudents: 0,
          registeredStudents: 0,
          placedStudents: 0,
          placementPct: 0,
          highestPackage: 0,
          averagePackage: 0,
          numberOfCompanies: 0,
          offersReceived: 0,
          internshipOffers: 0,
          status: 'NOT_AVAILABLE',
          packages: [] as number[],
          companies: new Set<string>()
        });
      });

      // Populate department counts from students & placement records
      students.forEach(std => {
        const deptCode = std.department?.code?.toUpperCase() || 'OTHERS';
        const target = departmentStatsMap.get(deptCode) || departmentStatsMap.get('OTHERS');
        if (target) {
          target.eligibleStudents += 1;
          target.registeredStudents += 1;
        }
      });

      placementRecords.forEach(rec => {
        const std = studentRollMap.get(rec.studentRoll.toUpperCase());
        const deptCode = std?.department?.code?.toUpperCase() || 'OTHERS';
        const target = departmentStatsMap.get(deptCode) || departmentStatsMap.get('OTHERS');
        if (target) {
          target.offersReceived += 1;
          target.companies.add(rec.company);
          if (rec.status === 'SELECTED' || rec.status === 'PLACED') {
            target.placedStudents += 1;
            if (rec.package > 0) target.packages.push(rec.package);
          }
        }
      });

      const departmentStats = Array.from(departmentStatsMap.values()).map(dept => {
        const eligible = dept.eligibleStudents;
        const registered = dept.registeredStudents;
        const placed = dept.placedStudents;
        const pct = eligible > 0 ? Math.round((placed / eligible) * 100) : 0;

        const pkgs = dept.packages;
        const highest = pkgs.length > 0 ? Math.max(...pkgs) : null;
        const avg = pkgs.length > 0 ? parseFloat((pkgs.reduce((a: number, b: number) => a + b, 0) / pkgs.length).toFixed(2)) : null;
        const companiesCount = dept.companies.size;
        const offers = dept.offersReceived;

        const status = eligible === 0 ? 'NOT_AVAILABLE' : pct >= 85 ? 'EXCELLENT' : pct >= 70 ? 'STABLE' : 'NEEDS_ATTENTION';

        return {
          departmentName: dept.departmentName,
          departmentCode: dept.departmentCode,
          eligibleStudents: eligible,
          registeredStudents: registered,
          placedStudents: placed,
          placementPct: pct,
          highestPackage: highest,
          averagePackage: avg,
          numberOfCompanies: companiesCount,
          offersReceived: offers,
          internshipOffers: 0,
          status
        };
      });

      // Package distribution
      const packageRanges = [
        { label: '0 - 5 LPA', count: packages.filter(p => p <= 5.0).length },
        { label: '5 - 10 LPA', count: packages.filter(p => p > 5.0 && p <= 10.0).length },
        { label: '10 - 15 LPA', count: packages.filter(p => p > 10.0 && p <= 15.0).length },
        { label: '15 - 25 LPA', count: packages.filter(p => p > 15.0 && p <= 25.0).length },
        { label: '25+ LPA', count: packages.filter(p => p > 25.0).length }
      ];

      // Top recruiting companies breakdown
      const companyMap = new Map<string, { count: number; maxPackage: number; avgPackage: number; packages: number[] }>();
      filteredRecords.forEach(r => {
        const name = r.company.trim();
        const existing = companyMap.get(name) || { count: 0, maxPackage: 0, avgPackage: 0, packages: [] };
        existing.count += 1;
        if (r.package > existing.maxPackage) existing.maxPackage = r.package;
        if (r.package > 0) existing.packages.push(r.package);
        companyMap.set(name, existing);
      });

      const topCompanies = Array.from(companyMap.entries()).map(([company, details]) => ({
        company,
        hiredCount: details.count,
        maxPackage: details.maxPackage || null,
        avgPackage: details.packages.length > 0
          ? parseFloat((details.packages.reduce((a, b) => a + b, 0) / details.packages.length).toFixed(2))
          : null
      })).sort((a, b) => b.hiredCount - a.hiredCount).slice(0, 10);

      const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' });
      const monthlyMap = new Map<string, { month: string; placed: number; offers: number }>();
      filteredRecords.forEach((record) => {
        const month = monthFormatter.format(record.driveDate);
        const item = monthlyMap.get(month) || { month, placed: 0, offers: 0 };
        item.offers += 1;
        if (record.status === 'SELECTED' || record.status === 'PLACED') item.placed += 1;
        monthlyMap.set(month, item);
      });
      const monthlyTrends = Array.from(monthlyMap.values()).reverse();

      const yearMap = new Map<number, number[]>();
      selectedRecords.forEach((record) => {
        const year = record.driveDate.getFullYear();
        const values = yearMap.get(year) || [];
        if (record.package > 0) values.push(record.package);
        yearMap.set(year, values);
      });
      const yearComparison = Array.from(yearMap.entries()).map(([year, yearPackages]) => ({
        year: String(year),
        placedPct: null,
        avgPackage: yearPackages.length > 0 ? Number((yearPackages.reduce((sum, value) => sum + value, 0) / yearPackages.length).toFixed(2)) : null,
        highestPackage: yearPackages.length > 0 ? Math.max(...yearPackages) : null
      }));

      res.status(200).json({
        status: 'success',
        data: {
          kpis: {
            totalEligible,
            totalRegistered,
            totalPlaced,
            totalOffers,
            placementPct,
            highestPackage,
            averagePackage,
            lowestPackage,
            totalCompanies,
            ongoingDrives,
            upcomingDrives,
            completedDrives
          },
          departmentStats,
          packageRanges,
          topCompanies,
          monthlyTrends,
          yearComparison
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Read-only detailed student placement records for Principal drill-down
   */
  getRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, department, company, status, packageRange, page = '1', pageSize = '50' } = req.query as Record<string, string>;

      const placementRecords = await prisma.placementRecord.findMany({
        orderBy: { driveDate: 'desc' }
      });

      const students = await prisma.student.findMany({
        where: { deleted: false },
        include: {
          department: { select: { name: true, code: true } },
          program: { select: { name: true, code: true } },
          semester: { select: { name: true } },
          user: { select: { profilePhoto: true, email: true } }
        }
      });

      // Build student lookup
      const stdMap = new Map<string, any>();
      students.forEach(s => {
        if (s.admissionNo) stdMap.set(s.admissionNo.toUpperCase(), s);
      });

      // Construct records list
      let records = placementRecords.map(rec => {
        const std = stdMap.get(rec.studentRoll.toUpperCase());
        return {
          id: rec.id,
          studentName: std ? `${std.firstName} ${std.lastName}` : rec.studentRoll,
          registerNo: rec.studentRoll,
          department: std?.department?.code || std?.department?.name || null,
          departmentName: std?.department?.name || null,
          program: std?.program?.name || null,
          semester: std?.semester?.name || null,
          company: rec.company,
          jobRole: rec.role,
          package: rec.package,
          offerStatus: rec.status,
          placementDate: rec.driveDate,
          internshipStatus: null,
          higherStudiesStatus: null,
          photo: std?.user?.profilePhoto || null
        };
      });

      // Apply Filters
      if (search) {
        const q = search.toLowerCase();
        records = records.filter(r =>
          r.studentName.toLowerCase().includes(q) ||
          r.registerNo.toLowerCase().includes(q) ||
          (r.department?.toLowerCase().includes(q) ?? false) ||
          r.company.toLowerCase().includes(q) ||
          r.jobRole.toLowerCase().includes(q)
        );
      }

      if (department && department !== 'ALL') {
        records = records.filter(r => r.department?.toUpperCase() === department.toUpperCase());
      }

      if (company && company !== 'ALL') {
        records = records.filter(r => r.company.toLowerCase() === company.toLowerCase());
      }

      if (status && status !== 'ALL') {
        records = records.filter(r => r.offerStatus.toUpperCase() === status.toUpperCase());
      }

      if (packageRange && packageRange !== 'ALL') {
        if (packageRange === '0-5') records = records.filter(r => r.package <= 5);
        else if (packageRange === '5-10') records = records.filter(r => r.package > 5 && r.package <= 10);
        else if (packageRange === '10-15') records = records.filter(r => r.package > 10 && r.package <= 15);
        else if (packageRange === '15+') records = records.filter(r => r.package > 15);
      }

      const pg = parseInt(page, 10) || 1;
      const size = parseInt(pageSize, 10) || 50;
      const startIndex = (pg - 1) * size;
      const paginatedRecords = records.slice(startIndex, startIndex + size);

      res.status(200).json({
        status: 'success',
        data: {
          records: paginatedRecords,
          totalCount: records.length,
          page: pg,
          pageSize: size
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Record Audit Log when Principal views, exports (PDF/Excel), or prints placement reports
   */
  recordAudit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { action, description } = req.body;
      const userId = (req as any).user?.id;

      if (userId) {
        await prisma.userActivityLog.create({
          data: {
            userId,
            action: action === 'EXPORT' ? 'EXPORT' : action === 'PRINT' ? 'PRINT' : 'VIEW',
            module: 'PLACEMENT',
            description: `Principal Placement Audit: ${description || 'Placement dashboard action performed.'}`,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        });
      }

      res.status(200).json({ status: 'success', message: 'Audit log recorded.' });
    } catch (error) {
      logger.error('Failed to log Principal placement audit:', error);
      res.status(200).json({ status: 'success', message: 'Audit skipped.' });
    }
  };

  /**
   * Authenticated student placement portal. Identity is resolved exclusively
   * from the access token; the client cannot select another student account.
   */
  getStudentPortal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const student = await prisma.student.findFirst({
        where: { userId, deleted: false },
        include: { department: true, program: true, semester: true },
      });
      if (!student) return res.status(404).json({ status: 'error', message: 'Student profile not found.' });

      const marks = await prisma.mark.findMany({ where: { studentId: student.id, status: 'PUBLISHED', deleted: false } });
      const cgpa = marks.length ? marks.reduce((sum, mark) => sum + Number(mark.cgpa || mark.gpa || 0), 0) / marks.length : 0;
      const backlogs = marks.filter((mark) => mark.grade === 'F').length;

      const drives = await prisma.placementDrive.findMany({
        orderBy: { driveDate: 'desc' },
        include: { applications: { where: { studentId: student.id } } },
      });
      return res.status(200).json({ status: 'success', data: { student: { ...student, cgpa, backlogs }, drives } });
    } catch (error) {
      next(error);
    }
  };

  studentApplyToDrive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const driveId = String(req.body?.driveId || '');
      const [student, drive] = await Promise.all([
        prisma.student.findFirst({ where: { userId, deleted: false }, include: { department: true } }),
        prisma.placementDrive.findUnique({ where: { id: driveId } }),
      ]);
      if (!student) return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
      if (!drive || drive.status !== 'OPEN') return res.status(400).json({ status: 'error', message: 'This placement drive is not open.' });

      const marks = await prisma.mark.findMany({ where: { studentId: student.id, status: 'PUBLISHED', deleted: false } });
      const cgpa = marks.length ? marks.reduce((sum, mark) => sum + Number(mark.cgpa || mark.gpa || 0), 0) / marks.length : 0;
      const backlogs = marks.filter((mark) => mark.grade === 'F').length;

      const allowedDepartments = (drive.eligibilityDept || '').split(',').map((v) => v.trim()).filter(Boolean);
      const eligible = (!allowedDepartments.length || allowedDepartments.includes(student.department?.code || ''))
        && cgpa >= Number(drive.eligibilityCgpa || 0)
        && backlogs <= Number(drive.maxArrears || 0);
      if (!eligible) return res.status(400).json({ status: 'error', message: 'You do not meet this drive’s eligibility criteria.' });

      const existing = await prisma.placementApplication.findFirst({ where: { driveId, studentId: student.id } });
      if (existing && existing.status !== 'WITHDRAWN') {
        return res.status(409).json({ status: 'error', message: 'You have already applied for this drive.' });
      }
      const application = existing
        ? await prisma.placementApplication.update({ where: { id: existing.id }, data: { status: 'APPLIED' } })
        : await prisma.placementApplication.create({ data: { driveId, studentId: student.id, status: 'APPLIED' } });
      return res.status(201).json({ status: 'success', data: application });
    } catch (error) {
      next(error);
    }
  };

  studentWithdrawApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const student = await prisma.student.findFirst({ where: { userId, deleted: false } });
      if (!student) return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
      const application = await prisma.placementApplication.findUnique({ where: { id: req.params.id } });
      if (!application || application.studentId !== student.id) {
        return res.status(404).json({ status: 'error', message: 'Placement application not found.' });
      }
      if (['SELECTED', 'PLACED', 'OFFERED'].includes(application.status)) {
        return res.status(400).json({ status: 'error', message: 'Selected applications cannot be withdrawn online.' });
      }
      const updated = await prisma.placementApplication.update({ where: { id: application.id }, data: { status: 'WITHDRAWN' } });
      return res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List all placement drives
   */
  listDrives = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const drives = await prisma.placementDrive.findMany({
        orderBy: { driveDate: 'desc' },
        include: {
          applications: {
            include: {
              student: {
                include: {
                  department: true
                }
              }
            }
          }
        }
      });
      res.status(200).json({ status: 'success', data: drives });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new placement drive
   */
  createDrive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        title,
        company,
        industry,
        hrContact,
        package: jobPackage,
        role,
        eligibilityCgpa,
        eligibilityDept,
        eligibilityYear,
        maxArrears,
        minAttendance,
        driveDate,
        location,
        description
      } = req.body;

      const drive = await prisma.placementDrive.create({
        data: {
          title,
          company,
          industry,
          hrContact,
          package: parseFloat(jobPackage) || 0,
          role,
          eligibilityCgpa: parseFloat(eligibilityCgpa) || 0,
          eligibilityDept,
          eligibilityYear,
          maxArrears: parseInt(maxArrears, 10) || 0,
          minAttendance: parseFloat(minAttendance) || 75.0,
          driveDate: new Date(driveDate),
          location,
          description,
          status: 'OPEN'
        }
      });

      res.status(201).json({ status: 'success', data: drive });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update placement drive details
   */
  updateDrive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const {
        title,
        company,
        industry,
        hrContact,
        package: jobPackage,
        role,
        eligibilityCgpa,
        eligibilityDept,
        eligibilityYear,
        maxArrears,
        minAttendance,
        driveDate,
        location,
        description,
        status
      } = req.body;

      const drive = await prisma.placementDrive.update({
        where: { id },
        data: {
          title,
          company,
          industry,
          hrContact,
          package: jobPackage !== undefined ? parseFloat(jobPackage) : undefined,
          role,
          eligibilityCgpa: eligibilityCgpa !== undefined ? parseFloat(eligibilityCgpa) : undefined,
          eligibilityDept,
          eligibilityYear,
          maxArrears: maxArrears !== undefined ? parseInt(maxArrears, 10) : undefined,
          minAttendance: minAttendance !== undefined ? parseFloat(minAttendance) : undefined,
          driveDate: driveDate ? new Date(driveDate) : undefined,
          location,
          description,
          status
        }
      });

      res.status(200).json({ status: 'success', data: drive });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete / Archive placement drive
   */
  deleteDrive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.placementDrive.delete({ where: { id } });
      res.status(200).json({ status: 'success', message: 'Drive deleted successfully.' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Apply for placement drive
   */
  applyToDrive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driveId, studentId } = req.body;

      // Create application
      const application = await prisma.placementApplication.create({
        data: {
          driveId,
          studentId,
          status: 'APPLIED'
        }
      });

      res.status(201).json({ status: 'success', data: application });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List all applications for a drive
   */
  listApplications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driveId } = req.params;
      const apps = await prisma.placementApplication.findMany({
        where: driveId ? { driveId } : {},
        include: {
          student: {
            include: {
              department: true,
              user: true
            }
          },
          drive: true
        }
      });
      res.status(200).json({ status: 'success', data: apps });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update application status
   */
  updateApplicationStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const app = await prisma.placementApplication.update({
        where: { id },
        data: { status },
        include: { student: true, drive: true }
      });

      // If selected/placed, also create/upsert a PlacementRecord for aggregate metrics integration!
      if (status === 'SELECTED' || status === 'PLACED') {
        const studentRoll = app.student.admissionNo;
        await prisma.placementRecord.create({
          data: {
            studentRoll,
            company: app.drive.company,
            package: app.drive.package,
            role: app.drive.role,
            status: 'SELECTED',
            driveDate: app.drive.driveDate
          }
        });
      }

      res.status(200).json({ status: 'success', data: app });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload / Verify offer letter URL
   */
  uploadOfferLetter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { offerLetterUrl } = req.body;

      const app = await prisma.placementApplication.update({
        where: { id },
        data: { offerLetterUrl },
        include: { student: true, drive: true }
      });

      res.status(200).json({ status: 'success', data: app });
    } catch (error) {
      next(error);
    }
  };
}
