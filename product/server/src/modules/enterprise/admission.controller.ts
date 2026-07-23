import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class AdmissionController {
  /**
   * Get executive analytics dashboard stats
   */
  getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const totalApplications = await prisma.admissionApplication.count();
      const pendingApplications = await prisma.admissionApplication.count({ where: { status: 'PENDING' } });
      const approvedApplications = await prisma.admissionApplication.count({ where: { status: 'APPROVED' } });
      const rejectedApplications = await prisma.admissionApplication.count({ where: { status: 'REJECTED' } });
      const admissionsCompleted = await prisma.admissionApplication.count({ where: { status: 'CONFIRMED' } });

      // Seat occupancy calculation
      const intakes = await prisma.departmentIntake.findMany({
        include: { department: true }
      });
      const totalIntake = intakes.reduce((sum, i) => sum + i.intakeCapacity, 0);
      const totalFilled = intakes.reduce((sum, i) => sum + i.filledSeats, 0);
      const seatOccupancyPercent = totalIntake > 0 ? Math.round((totalFilled / totalIntake) * 100) : 0;

      // Department-wise admissions
      const departmentAdmissions = intakes.map(i => ({
        id: i.id,
        name: i.department.name,
        code: i.department.code,
        intake: i.intakeCapacity,
        filled: i.filledSeats,
        percentage: i.intakeCapacity > 0 ? Math.round((i.filledSeats / i.intakeCapacity) * 100) : 0
      }));

      // Scholarships and concessions
      const scholarshipCount = await prisma.admissionApplication.count({
        where: { scholarshipStatus: 'APPLIED' }
      });
      const concessionCount = await prisma.admissionApplication.count({
        where: {
          OR: [
            { scholarshipType: 'Fee Concession' },
            { scholarshipType: 'Fee Waiver' }
          ]
        }
      });

      // Pending document verification
      // An application is pending verification if it has documents that are "PENDING"
      const allApps = await prisma.admissionApplication.findMany({
        where: { status: { not: 'CONFIRMED' } },
        select: { id: true, documents: true }
      });
      let documentVerificationPending = 0;
      for (const app of allApps) {
        try {
          const docs = JSON.parse(app.documents || '[]');
          if (docs.some((d: any) => d.status === 'PENDING')) {
            documentVerificationPending++;
          }
        } catch (_) {}
      }

      // Enrollment trends (Grouped by created date)
      const trendsRaw = await prisma.admissionApplication.findMany({
        select: { createdAt: true, status: true },
        orderBy: { createdAt: 'asc' }
      });

      const trendMap: Record<string, { date: string, applications: number, enrollments: number }> = {};
      trendsRaw.forEach(item => {
        const dateStr = item.createdAt.toISOString().slice(0, 10);
        if (!trendMap[dateStr]) {
          trendMap[dateStr] = { date: dateStr, applications: 0, enrollments: 0 };
        }
        trendMap[dateStr].applications++;
        if (item.status === 'CONFIRMED') {
          trendMap[dateStr].enrollments++;
        }
      });
      const enrollmentTrends = Object.values(trendMap).slice(-7); // Last 7 days with data

      res.status(200).json({
        status: 'success',
        data: {
          metrics: {
            totalApplications,
            pendingApplications,
            approvedApplications,
            rejectedApplications,
            admissionsCompleted,
            seatOccupancyPercent,
            scholarshipApplications: scholarshipCount,
            feeConcessionRequests: concessionCount,
            documentVerificationPending
          },
          departmentAdmissions,
          enrollmentTrends
        }
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * List all admission applications
   */
  listApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, status, departmentId, programId } = req.query;

      const where: any = {};
      if (status) {
        where.status = status as string;
      }
      if (departmentId) {
        where.departmentId = departmentId as string;
      }
      if (programId) {
        where.programId = programId as string;
      }

      if (search) {
        const s = search as string;
        where.OR = [
          { applicationNo: { contains: s } },
          { firstName: { contains: s } },
          { lastName: { contains: s } },
          { email: { contains: s } },
          { phone: { contains: s } }
        ];
      }

      const applications = await prisma.admissionApplication.findMany({
        where,
        include: {
          department: true,
          program: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        status: 'success',
        data: applications
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get single application details
   */
  getApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const application = await prisma.admissionApplication.findUnique({
        where: { id },
        include: {
          department: true,
          program: true
        }
      });

      if (!application) {
        res.status(404).json({ status: 'error', message: 'Application not found' });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: application
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update application status (Approve, Reject, Hold, etc.)
   */
  updateApplicationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, scholarshipStatus, scholarshipType, scholarshipAmount, waitlistNumber } = req.body;

      const application = await prisma.admissionApplication.findUnique({ where: { id } });
      if (!application) {
        res.status(404).json({ status: 'error', message: 'Application not found' });
        return;
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (scholarshipStatus) updateData.scholarshipStatus = scholarshipStatus;
      if (scholarshipType) updateData.scholarshipType = scholarshipType;
      if (scholarshipAmount !== undefined) updateData.scholarshipAmount = scholarshipAmount;
      if (waitlistNumber !== undefined) updateData.waitlistNumber = waitlistNumber;

      const updated = await prisma.admissionApplication.update({
        where: { id },
        data: updateData,
        include: { department: true, program: true }
      });

      // Workflow transition: If the application is marked CONFIRMED, create the student record
      if (status === 'CONFIRMED') {
        await this.enrollAndCreateStudentRecord(updated);
      }

      res.status(200).json({
        status: 'success',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Bulk approve/reject applications
   */
  bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids, status } = req.body;
      if (!ids || !Array.isArray(ids) || !status) {
        res.status(400).json({ status: 'error', message: 'Missing ids array or status' });
        return;
      }

      await prisma.admissionApplication.updateMany({
        where: { id: { in: ids } },
        data: { status }
      });

      // If status is CONFIRMED, enroll each student
      if (status === 'CONFIRMED') {
        const apps = await prisma.admissionApplication.findMany({
          where: { id: { in: ids } }
        });
        for (const app of apps) {
          try {
            await this.enrollAndCreateStudentRecord(app);
          } catch (e) {
            console.error('Failed to create student profile for bulk application:', app.id, e);
          }
        }
      }

      res.status(200).json({
        status: 'success',
        message: `Successfully updated ${ids.length} applications to ${status}`
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Document Verification: Approve/Reject/Request reupload for specific documents
   */
  verifyDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { docName, action, notes } = req.body; // docName: "10th Marksheet", action: "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED"

      const application = await prisma.admissionApplication.findUnique({ where: { id } });
      if (!application) {
        res.status(404).json({ status: 'error', message: 'Application not found' });
        return;
      }

      let docs = [];
      try {
        docs = JSON.parse(application.documents || '[]');
      } catch (_) {}

      // Find the document and update its status
      docs = docs.map((d: any) => {
        if (d.name === docName) {
          return { ...d, status: action, notes };
        }
        return d;
      });

      // Append verification history log
      let history = [];
      try {
        history = JSON.parse(application.verificationHistory || '[]');
      } catch (_) {}

      history.push({
        action,
        docName,
        notes,
        date: new Date().toISOString(),
        verifiedBy: 'Admission Dean'
      });

      const updated = await prisma.admissionApplication.update({
        where: { id },
        data: {
          documents: JSON.stringify(docs),
          verificationHistory: JSON.stringify(history)
        }
      });

      res.status(200).json({
        status: 'success',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get seat intakes matrix
   */
  listSeats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seats = await prisma.departmentIntake.findMany({
        include: { department: true }
      });
      res.status(200).json({
        status: 'success',
        data: seats
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Manual and Auto Seat Allocation
   */
  allocateSeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params; // Application ID
      const { mode, quotaType } = req.body; // mode: "AUTO" | "MANUAL", quotaType: "MANAGEMENT" | "GOVERNMENT"

      const app = await prisma.admissionApplication.findUnique({
        where: { id },
        include: { department: true }
      });
      if (!app) {
        res.status(404).json({ status: 'error', message: 'Application not found' });
        return;
      }

      // Check seat capacity availability
      const intake = await prisma.departmentIntake.findUnique({
        where: { departmentId: app.departmentId }
      });

      if (!intake) {
        res.status(400).json({ status: 'error', message: 'Intake details not configured for this department' });
        return;
      }

      if (intake.availableSeats <= 0) {
        res.status(400).json({ status: 'error', message: 'No seats available in this department' });
        return;
      }

      // Quota increments
      const quota = quotaType || 'GOVERNMENT';
      const seatUpdates: any = {
        availableSeats: intake.availableSeats - 1,
        filledSeats: intake.filledSeats + 1
      };

      if (quota === 'MANAGEMENT') {
        seatUpdates.managementQuotaFilled = intake.managementQuotaFilled + 1;
      } else {
        seatUpdates.governmentQuotaFilled = intake.governmentQuotaFilled + 1;
      }

      // Update seat intake capacity
      await prisma.departmentIntake.update({
        where: { departmentId: app.departmentId },
        data: seatUpdates
      });

      // Update application
      const updated = await prisma.admissionApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          waitlistNumber: null
        }
      });

      res.status(200).json({
        status: 'success',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Auto allocate seats based on merit ranking (CGPA/marks)
   */
  autoAllocateMeritSeats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Find all pending applications sorted by academicMarks desc
      const pendingApps = await prisma.admissionApplication.findMany({
        where: { status: 'PENDING' },
        orderBy: { academicMarks: 'desc' }
      });

      let allocatedCount = 0;
      for (const app of pendingApps) {
        const intake = await prisma.departmentIntake.findUnique({
          where: { departmentId: app.departmentId }
        });

        if (intake && intake.availableSeats > 0) {
          // Allocate government quota
          await prisma.departmentIntake.update({
            where: { departmentId: app.departmentId },
            data: {
              availableSeats: intake.availableSeats - 1,
              filledSeats: intake.filledSeats + 1,
              governmentQuotaFilled: intake.governmentQuotaFilled + 1
            }
          });

          await prisma.admissionApplication.update({
            where: { id: app.id },
            data: { status: 'APPROVED' }
          });
          allocatedCount++;
        }
      }

      res.status(200).json({
        status: 'success',
        message: `Successfully auto-allocated seats for ${allocatedCount} merit applicants.`
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Department Transfer
   */
  transferDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { targetDepartmentId } = req.body;

      const app = await prisma.admissionApplication.findUnique({ where: { id } });
      if (!app) {
        res.status(404).json({ status: 'error', message: 'Application not found' });
        return;
      }

      // Release a seat from the old department if it was approved
      if (app.status === 'APPROVED' || app.status === 'CONFIRMED') {
        const oldIntake = await prisma.departmentIntake.findUnique({
          where: { departmentId: app.departmentId }
        });
        if (oldIntake && oldIntake.filledSeats > 0) {
          await prisma.departmentIntake.update({
            where: { departmentId: app.departmentId },
            data: {
              availableSeats: oldIntake.availableSeats + 1,
              filledSeats: oldIntake.filledSeats - 1
            }
          });
        }
      }

      // Update the department link
      const updated = await prisma.admissionApplication.update({
        where: { id },
        data: {
          departmentId: targetDepartmentId,
          status: 'PENDING' // Reset to pending review in new department
        }
      });

      res.status(200).json({
        status: 'success',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get enquiries (Admission CRM)
   */
  listEnquiries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const enquiries = await prisma.studentEnquiry.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({
        status: 'success',
        data: enquiries
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Create CRM Enquiry
   */
  createEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentName, parentName, phone, email, source, notes } = req.body;
      const enquiry = await prisma.studentEnquiry.create({
        data: {
          studentName,
          parentName,
          phone,
          email,
          source,
          notes
        }
      });
      res.status(200).json({
        status: 'success',
        data: enquiry
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update CRM Enquiry Details
   */
  updateEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, assignedCounsellor, followUpDate, notes } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (assignedCounsellor) updateData.assignedCounsellor = assignedCounsellor;
      if (followUpDate) updateData.followUpDate = new Date(followUpDate);
      if (notes) updateData.notes = notes;

      const updated = await prisma.studentEnquiry.update({
        where: { id },
        data: updateData
      });

      res.status(200).json({
        status: 'success',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Convert CRM Enquiry to live Admission Application
   */
  convertEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { departmentId, programId, academicMarks } = req.body;

      const enquiry = await prisma.studentEnquiry.findUnique({ where: { id } });
      if (!enquiry) {
        res.status(404).json({ status: 'error', message: 'Enquiry lead not found' });
        return;
      }

      // Create new application
      const appNo = `APP${new Date().getFullYear()}${Math.floor(10000 + Math.random() * 90000)}`;
      const application = await prisma.admissionApplication.create({
        data: {
          applicationNo: appNo,
          firstName: enquiry.studentName.split(' ')[0],
          lastName: enquiry.studentName.split(' ').slice(1).join(' ') || 'Lead',
          parentName: enquiry.parentName || 'Unknown Parent',
          phone: enquiry.phone,
          email: enquiry.email || `${appNo.toLowerCase()}@example.com`,
          academicMarks: Number(academicMarks) || 80.0,
          departmentId,
          programId,
          status: 'PENDING',
          documents: JSON.stringify([
            { name: '10th Marksheet', url: '', status: 'PENDING' },
            { name: '12th Marksheet', url: '', status: 'PENDING' },
            { name: 'Aadhar / ID Proof', url: '', status: 'PENDING' }
          ])
        }
      });

      // Update enquiry status
      await prisma.studentEnquiry.update({
        where: { id },
        data: { status: 'CONVERTED' }
      });

      res.status(200).json({
        status: 'success',
        data: application
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * List Counselling Sessions
   */
  listCounselling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessions = await prisma.counsellingSession.findMany({
        orderBy: { dateTime: 'desc' }
      });
      res.status(200).json({
        status: 'success',
        data: sessions
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Create Counselling Session & cohort
   */
  createCounselling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, dateTime, counsellor, notes, studentIds } = req.body;
      const session = await prisma.counsellingSession.create({
        data: {
          title,
          dateTime: new Date(dateTime),
          counsellor,
          notes,
          studentIds: JSON.stringify(studentIds || [])
        }
      });

      // Update those applications' counsellingStatus
      if (studentIds && Array.isArray(studentIds)) {
        await prisma.admissionApplication.updateMany({
          where: { id: { in: studentIds } },
          data: {
            counsellingStatus: 'SCHEDULED',
            counsellingSessionId: session.id
          }
        });
      }

      res.status(200).json({
        status: 'success',
        data: session
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Scholarship concession list
   */
  listScholarships = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Find apps where scholarshipStatus is active
      const apps = await prisma.admissionApplication.findMany({
        where: {
          scholarshipStatus: { not: 'NONE' }
        },
        include: { department: true }
      });
      res.status(200).json({
        status: 'success',
        data: apps
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get payments summary list (View-only coordination)
   */
  listPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payments = await prisma.admissionApplication.findMany({
        select: {
          id: true,
          applicationNo: true,
          firstName: true,
          lastName: true,
          paymentStatus: true,
          scholarshipType: true,
          scholarshipAmount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Construct view ledger
      const formatted = payments.map(p => ({
        id: p.id,
        applicationNo: p.applicationNo,
        applicantName: `${p.firstName} ${p.lastName}`,
        applicationFee: 500, // standard application fee
        admissionFee: 75000, // standard semester fee
        concession: p.scholarshipAmount || 0,
        concessionType: p.scholarshipType || 'None',
        finalFee: Math.max(0, 75000 - (p.scholarshipAmount || 0)),
        paymentStatus: p.paymentStatus,
        receiptNo: p.paymentStatus === 'COMPLETED' ? `REC2026${p.applicationNo.slice(3)}` : 'N/A',
        dateStr: p.createdAt.toISOString().slice(0, 10)
      }));

      res.status(200).json({
        status: 'success',
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Internal Helper: Complete workflow and write user student records
   */
  private enrollAndCreateStudentRecord = async (app: any): Promise<void> => {
    // 1. Generate unique Student Admission Number
    const regYear = new Date().getFullYear();
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const admissionNo = `ADM${regYear}${randDigits}`;

    // 2. Fetch or create a default user profile
    const existingRole = await prisma.role.findFirst({ where: { name: 'Student' } });
    const userRoleId = existingRole ? existingRole.id : '';

    const passwordHash = await bcrypt.hash(app.phone, 10);
    const officialEmail = app.email;

    // Create user profile
    const userRecord = await prisma.user.upsert({
      where: { email: officialEmail },
      update: {},
      create: {
        email: officialEmail,
        passwordHash,
        firstName: app.firstName,
        lastName: app.lastName,
        phone: app.phone,
        status: 'ACTIVE',
        roleId: userRoleId,
        forcePasswordChange: true
      }
    });

    // 3. Resolve first course, first semester, first section mapping of CSE/target department
    const course = await prisma.course.findFirst({
      where: { departmentId: app.departmentId, deleted: false }
    });
    const semester = await prisma.semester.findFirst({
      where: { programId: app.programId, status: 'ACTIVE' }
    });
    const section = await prisma.section.findFirst({
      where: { programId: app.programId, status: 'ACTIVE' }
    });

    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true }
    });

    if (!course || !semester || !section || !activeAcademicYear) {
      throw new Error('Incomplete academic configurations (course, semester, or section missing in department)');
    }

    // Auto resolve a faculty mentor inside CSE/target dept
    const defaultFaculty = await prisma.faculty.findFirst({
      where: { departmentId: app.departmentId, deleted: false }
    });

    // Create the student profile record
    await prisma.student.create({
      data: {
        admissionNo,
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        phone: app.phone,
        dob: new Date('2006-01-01'), // placeholder, confirm in portal
        dateOfAdmission: new Date(),
        gender: app.gender || 'Other',
        bloodGroup: 'O+',
        religion: 'General',
        category: app.category || 'General',
        parentName: app.parentName,
        parentPhone: app.phone,
        currentAddress: 'Chennai, Tamil Nadu',
        permanentAddress: 'Chennai, Tamil Nadu',
        academicYearId: activeAcademicYear.id,
        departmentId: app.departmentId,
        programId: app.programId,
        courseId: course.id,
        semesterId: semester.id,
        sectionId: section.id,
        userId: userRecord.id,
        facultyId: defaultFaculty ? defaultFaculty.id : null,
        mentorId: defaultFaculty ? defaultFaculty.id : null
      }
    });
  };
}
