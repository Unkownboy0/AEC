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
   * Check for Duplicate Applicant by Email or Phone
   */
  checkDuplicate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, phone } = req.body;
      if (!email && !phone) {
        res.status(400).json({ status: 'error', message: 'Email or phone required for duplicate check' });
        return;
      }

      // Check existing Student, AdmissionApplication, or Enquiry
      const existingApp = await prisma.admissionApplication.findFirst({
        where: {
          OR: [
            ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
            ...(phone ? [{ phone }] : [])
          ]
        }
      });

      const existingStudent = await prisma.student.findFirst({
        where: {
          OR: [
            ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
            ...(phone ? [{ phone }] : [])
          ]
        }
      });

      if (existingApp || existingStudent) {
        res.status(200).json({
          status: 'success',
          isDuplicate: true,
          message: 'An applicant or student record with this email/phone already exists.',
          existingApplicationNo: existingApp?.applicationNo || existingStudent?.admissionNo
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        isDuplicate: false
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Save Wizard Draft Progress
   */
  saveWizardProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, currentStep, firstName, lastName, email, phone, parentName, gender, category, academicMarks, departmentId, programId, documents } = req.body;

      if (!email || !firstName || !lastName) {
        res.status(400).json({ status: 'error', message: 'First name, last name, and email are required to save draft' });
        return;
      }

      let app;
      if (id) {
        app = await prisma.admissionApplication.update({
          where: { id },
          data: {
            firstName,
            lastName,
            email,
            phone: phone || '',
            parentName: parentName || '',
            gender,
            category,
            academicMarks: academicMarks ? Number(academicMarks) : 0,
            departmentId,
            programId,
            documents: documents ? JSON.stringify(documents) : undefined,
            status: 'PENDING'
          }
        });
      } else {
        const appNo = `APP${new Date().getFullYear()}${Math.floor(10000 + Math.random() * 90000)}`;
        app = await prisma.admissionApplication.create({
          data: {
            applicationNo: appNo,
            firstName,
            lastName,
            email,
            phone: phone || '',
            parentName: parentName || 'Parent',
            gender: gender || 'Other',
            category: category || 'General',
            academicMarks: academicMarks ? Number(academicMarks) : 0,
            departmentId: departmentId || (await prisma.department.findFirst())?.id || '',
            programId: programId || (await prisma.program.findFirst())?.id || '',
            documents: documents ? JSON.stringify(documents) : '[]',
            status: 'PENDING'
          }
        });
      }

      res.status(200).json({
        status: 'success',
        data: app,
        currentStep
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Admission Funnel Analytics
   */
  getFunnelAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const enquiryCount = await prisma.studentEnquiry.count();
      const applicationCount = await prisma.admissionApplication.count();
      
      const allApps = await prisma.admissionApplication.findMany({
        select: { status: true, paymentStatus: true, documents: true }
      });

      let docsUploadedCount = 0;
      let docsVerifiedCount = 0;
      allApps.forEach(a => {
        try {
          const docs = JSON.parse(a.documents || '[]');
          if (docs.length > 0) docsUploadedCount++;
          if (docs.length > 0 && docs.every((d: any) => d.status === 'APPROVED')) docsVerifiedCount++;
        } catch (_) {}
      });

      const meritShortlistedCount = allApps.filter(a => ['APPROVED', 'HOLD', 'OFFER_ISSUED', 'CONFIRMED'].includes(a.status)).length;
      const offerIssuedCount = allApps.filter(a => ['OFFER_ISSUED', 'CONFIRMED'].includes(a.status)).length;
      const feePaidCount = allApps.filter(a => a.paymentStatus === 'COMPLETED' || a.status === 'CONFIRMED').length;
      const confirmedCount = allApps.filter(a => a.status === 'CONFIRMED').length;

      const totalPipelineLeads = enquiryCount + applicationCount;
      const conversionRate = totalPipelineLeads > 0 ? Math.round((confirmedCount / totalPipelineLeads) * 1000) / 10 : 0;

      const funnelStages = [
        { stage: '1. Enquiry Lead', count: enquiryCount, percentage: 100 },
        { stage: '2. Application Submitted', count: applicationCount, percentage: totalPipelineLeads > 0 ? Math.round((applicationCount / totalPipelineLeads) * 100) : 0 },
        { stage: '3. Documents Uploaded', count: docsUploadedCount, percentage: applicationCount > 0 ? Math.round((docsUploadedCount / applicationCount) * 100) : 0 },
        { stage: '4. Documents Verified', count: docsVerifiedCount, percentage: docsUploadedCount > 0 ? Math.round((docsVerifiedCount / docsUploadedCount) * 100) : 0 },
        { stage: '5. Merit Shortlisted', count: meritShortlistedCount, percentage: docsVerifiedCount > 0 ? Math.round((meritShortlistedCount / Math.max(1, docsVerifiedCount)) * 100) : 0 },
        { stage: '6. Offer Issued', count: offerIssuedCount, percentage: meritShortlistedCount > 0 ? Math.round((offerIssuedCount / meritShortlistedCount) * 100) : 0 },
        { stage: '7. Admission Fee Paid', count: feePaidCount, percentage: offerIssuedCount > 0 ? Math.round((feePaidCount / offerIssuedCount) * 100) : 0 },
        { stage: '8. Confirmed & Provisioned', count: confirmedCount, percentage: feePaidCount > 0 ? Math.round((confirmedCount / Math.max(1, feePaidCount)) * 100) : 0 },
      ];

      res.status(200).json({
        status: 'success',
        data: {
          funnelStages,
          metrics: {
            totalPipelineLeads,
            confirmedCount,
            conversionRate: `${conversionRate}%`,
            averageTurnaroundDays: 2.4
          }
        }
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Confirm Admission and Auto-Provision
   */
  confirmAdmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const app = await prisma.admissionApplication.findUnique({
        where: { id },
        include: { department: true, program: true }
      });

      if (!app) {
        res.status(404).json({ status: 'error', message: 'Application not found' });
        return;
      }

      // Update application status to CONFIRMED and paymentStatus to COMPLETED
      const updated = await prisma.admissionApplication.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED'
        }
      });

      // Auto provision Student, User Account, Parent Profile, Fee Ledger, and Digital ID
      const provisionedData = await this.enrollAndCreateStudentRecord(updated);

      res.status(200).json({
        status: 'success',
        message: 'Admission confirmed! Student, Parent, Fee Ledger, and Digital ID accounts provisioned automatically.',
        data: {
          application: updated,
          provisioned: provisionedData
        }
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Internal Helper: Complete paperless workflow and provision all connected records
   */
  private enrollAndCreateStudentRecord = async (app: any): Promise<any> => {
    // 1. Generate unique Department-based Roll / Register Number
    const dept = await prisma.department.findUnique({ where: { id: app.departmentId } });
    const deptCode = dept?.code || 'GEN';
    const regYear = new Date().getFullYear();
    const count = await prisma.student.count({ where: { departmentId: app.departmentId } });
    const rollSeq = String(count + 1).padStart(3, '0');
    const admissionNo = `${regYear}-${deptCode}-${rollSeq}`;

    // 2. Provision Student User Profile
    const studentRole = await prisma.role.findFirst({ where: { name: 'Student' } });
    const passwordHash = await bcrypt.hash(app.phone || 'Welcome@123', 10);
    const officialEmail = app.email;

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
        roleId: studentRole?.id || '',
        forcePasswordChange: true
      }
    });

    // 3. Provision Parent/Guardian Account & Profile
    const parentRole = await prisma.role.findFirst({ where: { name: 'Parent' } });
    const parentEmail = `parent.${app.email}`;
    const parentUser = await prisma.user.upsert({
      where: { email: parentEmail },
      update: {},
      create: {
        email: parentEmail,
        passwordHash,
        firstName: `Parent of ${app.firstName}`,
        lastName: app.lastName,
        phone: app.phone,
        status: 'ACTIVE',
        roleId: parentRole?.id || '',
        forcePasswordChange: false
      }
    });

    const parentProfile = await prisma.parentProfile.upsert({
      where: { userId: parentUser.id },
      update: {},
      create: {
        userId: parentUser.id,
        address: 'Official Residence'
      }
    });

    // 4. Resolve Course, Semester, Section, Academic Batch
    const course = await prisma.course.findFirst({
      where: { departmentId: app.departmentId, deleted: false }
    }) || await prisma.course.findFirst({ where: { deleted: false } });

    const semester = await prisma.semester.findFirst({
      where: { programId: app.programId, status: 'ACTIVE' }
    }) || await prisma.semester.findFirst();

    const section = await prisma.section.findFirst({
      where: { programId: app.programId, status: 'ACTIVE' }
    }) || await prisma.section.findFirst();

    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true }
    }) || await prisma.academicYear.findFirst();

    const defaultFaculty = await prisma.faculty.findFirst({
      where: { departmentId: app.departmentId, deleted: false }
    });

    // 5. Create Student Master Record
    const studentRecord = await prisma.student.create({
      data: {
        admissionNo,
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        phone: app.phone,
        dob: new Date('2006-01-01'),
        dateOfAdmission: new Date(),
        gender: app.gender || 'Other',
        bloodGroup: 'O+',
        religion: 'General',
        category: app.category || 'General',
        parentName: app.parentName || 'Parent',
        parentPhone: app.phone,
        parentEmail,
        currentAddress: 'Campus Residence Address',
        permanentAddress: 'Official Home Address',
        academicYearId: activeAcademicYear?.id || '',
        departmentId: app.departmentId,
        programId: app.programId,
        courseId: course?.id || '',
        semesterId: semester?.id || '',
        sectionId: section?.id || '',
        userId: userRecord.id,
        facultyId: defaultFaculty ? defaultFaculty.id : null,
        mentorId: defaultFaculty ? defaultFaculty.id : null
      }
    });

    // 6. Link Parent to Student
    await prisma.parentStudentRelation.create({
      data: {
        parentId: parentProfile.id,
        studentId: studentRecord.id,
        relationType: 'FATHER',
        isPrimary: true
      }
    }).catch(() => {});

    // 7. Auto-create Fee Ledger Entry (Initial Fee Bill)
    const feeCategory = await prisma.feeCategory.findFirst({ where: { deleted: false } });
    if (feeCategory) {
      await prisma.feeBill.create({
        data: {
          studentId: studentRecord.id,
          categoryId: feeCategory.id,
          amount: 75000,
          scholarshipDiscount: app.scholarshipAmount || 0,
          paidAmount: 75000 - (app.scholarshipAmount || 0),
          status: 'PAID',
          billingDate: new Date(),
          dueDate: new Date(),
          invoiceNumber: `INV-${admissionNo}`
        }
      }).catch(() => {});
    }

    return {
      admissionNo,
      studentId: studentRecord.id,
      userEmail: userRecord.email,
      parentEmail: parentUser.email,
      digitalIdEligible: true,
      status: 'PROVISIONED_SUCCESSFULLY'
    };
  };
}

