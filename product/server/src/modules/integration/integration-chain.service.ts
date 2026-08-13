import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';
import { NotificationService } from '../notifications/notification.service';
import { WorkflowEngineService } from '../workflow/workflow-engine.service';
import crypto from 'crypto';

export class IntegrationChainService {
  private workflowEngine = new WorkflowEngineService();

  // =========================================================================
  // CHAIN 1: Admission → Student Master → User → Parent → Fees → Academic → Digital ID
  // =========================================================================
  async executeAdmissionToStudentChain(params: {
    admissionApplicationId?: string;
    studentData?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dob: string;
      gender: string;
      parentName: string;
      parentPhone: string;
      parentEmail?: string;
      departmentId: string;
      programId: string;
      courseId: string;
      semesterId: string;
      sectionId: string;
      academicYearId: string;
      currentAddress?: string;
      permanentAddress?: string;
    };
  }) {
    let appData: any = params.studentData;

    if (params.admissionApplicationId) {
      const app = await prisma.admissionApplication.findUnique({
        where: { id: params.admissionApplicationId },
      });
      if (!app) throw new NotFoundException('Admission application not found');
      appData = {
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        phone: app.phone,
        dob: new Date('2005-01-01').toISOString(),
        gender: app.gender || 'Male',
        parentName: app.parentName || 'Parent',
        parentPhone: app.phone,
        parentEmail: undefined,
        departmentId: app.departmentId,
        programId: app.programId,
        courseId: params.studentData?.courseId || 'course-default',
        semesterId: params.studentData?.semesterId || 'sem-default',
        sectionId: params.studentData?.sectionId || 'sec-default',
        academicYearId: params.studentData?.academicYearId || 'ay-default',
        currentAddress: 'Campus Address',
        permanentAddress: 'Campus Address',
      };
    }

    if (!appData) throw new BadRequestException('Student data or admissionApplicationId required');

    const result = await prisma.$transaction(async (tx) => {
      // 1. User account for Student
      const studentRole = await tx.role.findFirst({ where: { name: 'Student' } });

      let studentUser = await tx.user.findFirst({ where: { email: appData.email } });
      if (!studentUser) {
        studentUser = await tx.user.create({
          data: {
            email: appData.email,
            username: appData.email.split('@')[0],
            firstName: appData.firstName,
            lastName: appData.lastName,
            passwordHash: '$2b$10$e8w8G18h78w78w78w78w7u',
            roleId: studentRole?.id || 'role-student-default',
            status: 'ACTIVE',
          },
        });
      }

      // 2. Student Master record
      const count = await tx.student.count();
      const admissionNo = `ADM-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

      const student = await tx.student.create({
        data: {
          admissionNo,
          firstName: appData.firstName,
          lastName: appData.lastName,
          email: appData.email,
          phone: appData.phone,
          dob: new Date(appData.dob),
          dateOfAdmission: new Date(),
          gender: appData.gender,
          parentName: appData.parentName,
          parentPhone: appData.parentPhone,
          parentEmail: appData.parentEmail,
          currentAddress: appData.currentAddress || 'Campus',
          permanentAddress: appData.permanentAddress || 'Campus',
          departmentId: appData.departmentId,
          programId: appData.programId,
          courseId: appData.courseId,
          semesterId: appData.semesterId,
          sectionId: appData.sectionId,
          academicYearId: appData.academicYearId,
          userId: studentUser.id,
          status: 'ACTIVE',
        },
      });

      // 3. Parent User Account & ParentProfile & Relation
      const parentRole = await tx.role.findFirst({ where: { name: 'Parent' } });
      const parentEmail = appData.parentEmail || `parent.${student.admissionNo.toLowerCase()}@campus.edu`;

      let parentUser = await tx.user.findFirst({ where: { email: parentEmail } });
      if (!parentUser) {
        parentUser = await tx.user.create({
          data: {
            email: parentEmail,
            username: `prt_${student.admissionNo.toLowerCase()}`,
            firstName: appData.parentName,
            lastName: '(Parent)',
            phone: appData.parentPhone,
            passwordHash: '$2b$10$e8w8G18h78w78w78w78w7u',
            roleId: parentRole?.id || 'role-parent-default',
            status: 'ACTIVE',
          },
        });
      }

      let parentProfile = await tx.parentProfile.findUnique({ where: { userId: parentUser.id } });
      if (!parentProfile) {
        parentProfile = await tx.parentProfile.create({
          data: {
            userId: parentUser.id,
            address: appData.permanentAddress,
          },
        });
      }

      await tx.parentStudentRelation.upsert({
        where: { parentId_studentId: { parentId: parentProfile.id, studentId: student.id } },
        update: { relationType: 'FATHER' },
        create: { parentId: parentProfile.id, studentId: student.id, relationType: 'FATHER' },
      });

      // 4. Initial Fee Bill & Ledger Entry
      const feeCategory = await tx.feeCategory.findFirst({ where: { deleted: false } });
      let feeBill = null;
      if (feeCategory) {
        feeBill = await tx.feeBill.create({
          data: {
            studentId: student.id,
            categoryId: feeCategory.id,
            amount: 50000,
            dueDate: new Date(Date.now() + 30 * 86400000),
            billingDate: new Date(),
            invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
            status: 'PENDING',
          },
        });

        await tx.financeLedgerEntry.create({
          data: {
            entryNumber: `LED-${Date.now().toString(36).toUpperCase()}`,
            entryType: 'PAYMENT',
            direction: 'DEBIT',
            amount: 50000,
            description: `Initial tuition fee bill generated for admission ${student.admissionNo}`,
            studentId: student.id,
            billId: feeBill.id,
            createdById: studentUser.id,
            sourceType: 'FEE_BILL',
            sourceId: feeBill.id,
          },
        });
      }

      // 5. Digital ID Card
      const digitalIdCard = await tx.digitalIdCard.create({
        data: {
          ownerType: 'STUDENT',
          ownerId: student.id,
          userId: studentUser.id,
          cardVersion: 1,
          verificationToken: crypto.createHash('sha256').update(`${student.id}:${student.admissionNo}:${Date.now()}`).digest('hex'),
          status: 'ACTIVE',
          issueDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 4 * 86400000),
        },
      });

      // Update admission application status if present
      if (params.admissionApplicationId) {
        await tx.admissionApplication.update({
          where: { id: params.admissionApplicationId },
          data: { status: 'ENROLLED' },
        });
      }

      return { student, studentUser, parentUser, feeBill, digitalIdCard };
    });

    // Notify student & parent
    await NotificationService.sendNotification({
      recipientId: result.studentUser.id,
      eventType: 'ADMISSION_COMPLETED',
      title: 'Welcome to CampusOS!',
      message: `Your admission has been confirmed. Admission No: ${result.student.admissionNo}`,
      deepLinkRoute: '/student/workspace',
      priority: 'HIGH',
    });

    return result;
  }

  // =========================================================================
  // CHAIN 2: Timetable → Faculty → Student → Attendance → Availability → Substitution
  // =========================================================================
  async executeTimetableAttendanceChain(params: {
    date: string;
    facultyId: string;
    slotIndex: number;
    sectionId: string;
    subjectId: string;
    attendanceRecords: { studentId: string; status: string; remarks?: string }[];
    recordedByUserId: string;
  }) {
    const dateObj = new Date(params.date);
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][dateObj.getDay()];

    // 1. Verify Timetable Slot
    const slot = await prisma.timetableSlot.findFirst({
      where: {
        facultyId: params.facultyId,
        sectionId: params.sectionId,
        slotIndex: params.slotIndex,
        dayOfWeek,
      },
    });

    // 2. Check Faculty Leave Status
    const facultyLeave = await prisma.workflowRequest.findFirst({
      where: {
        facultyRequesterId: params.facultyId,
        type: { in: ['FACULTY_LEAVE', 'FACULTY_OD'] },
        status: { in: ['APPROVED', 'HOD_APPROVED'] },
        startDate: { lte: dateObj },
        endDate: { gte: dateObj },
      },
    });

    const isSubstituted = !!facultyLeave;

    // 3. Process Attendance Records with Student Approved Leave/OD Overrides
    const updatedRecords = await Promise.all(
      params.attendanceRecords.map(async (rec) => {
        let finalStatus = rec.status;
        let finalRemarks = rec.remarks || '';

        const approvedLeave = await prisma.workflowRequest.findFirst({
          where: {
            studentId: rec.studentId,
            type: { in: ['LEAVE', 'OD', 'MEDICAL_LEAVE', 'HOSTEL_LEAVE'] },
            status: { in: ['APPROVED', 'HOD_APPROVED'] },
            startDate: { lte: dateObj },
            endDate: { gte: dateObj },
          },
        });

        if (approvedLeave) {
          finalStatus = approvedLeave.type.includes('OD') ? 'ON_DUTY' : 'LEAVE';
          finalRemarks = `Auto-overridden by approved ${approvedLeave.type} (${approvedLeave.title})`;
        }

        const attendance = await prisma.attendance.create({
          data: {
            date: dateObj,
            status: finalStatus,
            type: 'PERIOD',
            studentId: rec.studentId,
            facultyId: params.facultyId,
            subjectId: params.subjectId,
            remarks: finalRemarks,
          },
        });

        return attendance;
      })
    );

    return {
      date: params.date,
      dayOfWeek,
      slot,
      facultyOnLeave: isSubstituted,
      totalStudentsProcessed: updatedRecords.length,
      records: updatedRecords,
    };
  }

  // =========================================================================
  // CHAIN 3: Payment → Fee → Ledger → Accounts → Receipt → Student → Parent → Reports
  // =========================================================================
  async executePaymentReconciliationChain(params: {
    feeBillId: string;
    amount: number;
    method: string;
    transactionId?: string;
    payerUserId: string;
    remarks?: string;
  }) {
    const bill = await prisma.feeBill.findUnique({
      where: { id: params.feeBillId },
      include: { student: true, category: true },
    });
    if (!bill) throw new NotFoundException('Fee bill not found');

    const result = await prisma.$transaction(async (tx) => {
      const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;

      // 1. Create Fee Payment
      const payment = await tx.feePayment.create({
        data: {
          billId: bill.id,
          studentId: bill.studentId,
          amount: params.amount,
          method: params.method,
          source: 'ONLINE',
          transactionId: params.transactionId || `TXN-${Date.now()}`,
          receiptNumber,
          paymentDate: new Date(),
          status: 'SUCCEEDED',
          remarks: params.remarks,
        },
      });

      // 2. Update Fee Bill Paid Amount & Status
      const newPaidAmount = bill.paidAmount + params.amount;
      const newStatus = newPaidAmount >= bill.amount ? 'PAID' : 'PARTIAL';

      await tx.feeBill.update({
        where: { id: bill.id },
        data: { paidAmount: newPaidAmount, status: newStatus },
      });

      // 3. Create Finance Ledger Entry
      const ledger = await tx.financeLedgerEntry.create({
        data: {
          entryNumber: `LED-${Date.now().toString(36).toUpperCase()}`,
          entryType: 'PAYMENT',
          direction: 'CREDIT',
          amount: params.amount,
          description: `Payment of ${params.amount} received via ${params.method} for fee bill`,
          studentId: bill.studentId,
          billId: bill.id,
          paymentId: payment.id,
          createdById: params.payerUserId,
          sourceType: 'FEE_PAYMENT',
          sourceId: payment.id,
        },
      });

      return { payment, newPaidAmount, newStatus, ledger, receiptNumber };
    });

    // Notify Student
    if (bill.student.userId) {
      await NotificationService.sendNotification({
        recipientId: bill.student.userId,
        eventType: 'FEE_PAYMENT_SUCCESS',
        title: 'Fee Payment Received',
        message: `Payment of ₹${params.amount} received. Receipt: ${result.receiptNumber}`,
        deepLinkRoute: `/student/fees`,
        priority: 'HIGH',
      });
    }

    // Notify Parent
    const parentRelation = await prisma.parentStudentRelation.findFirst({
      where: { studentId: bill.studentId },
      include: { parent: true },
    });
    if (parentRelation?.parent?.userId) {
      await NotificationService.sendNotification({
        recipientId: parentRelation.parent.userId,
        eventType: 'FEE_PAYMENT_SUCCESS',
        title: 'Fee Payment Confirmation',
        message: `Payment of ₹${params.amount} received for ${bill.student.firstName} ${bill.student.lastName}. Receipt: ${result.receiptNumber}`,
        deepLinkRoute: `/parent/fees`,
        priority: 'HIGH',
      });
    }

    return result;
  }

  // =========================================================================
  // CHAIN 4: Leave/OD → Workflow → Approver → Availability → Timetable → Calendar
  // =========================================================================
  async executeLeaveWorkflowChain(params: {
    requestId: string;
    approverUserId: string;
    decision: 'APPROVE' | 'REJECT';
    remarks?: string;
  }) {
    const request = await prisma.workflowRequest.findUnique({
      where: { id: params.requestId },
      include: { student: true, facultyRequester: true },
    });

    if (!request) throw new NotFoundException('Workflow request not found');

    const nextStepInfo = await this.workflowEngine.resolveNextStep({
      module: request.type,
      currentStep: request.currentStep,
      action: params.decision,
      context: {
        totalDays: request.startDate && request.endDate
          ? Math.ceil(Math.abs(request.endDate.getTime() - request.startDate.getTime()) / (1000 * 3600 * 24)) + 1
          : 1,
      },
    });

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.workflowRequest.update({
        where: { id: request.id },
        data: {
          status: nextStepInfo.nextStatus,
          currentStep: nextStepInfo.nextStep,
        },
      });

      await tx.workflowHistory.create({
        data: {
          requestId: request.id,
          stage: request.currentStep,
          action: params.decision,
          comment: params.remarks || `${params.decision} by user ${params.approverUserId}`,
          actionById: params.approverUserId,
          actionByName: 'Approver',
        },
      });

      // If final approval & request is for Faculty: update Calendar
      if (nextStepInfo.isFinal && params.decision === 'APPROVE' && request.facultyRequesterId) {
        if (request.startDate && request.endDate) {
          await tx.calendarEvent.create({
            data: {
              title: `Faculty On Leave: ${request.facultyRequester?.firstName} ${request.facultyRequester?.lastName}`,
              description: request.reason,
              startDate: request.startDate,
              endDate: request.endDate,
              eventType: 'FACULTY_LEAVE',
              scope: 'DEPARTMENT',
              departmentId: request.departmentId || undefined,
              createdById: params.approverUserId,
            },
          });
        }
      }

      // If final approval & request is for Student: auto-add Calendar Event
      if (nextStepInfo.isFinal && params.decision === 'APPROVE' && request.studentId) {
        if (request.startDate && request.endDate) {
          await tx.calendarEvent.create({
            data: {
              title: `Student Absence/OD: ${request.student?.firstName} ${request.student?.lastName}`,
              description: request.reason,
              startDate: request.startDate,
              endDate: request.endDate,
              eventType: request.type.includes('OD') ? 'ON_DUTY' : 'LEAVE',
              scope: 'DEPARTMENT',
              departmentId: request.departmentId || undefined,
              createdById: params.approverUserId,
            },
          });
        }
      }

      return updated;
    });

    // Notify requester
    const targetUserId = request.student?.userId || request.facultyRequester?.userId;
    if (targetUserId) {
      await NotificationService.sendNotification({
        recipientId: targetUserId,
        eventType: `WORKFLOW_${params.decision}`,
        title: `Request ${params.decision === 'APPROVE' ? 'Approved' : 'Rejected'}: ${request.title}`,
        message: `Your ${request.type} request status updated to ${nextStepInfo.nextStatus}`,
        deepLinkRoute: `/student/leave-od`,
        priority: 'HIGH',
      });
    }

    return result;
  }

  // =========================================================================
  // CHAIN 5: Evidence → Profile → Appraisal → IQAC → Reports
  // =========================================================================
  async executeEvidenceAppraisalChain(params: {
    evidenceId: string;
    facultyId: string;
    subcategoryId?: string;
    claimedPoints?: number;
    academicYear?: string;
  }) {
    const evidence = await prisma.evidenceItem.findUnique({
      where: { id: params.evidenceId },
    });
    if (!evidence) throw new NotFoundException('Evidence item not found');

    const faculty = await prisma.faculty.findUnique({
      where: { id: params.facultyId },
      include: { department: true },
    });
    if (!faculty) throw new NotFoundException('Faculty not found');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Link Evidence to Research / Profile
      if (evidence.category === 'PUBLICATION') {
        await tx.researchPublication.create({
          data: {
            title: evidence.title,
            journal: evidence.description || 'Academic Journal',
            authors: JSON.stringify([`${faculty.firstName} ${faculty.lastName}`]),
            year: new Date().getFullYear(),
            doi: evidence.doi,
            indexing: 'SCOPUS',
            departmentId: faculty.departmentId,
          },
        });
      } else if (evidence.category === 'PATENT') {
        await tx.patent.create({
          data: {
            title: evidence.title,
            inventors: JSON.stringify([`${faculty.firstName} ${faculty.lastName}`]),
            departmentId: faculty.departmentId,
            status: 'FILED',
            filingDate: new Date(),
          },
        });
      }

      // 2. Link to Appraisal Submission if subcategory provided
      let appraisalEntry = null;
      if (params.subcategoryId) {
        const academicYear = params.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        const activeConfig = await tx.appraisalConfig.findFirst({
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        });

        if (activeConfig) {
          let submission = await tx.appraisalSubmission.findUnique({
            where: {
              configId_facultyId_academicYear: {
                configId: activeConfig.id,
                facultyId: faculty.id,
                academicYear,
              },
            },
          });

          if (!submission) {
            submission = await tx.appraisalSubmission.create({
              data: {
                configId: activeConfig.id,
                facultyId: faculty.id,
                academicYear,
                status: 'DRAFT',
              },
            });
          }

          appraisalEntry = await tx.appraisalEntry.create({
            data: {
              submissionId: submission.id,
              subcategoryId: params.subcategoryId,
              title: evidence.title,
              description: evidence.description,
              claimedPoints: params.claimedPoints || 10,
              evidenceId: evidence.id,
              evidenceUrl: evidence.fileUrl || undefined,
            },
          });
        }
      }

      // 3. Link Evidence to IQAC Repository
      const defaultAudit = await tx.iqacAudit.findFirst();
      const defaultReq = await tx.iqacRequirement.findFirst();

      let iqacEvidence = null;
      if (defaultAudit && defaultReq) {
        iqacEvidence = await tx.iqacEvidence.create({
          data: {
            auditId: defaultAudit.id,
            departmentId: faculty.departmentId,
            requirementId: defaultReq.id,
            uploadedById: faculty.userId || 'FACULTY',
            fileReference: evidence.fileKey || 'KEY-REF',
            originalFileName: evidence.fileName || 'evidence_file',
            mimeType: evidence.mimeType || 'application/pdf',
            fileSize: evidence.fileSize || 1024,
            status: 'UPLOADED',
          },
        });
      }

      return { evidence, appraisalEntry, iqacEvidence };
    });

    return result;
  }

  // =========================================================================
  // CHAIN 6: Grievance → Responsible Unit → SLA → Maintenance → Resolution
  // =========================================================================
  async executeGrievanceEscalationChain(params: {
    ticketId: string;
    category: 'MAINTENANCE' | 'HOSTEL' | 'IT' | 'ACADEMIC' | 'GENERAL';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  }) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.ticketId },
      include: { student: true, faculty: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const priority = params.priority || ticket.priority || 'MEDIUM';
    const slaHours = priority === 'HIGH' ? 24 : priority === 'MEDIUM' ? 48 : 72;

    const result = await prisma.$transaction(async (tx) => {
      let maintenanceReq = null;
      let hostelComplaint = null;

      if (params.category === 'MAINTENANCE') {
        const requestNumber = `MR-${Date.now().toString(36).toUpperCase()}`;
        maintenanceReq = await tx.maintenanceRequest.create({
          data: {
            requestNumber,
            category: 'CIVIL',
            title: ticket.title,
            description: ticket.description,
            location: 'Campus Infrastructure',
            priority,
            status: 'OPEN',
            reportedById: ticket.student?.userId || ticket.faculty?.userId || 'USER',
            ticketId: ticket.id,
          },
        });
      } else if (params.category === 'HOSTEL') {
        hostelComplaint = await tx.hostelComplaint.create({
          data: {
            hostelId: ticket.student?.hostelId || 'HOSTEL-MAIN',
            studentId: ticket.studentId || undefined,
            category: 'MAINTENANCE',
            title: ticket.title,
            description: ticket.description,
            priority,
            status: 'OPEN',
          },
        });
      }

      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          category: params.category,
          priority,
          status: 'IN_PROGRESS',
          resolutionRemarks: `Auto-escalated to responsible unit. SLA deadline: ${slaHours}h. Ref: ${maintenanceReq?.requestNumber || hostelComplaint?.id || 'UNIT-ESCALATED'}`,
        },
      });

      return { ticket: updatedTicket, maintenanceReq, hostelComplaint, slaHours };
    });

    return result;
  }

  // =========================================================================
  // CHAIN 7: Meeting → Minutes → Action Item → Task → Calendar → Notification
  // =========================================================================
  async executeMeetingActionItemChain(params: {
    meetingId: string;
    minutesContent: string;
    actionItems: {
      title: string;
      description?: string;
      assigneeUserId: string;
      deadline: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    }[];
    createdById: string;
  }) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.meetingId },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Save / Approve Meeting Minutes
      const minutes = await tx.meetingMinutes.upsert({
        where: { meetingId: meeting.id },
        update: { content: params.minutesContent, status: 'APPROVED', approvedById: params.createdById, approvedAt: new Date() },
        create: { meetingId: meeting.id, content: params.minutesContent, status: 'APPROVED', preparedById: params.createdById, approvedById: params.createdById, approvedAt: new Date() },
      });

      // 2. Process Action Items → Tasks → Calendar Events
      const createdItems = await Promise.all(
        params.actionItems.map(async (item) => {
          const actionItem = await tx.meetingActionItem.create({
            data: {
              meetingId: meeting.id,
              title: item.title,
              description: item.description,
              assigneeId: item.assigneeUserId,
              deadline: new Date(item.deadline),
              status: 'OPEN',
            },
          });

          // Create linked Task
          const taskNumber = `TSK-${Date.now().toString(36).toUpperCase()}`;
          const task = await tx.task.create({
            data: {
              taskNumber,
              title: `[Meeting Action Item] ${item.title}`,
              description: item.description || `Extracted from meeting "${meeting.title}" minutes.`,
              priority: item.priority || 'MEDIUM',
              status: 'NOT_SEEN',
              dueDate: new Date(item.deadline),
              createdById: params.createdById,
            },
          });

          await tx.taskAssignee.create({
            data: {
              taskId: task.id,
              assigneeId: item.assigneeUserId,
              status: 'NOT_SEEN',
            },
          });

          // Create Calendar Event
          await tx.calendarEvent.create({
            data: {
              title: `Deadline: ${item.title}`,
              description: `Action item deadline from meeting "${meeting.title}"`,
              startDate: new Date(item.deadline),
              eventType: 'ACADEMIC_DEADLINE',
              scope: 'PERSONAL',
              createdById: item.assigneeUserId,
            },
          });

          // Dispatch Notification to Assignee
          await NotificationService.sendNotification({
            recipientId: item.assigneeUserId,
            eventType: 'ACTION_ITEM_ASSIGNED',
            title: 'Action Item Assigned from Meeting',
            message: `You were assigned: "${item.title}". Deadline: ${new Date(item.deadline).toLocaleDateString()}`,
            deepLinkRoute: `/tasks/${task.id}`,
            priority: 'HIGH',
          });

          return { actionItem, task };
        })
      );

      // Update meeting status to COMPLETED
      await tx.meeting.update({
        where: { id: meeting.id },
        data: { status: 'COMPLETED' },
      });

      return { meetingId: meeting.id, minutes, actionItems: createdItems };
    });

    return result;
  }
}
