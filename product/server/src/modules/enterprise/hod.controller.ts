import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ForbiddenException, NotFoundException } from '../../utils/exceptions';

export class HODController {
  /**
   * 1. Real-Time Department Dashboard - 100% Database Driven
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const deptId = (req as any).departmentId;

      if (!deptId) {
        throw new ForbiddenException('Department context missing or unauthorized');
      }

      const department = await prisma.department.findUnique({
        where: { id: deptId },
        select: { id: true, name: true, code: true, hodName: true, hodId: true },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }

      // Parallel DB aggregation queries
      const [
        facultyCount,
        studentCount,
        mentorCount,
        programs,
        attendanceStats,
        marksStats,
        syllabusUnits,
        syllabusMaterials,
        faculties,
        counselingCount,
        labCount,
        tasks,
        circulars,
        pendingWorkflows,
      ] = await Promise.all([
        prisma.faculty.count({ where: { departmentId: deptId, status: 'ACTIVE' } }),
        prisma.student.count({ where: { departmentId: deptId, status: 'ACTIVE' } }),
        prisma.mentorAssignment.count({ where: { departmentId: deptId, status: 'ACTIVE' } }),
        prisma.program.findMany({
          where: { departmentId: deptId, status: 'ACTIVE' },
          select: { id: true, name: true, code: true, duration: true },
        }),
        // Attendance Percentage
        prisma.attendance.groupBy({
          by: ['status'],
          where: { student: { departmentId: deptId } },
          _count: { status: true },
        }),
        // Pass Percentage
        prisma.mark.findMany({
          where: { student: { departmentId: deptId } },
          select: { grade: true },
        }),
        // Syllabus Units
        prisma.curriculumUnit.count({
          where: { subject: { departmentId: deptId } },
        }),
        // Syllabus Materials Uploaded
        prisma.curriculumMaterial.count({
          where: { subject: { departmentId: deptId }, status: 'PUBLISHED' },
        }),
        // Faculty Workload & Publications
        prisma.faculty.findMany({
          where: { departmentId: deptId, status: 'ACTIVE' },
          select: {
            id: true,
            publications: true,
            timetableSlots: { select: { id: true } },
          },
        }),
        // Counseling Sessions
        prisma.counselingRecord.count({
          where: { student: { departmentId: deptId } },
        }),
        // Laboratory Experiments
        prisma.labExperiment.count({
          where: { subject: { departmentId: deptId } },
        }),
        // Tasks
        (prisma as any).task.findMany({
          where: { departmentId: deptId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            assignees: {
              include: { assignee: { select: { firstName: true, lastName: true } } },
            },
          },
        }),
        // Circulars
        prisma.hodCircular.findMany({
          where: { departmentId: deptId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        // Pending Workflows
        prisma.workflowRequest.count({
          where: { departmentId: deptId, status: 'PENDING_HOD' },
        }),
      ]);

      // Calculate Attendance Percentage
      let totalAttendanceRecords = 0;
      let presentAttendanceRecords = 0;
      for (const stat of attendanceStats) {
        totalAttendanceRecords += stat._count.status;
        if (stat.status === 'PRESENT') {
          presentAttendanceRecords += stat._count.status;
        }
      }
      const attendancePercentage = totalAttendanceRecords > 0
        ? Math.round((presentAttendanceRecords / totalAttendanceRecords) * 100)
        : null;

      // Calculate Pass Percentage
      const totalMarks = marksStats.length;
      const passedMarks = marksStats.filter((m: { grade?: string | null }) => m.grade !== 'F' && m.grade !== 'RA').length;
      const passPercentage = totalMarks > 0 ? Math.round((passedMarks / totalMarks) * 100) : null;

      // Calculate Research Publications
      let researchPublicationsCount = 0;
      let totalTimetableSlots = 0;
      for (const f of faculties) {
        totalTimetableSlots += f.timetableSlots.length;
        if (f.publications) {
          try {
            const pubs = JSON.parse(f.publications);
            if (Array.isArray(pubs)) researchPublicationsCount += pubs.length;
          } catch (e) {
            // non-json string
            if (f.publications.trim().length > 0) researchPublicationsCount += 1;
          }
        }
      }

      // Calculate Faculty Average Workload (hours/week)
      const avgFacultyWorkloadHours = facultyCount > 0 ? Math.round((totalTimetableSlots / facultyCount) * 10) / 10 : null;

      // Calculate Syllabus Completion Rate
      const syllabusCompletionRate = syllabusUnits > 0
        ? Math.min(100, Math.round((syllabusMaterials / (syllabusUnits * 2)) * 100))
        : null;

      // Calculate Compliance Score
      const complianceScore = passPercentage !== null && attendancePercentage !== null && syllabusCompletionRate !== null
        ? Math.min(100, Math.round((passPercentage * 0.4) + (attendancePercentage * 0.4) + (syllabusCompletionRate * 0.2)))
        : null;

      res.status(200).json({
        status: 'success',
        data: {
          department,
          stats: {
            facultyCount,
            studentCount,
            mentorCount,
            programsOfferedCount: programs.length,
            programsOffered: programs,
            passPercentage,
            attendancePercentage,
            syllabusCompletionRate,
            researchPublicationsCount,
            avgFacultyWorkloadHours,
            counselingSessionsCount: counselingCount,
            laboratoryCompletionCount: labCount,
            complianceScore,
            pendingApprovals: pendingWorkflows,
          },
          recentTasks: tasks,
          recentCirculars: circulars,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. Department Faculty Directory
   */
  static async getFacultyDirectory(req: Request, res: Response, next: NextFunction) {
    try {
      const deptId = (req as any).departmentId;
      const faculty = await prisma.faculty.findMany({
        where: { departmentId: deptId },
        include: {
          user: { select: { id: true, email: true, status: true } },
          mentorAssignments: { select: { id: true, studentId: true } },
        },
      });

      res.status(200).json({ status: 'success', data: faculty });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Department Student Directory with Advanced Filtering
   */
  static async getStudentDirectory(req: Request, res: Response, next: NextFunction) {
    try {
      const deptId = (req as any).departmentId;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const where: any = { departmentId: deptId, deleted: false };

      if (req.query.gender) where.gender = req.query.gender;
      if (req.query.status) where.status = req.query.status;
      if (req.query.academicYearId) where.academicYearId = req.query.academicYearId;
      if (req.query.semesterId) where.semesterId = req.query.semesterId;
      if (req.query.sectionId) where.sectionId = req.query.sectionId;
      if (req.query.mentorId) where.mentorId = req.query.mentorId;

      if (req.query.search) {
        const searchStr = String(req.query.search).trim();
        where.OR = [
          { firstName: { contains: searchStr } },
          { lastName: { contains: searchStr } },
          { admissionNo: { contains: searchStr } },
          { email: { contains: searchStr } },
          { phone: { contains: searchStr } },
        ];
      }

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          skip,
          take: limit,
          orderBy: { admissionNo: 'asc' },
          include: {
            department: { select: { id: true, name: true, code: true } },
            program: { select: { id: true, name: true, code: true } },
            semester: { select: { id: true, number: true, name: true } },
            section: { select: { id: true, name: true } },
            mentor: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        }),
        prisma.student.count({ where }),
      ]);

      res.status(200).json({
        status: 'success',
        data: students,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Year & Class Hierarchy View (First Year to Fourth Year -> Semester -> Section -> Students)
   */
  static async getYearClassHierarchy(req: Request, res: Response, next: NextFunction) {
    try {
      const deptId = (req as any).departmentId;

      const programs = await prisma.program.findMany({
        where: { departmentId: deptId, status: 'ACTIVE' },
        include: {
          semesters: {
            where: { status: 'ACTIVE' },
            orderBy: { number: 'asc' },
            include: {
              sections: {
                where: { status: 'ACTIVE' },
                include: {
                  students: {
                    where: { status: 'ACTIVE', deleted: false },
                    select: {
                      id: true,
                      admissionNo: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      gender: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Map into 4 Years
      const yearStructure = [
        { yearName: 'Year 1', yearNumber: 1, semesters: [1, 2] },
        { yearName: 'Year 2', yearNumber: 2, semesters: [3, 4] },
        { yearName: 'Year 3', yearNumber: 3, semesters: [5, 6] },
        { yearName: 'Year 4', yearNumber: 4, semesters: [7, 8] },
      ].map((y) => {
        const matchingSemesters = programs.flatMap((p) =>
          p.semesters.filter((s) => y.semesters.includes(s.number))
        );

        return {
          yearName: y.yearName,
          yearNumber: y.yearNumber,
          semesters: matchingSemesters.map((sem) => ({
            id: sem.id,
            name: sem.name,
            number: sem.number,
            sections: sem.sections.map((sec) => ({
              id: sec.id,
              name: sec.name,
              studentCount: sec.students.length,
              students: sec.students,
            })),
          })),
        };
      });

      res.status(200).json({ status: 'success', data: yearStructure });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 4. HOD Profile Information & Department Responsibilities
   */
  static async getHODProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const deptId = (req as any).departmentId;
      const hodUser = await prisma.user.findFirst({
        where: { departmentId: deptId, role: { name: 'HOD' } },
        include: {
          faculty: {
            include: {
              department: true,
              assignedSubjects: true,
            },
          },
        },
      });

      if (!hodUser || !hodUser.faculty) {
        throw new NotFoundException('HOD profile not found');
      }

      const [facultyCount, studentCount, pendingApprovals] = await Promise.all([
        prisma.faculty.count({ where: { departmentId: deptId } }),
        prisma.student.count({ where: { departmentId: deptId } }),
        prisma.workflowRequest.count({ where: { departmentId: deptId, status: 'PENDING_HOD' } }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          user: hodUser,
          facultyProfile: hodUser.faculty,
          departmentStats: {
            facultyCount,
            studentCount,
            pendingApprovals,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
