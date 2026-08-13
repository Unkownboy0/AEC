import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { StudentAccessService } from '../security/student-access.service';

const normalizeRole = (role: string) => (role || '').toUpperCase().replace(/[\s_-]+/g, '');

export class SearchController {
  static async globalSearch(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
      }

      const query = String(req.query.q || '').trim();
      if (query.length < 2) {
        return res.status(200).json({ status: 'success', data: [] });
      }

      const requester = { id: req.user.id, role: req.user.role };
      const [scope, visibleStudentWhere] = await Promise.all([
        StudentAccessService.resolveScope(requester),
        StudentAccessService.visibleStudentWhere(requester),
      ]);
      const role = normalizeRole(req.user.role);
      const isLeadership = scope.unrestricted;
      const canSearchStaff = isLeadership || ['FACULTY', 'MENTOR', 'HOD', 'HEADOFDEPARTMENT'].includes(role);

      const studentSearchWhere: any = {
        AND: [
          visibleStudentWhere,
          {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { admissionNo: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      };

      const staffWhere: any = canSearchStaff
        ? {
            deleted: false,
            ...(isLeadership ? {} : { departmentId: { in: scope.departmentIds } }),
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { employeeId: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { designation: { contains: query, mode: 'insensitive' } },
            ],
          }
        : { id: { in: [] } };

      const subjectWhere: any = {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
        ],
        ...(isLeadership
          ? {}
          : scope.subjectIds.length > 0
            ? { id: { in: scope.subjectIds } }
            : { departmentId: { in: scope.departmentIds } }),
      };

      const circularAudience = role === 'STUDENT' || role === 'PARENT'
        ? ['ALL_CAMPUS', 'STUDENT_ONLY']
        : ['ALL_CAMPUS', 'FACULTY_ONLY'];
      const circularWhere: any = {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { circularNumber: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
        ...(isLeadership
          ? {}
          : {
              AND: [
                {
                  OR: [
                    { broadcastLevel: { in: circularAudience } },
                    {
                      broadcastLevel: 'DEPARTMENT_SPECIFIC',
                      departmentId: { in: scope.departmentIds },
                    },
                  ],
                },
              ],
            }),
      };

      const [students, faculty, departments, subjects, circulars] = await Promise.all([
        prisma.student.findMany({
          where: studentSearchWhere,
          take: 8,
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            department: { select: { name: true, code: true } },
          },
        }),

        // 3. Faculty (matches employeeId, names, designation)
        prisma.faculty.findMany({
          where: staffWhere,
          take: 8,
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            designation: true,
            department: { select: { name: true, code: true } },
          },
        }),

        // 4. Circulars (matches title, description, circularNumber)
        (prisma as any).circular?.findMany?.({
          where: {
            OR: [
              { title: { contains: searchPattern } },
              { circularNumber: { contains: searchPattern } },
              { description: { contains: searchPattern } },
            ],
            status: 'PUBLISHED',
          },
          take: 5,
          select: { id: true, title: true, circularNumber: true, category: true },
        }).catch(() => []) ?? [],

        // 5. Departments
        prisma.department.findMany({
          where: {
            status: 'ACTIVE',
            ...(isLeadership ? {} : { id: { in: scope.departmentIds } }),
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: 5,
          select: { id: true, name: true, code: true },
        }),

        // 7. Subjects
        prisma.subject.findMany({
          where: subjectWhere,
          take: 8,
          select: { id: true, name: true, code: true, departmentId: true },
        }),
        prisma.institutionalCircular.findMany({
          where: circularWhere,
          take: 5,
          orderBy: { publishedAt: 'desc' },
          select: { id: true, title: true, circularNumber: true, departmentId: true },
        }),
      ]);

      const isStudent = role === 'STUDENT';

      // Feature shortcuts for student role matching query
      const studentFeatures = [
        { name: 'My Profile', keywords: ['profile', 'master', 'personal', 'bio', 'student info'], link: '/student/profile', category: 'Profile' },
        { name: 'Digital ID Card', keywords: ['id', 'card', 'digital id', 'identity'], link: '/student/id-card', category: 'Identity' },
        { name: 'Today Timetable & Schedule', keywords: ['timetable', 'schedule', 'class', 'today', 'slot', 'period'], link: '/student/timetable', category: 'Academics' },
        { name: 'Attendance Records', keywords: ['attendance', 'present', 'absent', 'shortage'], link: '/student/attendance', category: 'Academics' },
        { name: 'Assignments & Workbooks', keywords: ['assignment', 'homework', 'submission', 'task'], link: '/student/assignments', category: 'Academics' },
        { name: 'Internal Marks & Semester Results', keywords: ['marks', 'results', 'grades', 'cgpa', 'gpa', 'transcript'], link: '/student/results', category: 'Academics' },
        { name: 'Leave & OD Applications', keywords: ['leave', 'od', 'on duty', 'permission', 'absence'], link: '/student/leave-od', category: 'Requests' },
        { name: 'Fee Dues & Receipts', keywords: ['fee', 'payment', 'due', 'receipt', 'dues', 'challan'], link: '/student/fees', category: 'Finance' },
        { name: 'Documents & Certificate Request', keywords: ['document', 'certificate', 'bonafide', 'conduct', 'vault'], link: '/student/documents', category: 'Vault' },
        { name: 'Student Achievements Showcase', keywords: ['achievement', 'award', 'cert', 'medal', 'trophy'], link: '/student/achievements', category: 'Showcase' },
        { name: 'Placement & Internship Opportunities', keywords: ['placement', 'job', 'drive', 'internship', 'career'], link: '/student/placements', category: 'Career' },
        { name: 'College Circulars & Notices', keywords: ['circular', 'notice', 'announcement', 'circulars'], link: '/student/circulars', category: 'Communication' },
        { name: 'Exam Schedule & Hall Allocation', keywords: ['exam', 'examination', 'hall', 'seat', 'schedule', 'coe'], link: '/student/examinations', category: 'Academics' },
      ];

      const matchedFeatures = isStudent
        ? studentFeatures.filter(f => f.name.toLowerCase().includes(query.toLowerCase()) || f.keywords.some(k => k.includes(query.toLowerCase())))
        : [];

      const results = [
        ...matchedFeatures.map((feat) => ({
          id: `feat-${feat.name.replace(/\s+/g, '-').toLowerCase()}`,
          title: feat.name,
          subtitle: `Authorized Workspace Feature · ${feat.category}`,
          type: 'FEATURE',
          department: null,
          link: feat.link,
        })),
        ...students.map((student) => ({
          id: student.id,
          title: `${student.firstName} ${student.lastName}`.trim(),
          subtitle: `Student · ${student.admissionNo} · ${student.department.code}`,
          type: 'STUDENT',
          department: student.department.name,
          link: isStudent ? '/student/profile' : `/profile/${student.userId || student.id}`,
        })),
        ...faculty.map((member) => ({
          id: member.id,
          title: `${member.firstName} ${member.lastName}`.trim(),
          subtitle: `${member.designation} · ${member.employeeId} · ${member.department.code}`,
          type: 'FACULTY',
          department: member.department.name,
          link: `/profile/${member.userId || member.id}`,
        })),
        ...departments.map((department) => ({
          id: department.id,
          title: `${department.name} (${department.code})`,
          subtitle: 'Department',
          type: 'DEPARTMENT',
          department: department.name,
          link: isStudent ? '/student/dashboard' : `/hod/dashboard?departmentId=${department.id}`,
        })),
        ...subjects.map((subject) => ({
          id: subject.id,
          title: `${subject.name} (${subject.code})`,
          subtitle: 'Subject',
          type: 'SUBJECT',
          department: null,
          link: isStudent ? '/student/timetable' : '/academics',
        })),
        ...circulars.map((circular) => ({
          id: circular.id,
          title: circular.title,
          subtitle: `Circular · ${circular.circularNumber}`,
          type: 'CIRCULAR',
          department: null,
          link: isStudent ? `/student/circulars` : `/circulars/${circular.id}`,
        })),
      ];

      return res.status(200).json({ status: 'success', data: results });
    } catch (error) {
      return next(error);
    }
  }
}
