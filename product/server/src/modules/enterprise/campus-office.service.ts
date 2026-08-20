import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export interface DocumentCreateInput {
  title: string;
  type: 'DOC' | 'SHEET' | 'SLIDE' | 'FORM' | 'REPORT' | 'PDF' | 'NOTE';
  category?: string;
  contentJson?: any;
  contentHtml?: string;
  templateKey?: string;
  targetScope?: string;
  targetUsers?: string[];
  targetRoles?: string[];
  tags?: string[];
  metadata?: any;
}

export interface DocumentTokenContext {
  facultyName?: string;
  employeeId?: string;
  departmentName?: string;
  departmentCode?: string;
  academicYear?: string;
  collegeName?: string;
  currentDate?: string;
  [key: string]: string | undefined;
}

export class CampusOfficeService {
  /**
   * Reusable document templates.
   */
  static getStandardTemplates() {
    return [
      {
        key: 'DEPT_MONTHLY_REPORT',
        type: 'REPORT',
        title: 'Department Monthly Academic Progress Report',
        category: 'DEPARTMENT',
        description: 'Standard monthly progress report on syllabus coverage, attendance, labs and events.',
        defaultContent: {
          sections: [
            { heading: '1. Executive Summary', text: 'Summary of academic milestones achieved for {{department.name}} in {{academic_year}}.' },
            { heading: '2. Syllabus Coverage & Class Completion', table: [['Subject', 'Faculty', 'Planned Hours', 'Actual Covered', 'Completion %']] },
            { heading: '3. Student Attendance Statistics', text: 'Average department attendance: 92.4%.' },
            { heading: '4. Labs, Workshops & Guest Lectures', text: 'Details of practical labs and industrial webinars conducted.' },
            { heading: '5. Action Items for Next Month', text: 'Remedial classes for slow learners and mock semester exams.' },
          ],
        },
      },
      {
        key: 'MEETING_MINUTES',
        type: 'DOC',
        title: 'Department Faculty Meeting Minutes',
        category: 'MINUTES',
        description: 'Official template for recording meeting agenda, attendees, discussions and resolutions.',
        defaultContent: {
          sections: [
            { heading: 'Meeting Details', text: 'Date: {{date}} | Chaired by: {{faculty.name}} | Department: {{department.name}}' },
            { heading: 'Attendees', list: ['HOD & Chair', 'All Regular & Cross-Department Faculty Members'] },
            { heading: 'Agenda Points Discussed', list: ['Mid-term marks finalization', 'NAAC Criterion 2 documentation', 'Placement training schedule'] },
            { heading: 'Resolutions & Action Plan', table: [['Action Item', 'Responsible Faculty', 'Target Deadline']] },
          ],
        },
      },
      {
        key: 'IQAC_DATA_COLLECTION',
        type: 'FORM',
        title: 'IQAC Faculty Research & Publications Survey',
        category: 'IQAC',
        description: 'Annual survey for collecting journal publications, conference proceedings, and patents.',
        defaultContent: {
          questions: [
            { id: 'q1', type: 'SHORT_ANSWER', title: 'Faculty Full Name', required: true },
            { id: 'q2', type: 'DROPDOWN', title: 'Department', options: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'AI&DS', 'CIVIL'], required: true },
            { id: 'q3', type: 'RADIO', title: 'Publication Type', options: ['SCI/Scopus Journal', 'UGC CARE Journal', 'IEEE Conference', 'Book Chapter', 'Patent'], required: true },
            { id: 'q4', type: 'SHORT_ANSWER', title: 'Paper / Patent Title', required: true },
            { id: 'q5', type: 'SHORT_ANSWER', title: 'Journal / Publisher Name with DOI/ISSN', required: true },
            { id: 'q6', type: 'FILE_UPLOAD', title: 'Upload Proof / Acceptance PDF', required: false },
          ],
        },
      },
      {
        key: 'FACULTY_WORKLOAD_SPREADSHEET',
        type: 'SHEET',
        title: 'Faculty Teaching Workload Matrix',
        category: 'ACADEMIC',
        description: 'Excel workbook for cross-department weekly teaching hours and lab calculations.',
        defaultContent: {
          sheets: [
            {
              sheetName: 'Workload Summary',
              data: [
                ['Faculty Name', 'Home Dept', 'Teaching Dept', 'Subject Code', 'Theory Hrs', 'Lab Hrs', 'Total Hrs'],
                ['Dr. Arun Kumar', 'IT', 'IT & AI&DS', 'CS8491 / IT8401', 12, 4, 16],
                ['Prof. Priya S', 'IT', 'IT', 'IT8501', 10, 4, 14],
              ],
            },
          ],
        },
      },
    ];
  }

  /**
   * Replace template tokens with real campus data.
   */
  static applyTokens(text: string, tokens: DocumentTokenContext): string {
    let result = text;
    const map: Record<string, string> = {
      '{{faculty.name}}': tokens.facultyName || 'Dr. Faculty Member',
      '{{faculty.employee_id}}': tokens.employeeId || 'FAC001',
      '{{department.name}}': tokens.departmentName || 'Computer Science & Engineering',
      '{{department.code}}': tokens.departmentCode || 'CSE',
      '{{academic_year}}': tokens.academicYear || '2026-2027',
      '{{college.name}}': tokens.collegeName || 'CampusOS Institution',
      '{{date}}': tokens.currentDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    for (const [key, value] of Object.entries(map)) {
      result = result.split(key).join(value);
    }
    return result;
  }

  /**
   * Create new document, spreadsheet, presentation, form, or report.
   */
  static async createDocument(authorId: string, input: DocumentCreateInput) {
    const user = await prisma.user.findUnique({
      where: { id: authorId },
      include: { faculty: { include: { department: true } } },
    });

    let deptId = user?.departmentId || user?.faculty?.departmentId;
    let initialContent = input.contentJson || {};

    // Auto-populate from template if templateKey provided
    if (input.templateKey) {
      const template = this.getStandardTemplates().find(t => t.key === input.templateKey);
      if (template) {
        // Load college name and current academic year from DB
        const [nameSettings, activeYear] = await Promise.all([
          prisma.systemSetting.findMany({ where: { key: { in: ['COLLEGE_NAME'] } } }),
          prisma.academicYear.findFirst({ where: { isCurrent: true } }),
        ]);
        const nameMap = Object.fromEntries(nameSettings.map((s) => [s.key, s.value]));

        const tokens: DocumentTokenContext = {
          facultyName: user?.faculty ? `${user.faculty.firstName} ${user.faculty.lastName}` : `${user?.firstName} ${user?.lastName}`,
          employeeId: user?.faculty?.employeeId,
          departmentName: user?.faculty?.department?.name,
          departmentCode: user?.faculty?.department?.code,
          academicYear: activeYear?.name || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
          collegeName: nameMap['COLLEGE_NAME'] || 'CampusOS Institution',
          currentDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        };

        const stringified = JSON.stringify(template.defaultContent);
        const replaced = this.applyTokens(stringified, tokens);
        initialContent = JSON.parse(replaced);
      }
    }

    const doc = await prisma.campusOfficeDocument.create({
      data: {
        title: input.title,
        type: input.type,
        category: input.category || 'GENERAL',
        contentJson: JSON.stringify(initialContent),
        contentHtml: input.contentHtml,
        templateKey: input.templateKey,
        authorId,
        departmentId: deptId,
        currentVersion: 1,
        status: 'DRAFT',
        targetScope: input.targetScope || 'PRIVATE',
        targetUsers: JSON.stringify(input.targetUsers || []),
        targetRoles: JSON.stringify(input.targetRoles || []),
        tags: JSON.stringify(input.tags || []),
        metadata: JSON.stringify(input.metadata || {}),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: true,
      },
    });

    // Create initial Version 1 snapshot
    await prisma.campusDocumentVersion.create({
      data: {
        documentId: doc.id,
        versionNumber: 1,
        contentSnapshot: JSON.stringify(initialContent),
        changeSummary: 'Initial document creation',
        authorId,
      },
    });

    logger.info(`[CampusOffice] Created ${doc.type} "${doc.title}" (ID: ${doc.id}) by User ${authorId}`);
    return doc;
  }

  /**
   * Update document content & metadata (Autosave).
   */
  static async updateDocument(documentId: string, authorId: string, updates: {
    title?: string;
    contentJson?: any;
    contentHtml?: string;
    targetScope?: string;
    tags?: string[];
    metadata?: any;
  }) {
    const doc = await prisma.campusOfficeDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) throw new Error('Document not found');

    const updated = await prisma.campusOfficeDocument.update({
      where: { id: documentId },
      data: {
        title: updates.title ?? doc.title,
        contentJson: updates.contentJson ? JSON.stringify(updates.contentJson) : doc.contentJson,
        contentHtml: updates.contentHtml ?? doc.contentHtml,
        targetScope: updates.targetScope ?? doc.targetScope,
        tags: updates.tags ? JSON.stringify(updates.tags) : doc.tags,
        metadata: updates.metadata ? JSON.stringify(updates.metadata) : doc.metadata,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
        comments: { orderBy: { createdAt: 'desc' } },
      },
    });

    return updated;
  }

  /**
   * Submit Document / Report into Workflow (HOD, Dean, Principal review).
   */
  static async submitDocumentForReview(documentId: string, authorId: string, params: {
    targetWorkflowStep: 'HOD' | 'DEAN' | 'VP' | 'PRINCIPAL';
    assignedReviewerId?: string;
    submissionRemarks?: string;
  }) {
    const doc = await prisma.campusOfficeDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) throw new Error('Document not found');

    // Create a new version snapshot before submission
    const nextVersion = doc.currentVersion + 1;
    await prisma.campusDocumentVersion.create({
      data: {
        documentId: doc.id,
        versionNumber: nextVersion,
        contentSnapshot: doc.contentJson,
        changeSummary: params.submissionRemarks || `Submitted for ${params.targetWorkflowStep} review`,
        authorId,
      },
    });

    const updated = await prisma.campusOfficeDocument.update({
      where: { id: doc.id },
      data: {
        status: 'IN_REVIEW',
        currentVersion: nextVersion,
        workflowStep: params.targetWorkflowStep,
        assignedReviewerId: params.assignedReviewerId,
      },
      include: {
        author: true,
        department: true,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });

    logger.info(`[CampusOffice] Document "${doc.title}" submitted to ${params.targetWorkflowStep} for review`);
    return updated;
  }

  /**
   * Reviewer action: Add Comment, Return for Correction, or Approve.
   */
  static async reviewDocument(documentId: string, reviewerId: string, params: {
    action: 'COMMENT' | 'RETURN' | 'APPROVE' | 'PUBLISH';
    commentText?: string;
    anchorData?: any;
  }) {
    const doc = await prisma.campusOfficeDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) throw new Error('Document not found');

    // Add comment record
    if (params.commentText) {
      await prisma.campusDocumentComment.create({
        data: {
          documentId: doc.id,
          authorId: reviewerId,
          commentText: params.commentText,
          anchorData: params.anchorData ? JSON.stringify(params.anchorData) : null,
        },
      });
    }

    let nextStatus = doc.status;
    if (params.action === 'RETURN') {
      nextStatus = 'RETURNED';
    } else if (params.action === 'APPROVE') {
      nextStatus = 'APPROVED';
    } else if (params.action === 'PUBLISH') {
      nextStatus = 'PUBLISHED';
    }

    const updated = await prisma.campusOfficeDocument.update({
      where: { id: doc.id },
      data: { status: nextStatus },
      include: {
        author: true,
        department: true,
        comments: {
          include: { author: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });

    return updated;
  }

  /**
   * Submit response to a CampusOS Form / Survey.
   */
  static async submitFormResponse(formDocumentId: string, respondent: {
    userId?: string;
    email?: string;
    name?: string;
    answers: Record<string, any>;
  }) {
    const doc = await prisma.campusOfficeDocument.findUnique({
      where: { id: formDocumentId },
    });

    if (!doc || doc.type !== 'FORM') {
      throw new Error('Form not found or document is not a form');
    }

    const response = await prisma.campusFormResponse.create({
      data: {
        documentId: formDocumentId,
        respondentId: respondent.userId,
        respondentEmail: respondent.email,
        respondentName: respondent.name,
        answersJson: JSON.stringify(respondent.answers),
        status: 'SUBMITTED',
      },
    });

    logger.info(`[CampusOffice] Response submitted for Form ${doc.title} (Response ID: ${response.id})`);
    return response;
  }

  /**
   * Get all responses and analytics for a form.
   */
  static async getFormResponses(formDocumentId: string) {
    const form = await prisma.campusOfficeDocument.findUnique({
      where: { id: formDocumentId },
      include: { formResponses: { orderBy: { submittedAt: 'desc' } } },
    });

    if (!form) throw new Error('Form not found');

    const formDef = JSON.parse(form.contentJson || '{}');
    const questions: any[] = formDef.questions || [];
    const responses = form.formResponses.map(r => ({
      id: r.id,
      respondentId: r.respondentId,
      respondentName: r.respondentName,
      respondentEmail: r.respondentEmail,
      submittedAt: r.submittedAt,
      answers: JSON.parse(r.answersJson || '{}'),
    }));

    return {
      formId: form.id,
      formTitle: form.title,
      totalResponses: responses.length,
      questions,
      responses,
    };
  }

  /**
   * Campus Drive: List files and folders by scope (PERSONAL, DEPARTMENT, SHARED_WITH_ME, COLLEGE_DRIVE).
   */
  static async getDriveItems(userId: string, scope = 'PERSONAL', departmentId?: string) {
    const where: any = { isTrashed: false, scope };

    if (scope === 'PERSONAL') {
      where.ownerId = userId;
    } else if (scope === 'DEPARTMENT' && departmentId) {
      where.departmentId = departmentId;
    }

    const items = await prisma.campusDriveItem.findMany({
      where,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        department: true,
      },
      orderBy: [{ isFolder: 'desc' }, { name: 'asc' }],
    });

    return items;
  }

  /**
   * Campus Drive: Create Folder or File reference.
   */
  static async createDriveItem(ownerId: string, params: {
    name: string;
    isFolder: boolean;
    parentId?: string;
    mimeType?: string;
    fileSize?: number;
    fileUrl?: string;
    documentId?: string;
    scope?: string;
    departmentId?: string;
  }) {
    return prisma.campusDriveItem.create({
      data: {
        name: params.name,
        isFolder: params.isFolder,
        parentId: params.parentId,
        mimeType: params.mimeType,
        fileSize: params.fileSize || 0,
        fileUrl: params.fileUrl,
        documentId: params.documentId,
        ownerId,
        scope: params.scope || 'PERSONAL',
        departmentId: params.departmentId,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        department: true,
      },
    });
  }

  /**
   * List user's documents and shared department reports.
   */
  static async getUserOfficeDocuments(userId: string, filterType?: string, status?: string) {
    const where: any = { authorId: userId };
    if (filterType && filterType !== 'ALL') {
      where.type = filterType;
    }
    if (status) {
      where.status = status;
    } else {
      where.status = { notIn: ['ARCHIVED', 'TRASHED'] };
    }

    return prisma.campusOfficeDocument.findMany({
      where,
      include: {
        department: true,
        _count: { select: { versions: true, comments: true, formResponses: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
