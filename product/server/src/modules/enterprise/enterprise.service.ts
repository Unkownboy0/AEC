import { EnterpriseRepository } from './enterprise.repository';
import { prisma } from '../../lib/prisma';
import { broadcastRBACUpdate } from '../../lib/socket';
import { BadRequestException, NotFoundException, UnauthorizedException } from '../../utils/exceptions';
import { UserPayload } from '../../utils/security';
import bcrypt from 'bcryptjs';
import { StudentAccessService } from '../security/student-access.service';
import { NotificationService } from '../notifications/notification.service';
import { ComplaintRoutingService } from './complaint-routing.service';
import { FeatureFlags } from '../../core/feature-flags';
import { WorkspaceDocumentService } from '../campus-workspace/workspace.document.service';
import { profileImageDescriptor } from '../users/profile-media.service';
import { normalizeProfileGender } from '../users/profile-values';

const WORKSPACE_DOCUMENT_PATHS: Record<string, string> = {
  DOC: 'docs', SHEET: 'sheets', SLIDE: 'slides', FORM: 'forms', QUIZ: 'quiz',
  PDF: 'pdf', NOTE: 'notes', REPORT: 'reports',
};

const resolveChatPath = (role: string): string | null => {
  if (role === 'Student') return '/student/messages';
  if (role === 'Parent') return '/parent/messages';
  if (role === 'Mentor') return '/mentor/messages';
  return null;
};

const complaintDeepLink = (complaintId: string) => `/complaints?complaintId=${encodeURIComponent(complaintId)}`;

export class EnterpriseService {
  private repo = new EnterpriseRepository();

  private withCanonicalAvatar<T>(entry: T): T {
    if (!entry || typeof entry !== 'object') return entry;
    const anyEntry = entry as any;
    if (!anyEntry.user) return entry;
    const { passwordHash: _passwordHash, profileImageFile, ...safeUser } = anyEntry.user;
    const profileImage = profileImageDescriptor({ ...anyEntry.user, profileImageFile });
    return { ...entry, user: { ...safeUser, profilePhoto: profileImage.url, profileImage } };
  }

  private withCanonicalAvatars<T extends { items: any[] }>(result: T): T {
    return { ...result, items: result.items.map((item: any) => this.withCanonicalAvatar(item)) };
  }

  // ==========================================
  // 1. STUDENTS
  // ==========================================
  async listStudents(params: any, user?: UserPayload) {
    if (!user) return this.withCanonicalAvatars(await this.repo.findStudents(params));
    const scopeWhere = await StudentAccessService.visibleStudentWhere(user);
    return this.withCanonicalAvatars(await this.repo.findStudents({ ...params, scopeWhere }));
  }

  async getStudent(id: string) {
    const student = await this.repo.findStudentById(id);
    if (!student) throw new NotFoundException('Student profile not found');
    return this.withCanonicalAvatar(student);
  }

  async createStudent(input: any, userId: string, ip?: string, ua?: string) {
    const {
      admissionNo, firstName, lastName, email, phone, dob, dateOfAdmission, gender,
      bloodGroup, religion, category, parentName, parentPhone, parentEmail, parentOccupation,
      currentAddress, permanentAddress, scholarship, academicYearId, departmentId, programId,
      courseId, semesterId, sectionId, hostelId, roomNo, transportRouteId, transportStopId,
      mentorId, facultyId, classAdvisorId
    } = input;
    const normalizedGender = normalizeProfileGender(gender);

    if (!email) {
      throw new BadRequestException('Official Email ID is required for credentials generation.');
    }
    if (!phone) {
      throw new BadRequestException('Registered Mobile Number is required for password generation.');
    }

    if (!admissionNo || !firstName || !lastName || !parentName || !parentPhone || !academicYearId || !departmentId || !programId || !courseId || !semesterId || !sectionId) {
      throw new BadRequestException('Admission Details, Full Name, Parent Details, and Academic Mapping are required');
    }

    const existing = await prisma.student.findFirst({ where: { admissionNo, deleted: false } });
    if (existing) throw new BadRequestException(`Admission Number '${admissionNo}' is already registered`);

    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) throw new BadRequestException(`Official Email ID '${email}' is already registered by another user.`);

    const phoneExists = await prisma.student.findFirst({ where: { phone, deleted: false } });
    if (phoneExists) throw new BadRequestException(`Mobile Number '${phone}' is already registered by another student.`);

    // 1. Get or create Student role
    let studentRole = await prisma.role.findFirst({ where: { name: 'Student' } });
    if (!studentRole) {
      studentRole = await prisma.role.create({
        data: { name: 'Student', description: 'Student Access Role', color: '#3b82f6', icon: 'GraduationCap' }
      });
    }

    // 2. Resolve email/username identifier
    const userEmail = email;

    // 3. Check if user already exists
    let userRecord = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!userRecord) {
      const passwordHash = await bcrypt.hash(phone, 10);
      userRecord = await prisma.user.create({
        data: {
          email: userEmail,
          passwordHash,
          firstName,
          lastName,
          status: 'ACTIVE',
          roleId: studentRole.id,
          forcePasswordChange: true,
          gender: normalizedGender,
        }
      });
    }

    // Fetch the semester to check its number
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId }
    });
    const semNumber = semester ? semester.number : 1;

    let operationalDeptId = departmentId; // default
    const programDeptId = departmentId; // permanent selected engineering branch

    if (semNumber === 1 || semNumber === 2) {
      // Must be academically managed under Science & Humanities (S&H)
      let snhDept = await prisma.department.findFirst({
        where: {
          OR: [
            { code: 'SNH' },
            { code: 'S&H' },
            { name: { contains: 'Humanities' } }
          ]
        }
      });
      if (!snhDept) {
        snhDept = await prisma.department.create({
          data: {
            name: 'Science & Humanities',
            code: 'SNH',
            shortName: 'S&H',
            description: 'Department of Science and Humanities (First Year)',
            type: 'Engineering',
            color: '#7C3AED',
            establishedYear: 2010
          }
        });
      }
      operationalDeptId = snhDept.id;
    }

    // AUTO ASSIGNMENT: Automatically assign Mentor, Faculty, and Class Advisor mappings
    let resolvedFacultyId = facultyId || mentorId || null;
    if (!resolvedFacultyId) {
      const defaultFaculty = await prisma.faculty.findFirst({
        where: { departmentId: operationalDeptId, deleted: false }
      });
      if (defaultFaculty) {
        resolvedFacultyId = defaultFaculty.id;
      }
    }
    const resolvedMentorId = resolvedFacultyId; // Sync mentorId with facultyId
    const resolvedClassAdvisorId = classAdvisorId || resolvedFacultyId;

    const student = await this.repo.createStudent({
      admissionNo,
      firstName,
      lastName,
      email,
      phone,
      dob: new Date(dob),
      dateOfAdmission: new Date(dateOfAdmission),
      gender: normalizedGender,
      bloodGroup,
      religion,
      category,
      parentName,
      parentPhone,
      parentEmail,
      parentOccupation,
      currentAddress,
      permanentAddress,
      scholarship,
      academicYearId,
      departmentId: operationalDeptId,
      programDepartmentId: programDeptId,
      programId,
      courseId,
      semesterId,
      sectionId,
      hostelId: hostelId || null,
      roomNo: roomNo || null,
      transportRouteId: transportRouteId || null,
      transportStopId: transportStopId || null,
      residentialType: input.residentialType || (hostelId ? 'HOSTELLER' : 'DAY_SCHOLAR'),
      transportMode: input.transportMode || (transportRouteId ? 'COLLEGE_BUS' : 'OTHER'),
      operatingDepartmentId: operationalDeptId,
      userId: userRecord.id,
      mentorId: resolvedMentorId,
      facultyId: resolvedFacultyId,
      classAdvisorId: resolvedClassAdvisorId,
    });

    // Create Mentor Assignment log if mentor resolved
    if (resolvedMentorId) {
      await prisma.mentorAssignment.create({
        data: {
          mentorId: resolvedMentorId,
          studentId: student.id,
          departmentId: student.departmentId,
          programId: student.programId,
          semesterId: student.semesterId,
          sectionId: student.sectionId,
          academicYearId: student.academicYearId,
          assignedBy: userId,
          status: 'ACTIVE'
        }
      });
    }

    await this.logActivity(userId, 'CREATE', 'STUDENTS', `Admitted Student: ${firstName} ${lastName} (${admissionNo})`, ip, ua);
    return student;
  }

  async updateStudent(id: string, input: any, userId: string, ip?: string, ua?: string) {
    const student = await this.getStudent(id);
    const {
      firstName, lastName, email, phone, dob, dateOfAdmission, gender,
      bloodGroup, religion, category, parentName, parentPhone, parentEmail, parentOccupation,
      currentAddress, permanentAddress, scholarship, academicYearId, departmentId, programId,
      courseId, semesterId, sectionId, hostelId, roomNo, transportRouteId, transportStopId,
      promoted, status, mentorId, facultyId, classAdvisorId
    } = input;

    const data: any = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (dob) data.dob = new Date(dob);
    if (dateOfAdmission) data.dateOfAdmission = new Date(dateOfAdmission);
    if (gender !== undefined) data.gender = normalizeProfileGender(gender);
    if (bloodGroup !== undefined) data.bloodGroup = bloodGroup;
    if (religion !== undefined) data.religion = religion;
    if (category !== undefined) data.category = category;
    if (parentName) data.parentName = parentName;
    if (parentPhone) data.parentPhone = parentPhone;
    if (parentEmail !== undefined) data.parentEmail = parentEmail;
    if (parentOccupation !== undefined) data.parentOccupation = parentOccupation;
    if (currentAddress) data.currentAddress = currentAddress;
    if (permanentAddress) data.permanentAddress = permanentAddress;
    if (scholarship !== undefined) data.scholarship = scholarship;
    
    if (academicYearId) data.academicYearId = academicYearId;
    if (programId) data.programId = programId;
    if (courseId) data.courseId = courseId;
    if (semesterId) data.semesterId = semesterId;
    if (sectionId) data.sectionId = sectionId;

    // Resolve S&H and Program Department logic dynamically
    const targetSemesterId = semesterId || student.semesterId;
    const semRecord = await prisma.semester.findUnique({
      where: { id: targetSemesterId }
    });
    const semNumber = semRecord ? semRecord.number : 1;
    const programDeptId = departmentId || student.programDepartmentId || student.departmentId;

    if (semNumber === 1 || semNumber === 2) {
      let snhDept = await prisma.department.findFirst({
        where: {
          OR: [
            { code: 'SNH' },
            { code: 'S&H' },
            { name: { contains: 'Humanities' } }
          ]
        }
      });
      if (!snhDept) {
        snhDept = await prisma.department.create({
          data: {
            name: 'Science & Humanities',
            code: 'SNH',
            shortName: 'S&H',
            description: 'Department of Science and Humanities (First Year)',
            type: 'Engineering',
            color: '#7C3AED',
            establishedYear: 2010
          }
        });
      }
      data.departmentId = snhDept.id;
      data.programDepartmentId = programDeptId;
    } else {
      data.departmentId = programDeptId;
      data.programDepartmentId = programDeptId;

      // Promotion automation: S&H -> Original branch
      const currentSemester = await prisma.semester.findUnique({
        where: { id: student.semesterId }
      });
      if (currentSemester && (currentSemester.number === 1 || currentSemester.number === 2)) {
        // Auto assign department mentor
        const newMentor = await prisma.faculty.findFirst({
          where: { departmentId: programDeptId, deleted: false }
        });
        if (newMentor) {
          data.mentorId = newMentor.id;
          data.facultyId = newMentor.id;
          data.classAdvisorId = newMentor.id;
        }
      }
    }

    if (hostelId !== undefined) data.hostelId = hostelId || null;
    if (roomNo !== undefined) data.roomNo = roomNo || null;
    if (transportRouteId !== undefined) data.transportRouteId = transportRouteId || null;
    if (transportStopId !== undefined) data.transportStopId = transportStopId || null;

    if (promoted !== undefined) data.promoted = !!promoted;
    if (status) data.status = status;

    if (classAdvisorId !== undefined) {
      data.classAdvisorId = classAdvisorId || null;
    }

    const resolvedFacultyId = facultyId !== undefined ? facultyId : (mentorId !== undefined ? mentorId : undefined);
    if (resolvedFacultyId !== undefined) {
      const actualFacultyId = resolvedFacultyId || null;
      data.facultyId = actualFacultyId;
      data.mentorId = actualFacultyId; // Sync mentorId with facultyId

      if (actualFacultyId !== student.facultyId) {
        // Mark existing assignments as historic
        await prisma.mentorAssignment.updateMany({
          where: { studentId: id, status: 'ACTIVE' },
          data: { status: 'HISTORIC' }
        });

        if (actualFacultyId) {
          await prisma.mentorAssignment.create({
            data: {
              mentorId: actualFacultyId,
              studentId: id,
              departmentId: departmentId || student.departmentId,
              programId: programId || student.programId,
              semesterId: semesterId || student.semesterId,
              sectionId: sectionId || student.sectionId,
              academicYearId: academicYearId || student.academicYearId,
              assignedBy: userId,
              status: 'ACTIVE'
            }
          });
        }
      }
    }

    const updated = await this.repo.updateStudent(id, data);
    if (gender !== undefined && student.userId) {
      await prisma.user.update({ where: { id: student.userId }, data: { gender: normalizeProfileGender(gender) } });
    }
    await this.logActivity(userId, 'UPDATE', 'STUDENTS', `Updated Student profile for ${student.admissionNo}`, ip, ua);
    return updated;
  }

  // ==========================================
  // 2. FACULTY
  // ==========================================
  async listFaculties(params: any, user?: UserPayload) {
    return this.withCanonicalAvatars(await this.repo.findFaculties(params, user));
  }

  async getFaculty(id: string) {
    const faculty = await this.repo.findFacultyById(id);
    if (!faculty) throw new NotFoundException('Faculty profile not found');
    return this.withCanonicalAvatar(faculty);
  }

  async createFaculty(input: any, userId: string, ip?: string, ua?: string) {
    const {
      employeeId, firstName, lastName, email, phone, dob, dateOfJoining, designation,
      qualification, experience, departmentId, status, subjectMappings, gender
    } = input;
    const normalizedGender = normalizeProfileGender(gender);

    if (!email) {
      throw new BadRequestException('Official Email ID is required for credentials generation.');
    }
    if (!phone) {
      throw new BadRequestException('Registered Mobile Number is required for password generation.');
    }

    if (!employeeId || !firstName || !lastName || !designation || !qualification || !departmentId) {
      throw new BadRequestException('All key details (employeeId, name, email, phone, designation, qualification, and departmentId) are required');
    }

    const existing = await prisma.faculty.findFirst({ where: { employeeId, deleted: false } });
    if (existing) throw new BadRequestException(`Employee ID '${employeeId}' is already registered`);

    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) throw new BadRequestException(`Official Email ID '${email}' is already registered by another user.`);

    const phoneExists = await prisma.faculty.findFirst({ where: { phone, deleted: false } });
    if (phoneExists) throw new BadRequestException(`Mobile Number '${phone}' is already registered by another faculty member.`);

    // Security role is never inferred from the free-text `designation` field.
    // This endpoint only ever provisions the baseline 'Faculty' access role;
    // elevated roles (HOD, Dean, Principal, etc.) must be granted explicitly
    // through authorized role-management (Super Admin / College Admin role assignment).
    let facultyRole = await prisma.role.findFirst({ where: { name: 'Faculty' } });
    if (!facultyRole) {
      facultyRole = await prisma.role.create({
        data: { name: 'Faculty', description: 'Faculty Access Role', color: '#10b981', icon: 'UserCheck' }
      });
    }

    // 2. Resolve email/username identifier
    const userEmail = email;

    // 3. Check if user already exists
    let userRecord = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!userRecord) {
      const passwordHash = await bcrypt.hash(phone, 10);
      userRecord = await prisma.user.create({
        data: {
          email: userEmail,
          passwordHash,
          firstName,
          lastName,
          status: 'ACTIVE',
          roleId: facultyRole.id,
          forcePasswordChange: true,
          gender: normalizedGender,
        }
      });
    }

    const faculty = await this.repo.createFaculty({
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      dob: new Date(dob),
      dateOfJoining: new Date(dateOfJoining),
      designation,
      qualification,
      experience: experience ? parseInt(experience) : 0,
      departmentId,
      status: status || 'ACTIVE',
      subjectMappings: subjectMappings || '[]',
      gender: normalizedGender,
      userId: userRecord.id,
    });

    await this.logActivity(userId, 'CREATE', 'FACULTY', `Registered Faculty: ${firstName} ${lastName} (${employeeId})`, ip, ua);
    return faculty;
  }

  async updateFaculty(id: string, input: any, userId: string, ip?: string, ua?: string) {
    const faculty = await this.getFaculty(id);
    const {
      firstName, lastName, email, phone, dob, dateOfJoining, designation,
      qualification, experience, departmentId, status, subjectMappings, gender
    } = input;

    const data: any = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (email) data.email = email;
    if (phone) data.phone = phone;
    if (dob) data.dob = new Date(dob);
    if (dateOfJoining) data.dateOfJoining = new Date(dateOfJoining);
    if (designation) data.designation = designation;
    if (qualification) data.qualification = qualification;
    if (experience !== undefined) data.experience = parseInt(experience);
    if (departmentId) data.departmentId = departmentId;
    if (status) data.status = status;
    if (subjectMappings !== undefined) data.subjectMappings = subjectMappings;
    if (gender !== undefined) data.gender = normalizeProfileGender(gender);

    const updated = await this.repo.updateFaculty(id, data);
    if (gender !== undefined && faculty.userId) {
      await prisma.user.update({ where: { id: faculty.userId }, data: { gender: normalizeProfileGender(gender) } });
    }
    await this.logActivity(userId, 'UPDATE', 'FACULTY', `Updated Faculty profile for ${faculty.employeeId}`, ip, ua);
    return updated;
  }

  // ==========================================
  // 3. ATTENDANCE
  // ==========================================
  async listAttendances(params: any, user?: UserPayload) {
    return this.repo.findAttendances(params, user);
  }

  async recordAttendance(input: any, userId: string, ip?: string, ua?: string) {
    const { date, status, type, remarks, studentId, facultyId, subjectId } = input;
    if (!date || !status) throw new BadRequestException('Date and Status are required');

    // Security Check: Limit regular faculty to assigned subjects only
    if (subjectId) {
      const faculty = await prisma.faculty.findFirst({ where: { userId } });
      if (faculty) {
        const userRecord = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        const isAcademicStaffOrAdmin = userRecord && ['SuperAdmin', 'HOD', 'Academic Dean', 'Principal', 'Vice Principal'].includes(userRecord.role.name);
        if (!isAcademicStaffOrAdmin) {
          const assignment = await prisma.subjectAssignment.findFirst({
            where: { facultyId: faculty.id, subjectId }
          });
          if (!assignment) {
            throw new BadRequestException('Security Alert: You are not assigned to record attendance for this subject.');
          }
        }
      }
    }

    const attendance = await this.repo.createAttendance({
      date: new Date(date),
      status,
      type: type || 'DAILY',
      remarks,
      studentId: studentId || null,
      facultyId: facultyId || null,
      subjectId: subjectId || null,
    });

    const targetType = studentId ? 'Student' : 'Faculty';
    await this.logActivity(userId, 'CREATE', 'ATTENDANCE', `Recorded ${type || 'DAILY'} Attendance for ${targetType} - Status: ${status}`, ip, ua);
    const departmentId = studentId ? (await prisma.student.findUnique({ where: { id: studentId }, select: { departmentId: true } }))?.departmentId : facultyId ? (await prisma.faculty.findUnique({ where: { id: facultyId }, select: { departmentId: true } }))?.departmentId : null;
    broadcastRBACUpdate({ type: 'ATTENDANCE_UPDATED', payload: { departmentId, subjectId, recordedAt: new Date().toISOString() } });
    return attendance;
  }

  async recordBulkAttendance(input: any, userId: string, ip?: string, ua?: string) {
    const { date, type, subjectId, records } = input;
    if (!date || !records || !Array.isArray(records)) throw new BadRequestException('Date and records array are required');

    // Security Check: Limit regular faculty to assigned subjects only
    if (subjectId) {
      const faculty = await prisma.faculty.findFirst({ where: { userId } });
      if (faculty) {
        const userRecord = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        const isAcademicStaffOrAdmin = userRecord && ['SuperAdmin', 'HOD', 'Academic Dean', 'Principal', 'Vice Principal'].includes(userRecord.role.name);
        if (!isAcademicStaffOrAdmin) {
          const assignment = await prisma.subjectAssignment.findFirst({
            where: { facultyId: faculty.id, subjectId }
          });
          if (!assignment) {
            throw new BadRequestException('Security Alert: You are not assigned to record attendance for this subject.');
          }
        }
      }
    }

    let count = 0;
    for (const r of records) {
      await this.repo.createAttendance({
        date: new Date(date),
        status: r.status, // PRESENT, ABSENT, LATE
        type: type || 'DAILY',
        remarks: r.remarks || null,
        studentId: r.studentId || null,
        facultyId: r.facultyId || null,
        subjectId: subjectId || null,
      });
      count++;
    }

    await this.logActivity(userId, 'CREATE', 'ATTENDANCE', `Recorded bulk attendance for ${count} students`, ip, ua);
    const firstStudentId = records.find((record: any) => record.studentId)?.studentId;
    const departmentId = firstStudentId ? (await prisma.student.findUnique({ where: { id: firstStudentId }, select: { departmentId: true } }))?.departmentId : null;
    broadcastRBACUpdate({ type: 'ATTENDANCE_UPDATED', payload: { departmentId, subjectId, count, recordedAt: new Date().toISOString() } });
    return { count };
  }

  // ==========================================
  // 4. EXAMS
  // ==========================================
  async listExams(params: any, user?: UserPayload) {
    return this.repo.findExams(params, user);
  }

  async getExam(id: string) {
    const exam = await this.repo.findExamById(id);
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async createExam(input: any, userId: string, ip?: string, ua?: string) {
    const { name, type, startDate, endDate, status, schedule, hallAllocation, invigilators, academicYearId, courseId, semesterId, facultyId } = input;
    if (!name || !startDate || !endDate || !academicYearId || !courseId || !semesterId) {
      throw new BadRequestException('Name, Date limits, Academic Year, Course, and Semester are required');
    }

    const exam = await this.repo.createExam({
      name,
      type: type || 'INTERNAL',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || 'DRAFT',
      schedule: schedule || '[]',
      hallAllocation: hallAllocation || '[]',
      invigilators: invigilators || '[]',
      academicYearId,
      courseId,
      semesterId,
      facultyId: facultyId || null,
    });

    await this.logActivity(userId, 'CREATE', 'EXAMS', `Created exam schedule: ${name}`, ip, ua);
    return exam;
  }

  async updateExam(id: string, input: any, userId: string, ip?: string, ua?: string) {
    const exam = await this.getExam(id);
    const { name, type, startDate, endDate, status, schedule, hallAllocation, invigilators, academicYearId, courseId, semesterId, facultyId } = input;

    const data: any = {};
    if (name) data.name = name;
    if (type) data.type = type;
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);
    if (status) data.status = status;
    if (schedule !== undefined) data.schedule = schedule;
    if (hallAllocation !== undefined) data.hallAllocation = hallAllocation;
    if (invigilators !== undefined) data.invigilators = invigilators;
    if (academicYearId) data.academicYearId = academicYearId;
    if (courseId) data.courseId = courseId;
    if (semesterId) data.semesterId = semesterId;
    if (facultyId !== undefined) data.facultyId = facultyId || null;

    const updated = await this.repo.updateExam(id, data);
    await this.logActivity(userId, 'UPDATE', 'EXAMS', `Updated exam details for ${exam.name}`, ip, ua);
    return updated;
  }

  // ==========================================
  // 5. MARKS
  // ==========================================
  async listMarks(params: any, user?: UserPayload) {
    return this.repo.findMarks(params, user);
  }

  async recordMark(input: any, userId: string, activeRole: string, ip?: string, ua?: string) {
    const { internalMarks, externalMarks, practicalMarks, examId, studentId, subjectId, status } = input;
    if (!examId || !studentId || !subjectId) throw new BadRequestException('Exam, Student, and Subject mappings are required');

    const values = [internalMarks, externalMarks, practicalMarks].map((value) => Number(value || 0));
    if (values.some((value) => !Number.isInteger(value) || value < 0)) throw new BadRequestException('Marks must be non-negative whole numbers');
    const [internal, external, practical] = values;
    const requestedStatus = String(status || 'DRAFT').toUpperCase();
    if (!['DRAFT', 'SUBMITTED'].includes(requestedStatus)) throw new BadRequestException('Marks can only be saved as draft or submitted through this endpoint');

    const role = String(activeRole || '').toUpperCase().replace(/[\s_-]+/g, '');
    if (role === 'FACULTY') {
      const faculty = await prisma.faculty.findFirst({ where: { userId, deleted: false }, select: { id: true } });
      if (!faculty) throw new UnauthorizedException('Faculty profile not found');
      const assignment = await prisma.subjectAssignment.findFirst({ where: { facultyId: faculty.id, subjectId } });
      if (!assignment) throw new UnauthorizedException('You are not assigned to enter marks for this subject');
    }

    const existing = await prisma.mark.findUnique({ where: { examId_studentId_subjectId: { examId, studentId, subjectId } } });
    if (existing && ['LOCKED', 'PUBLISHED'].includes(existing.status)) throw new BadRequestException('Locked or published marks require an authorized correction workflow');
    const total = internal + external + practical;

    const mark = await prisma.mark.upsert({
      where: { examId_studentId_subjectId: { examId, studentId, subjectId } },
      update: {
        internalMarks: internal, externalMarks: external, practicalMarks: practical,
        grade: 'PENDING', gpa: 0, cgpa: 0, status: requestedStatus,
      },
      create: {
        internalMarks: internal, externalMarks: external, practicalMarks: practical,
        grade: 'PENDING', gpa: 0, cgpa: 0, status: requestedStatus,
        examId,
        studentId,
        subjectId,
      },
    });

    await this.logActivity(userId, 'CREATE', 'MARKS', `Saved student exam marks as ${requestedStatus} - Total: ${total}; grade calculation pending configured regulation`, ip, ua);
    return mark;
  }

  // ==========================================
  // 6. FEES
  // ==========================================
  async listFeeCategories(params: any) {
    return this.repo.findFeeCategories(params);
  }

  async createFeeCategory(input: any, userId: string, ip?: string, ua?: string) {
    const { name, description, amount } = input;
    if (!name || !amount) throw new BadRequestException('Name and billing Amount are required');

    const category = await this.repo.createFeeCategory({
      name,
      description,
      amount: parseFloat(amount),
    });

    await this.logActivity(userId, 'CREATE', 'FEES', `Created Fee Category: ${name}`, ip, ua);
    return category;
  }

  async listFeeBills(params: any, user?: UserPayload) {
    return this.repo.findFeeBills(params, user);
  }

  async createFeeBill(input: any, userId: string, ip?: string, ua?: string) {
    const { studentId, categoryId, scholarshipDiscount, fine, paidAmount, billingDate, dueDate, status } = input;
    if (!studentId || !categoryId || !billingDate || !dueDate) throw new BadRequestException('Student, Category, and Dates are required');

    const cat = await prisma.feeCategory.findUnique({ where: { id: categoryId } });
    if (!cat) throw new NotFoundException('Fee category not found');

    const amount = cat.amount;

    const bill = await this.repo.createFeeBill({
      amount,
      scholarshipDiscount: parseFloat(scholarshipDiscount) || 0.0,
      fine: parseFloat(fine) || 0.0,
      paidAmount: parseFloat(paidAmount) || 0.0,
      status: status || 'PENDING',
      billingDate: new Date(billingDate),
      dueDate: new Date(dueDate),
      studentId,
      categoryId,
    });

    await this.logActivity(userId, 'CREATE', 'FEES', `Billed Tuition fees for student`, ip, ua);
    return bill;
  }

  async recordPayment(id: string, input: any, userId: string, ip?: string, ua?: string) {
    const bill = await prisma.feeBill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Fee bill not found');

    const { payAmount, paymentMode = 'Cash' } = input;
    if (!payAmount) throw new BadRequestException('Payment amount is required');

    const newPaidAmount = bill.paidAmount + parseFloat(payAmount);
    let newStatus = 'PARTIAL';
    const totalPayable = bill.amount + bill.fine - bill.scholarshipDiscount;
    if (newPaidAmount >= totalPayable) {
      newStatus = 'PAID';
    }

    // Append to payment history
    const history = JSON.parse(bill.paymentHistory || '[]');
    history.push({
      date: new Date(),
      amount: parseFloat(payAmount),
      mode: paymentMode,
      receivedBy: userId,
    });

    const updated = await prisma.feeBill.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paymentHistory: JSON.stringify(history),
      },
    });

    await this.logActivity(userId, 'UPDATE', 'FEES', `Recorded payment of $${payAmount} - Status: ${newStatus}`, ip, ua);
    return updated;
  }

  // ==========================================
  // 7. LIBRARY
  // ==========================================
  async listLibraryBooks(params: any) {
    return this.repo.findLibraryBooks(params);
  }

  async getLibraryBook(id: string) {
    const book = await this.repo.findLibraryBookById(id);
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async createLibraryBook(input: any, userId: string, ip?: string, ua?: string) {
    const { title, isbn, category, author, publisher, totalCopies, location } = input;
    if (!title || !isbn || !category || !author || !publisher) {
      throw new BadRequestException('Title, ISBN, Category, Author, and Publisher are required');
    }

    const book = await this.repo.createLibraryBook({
      title,
      isbn,
      category,
      author,
      publisher,
      totalCopies: parseInt(totalCopies) || 1,
      availableCopies: parseInt(totalCopies) || 1,
      location,
    });

    await this.logActivity(userId, 'CREATE', 'LIBRARY', `Cataloged Book: ${title} (${isbn})`, ip, ua);
    return book;
  }

  async updateLibraryBook(id: string, input: any, userId: string, ip?: string, ua?: string) {
    const book = await this.getLibraryBook(id);
    const { title, isbn, category, author, publisher, totalCopies, location } = input;

    const data: any = {};
    if (title) data.title = title;
    if (isbn) data.isbn = isbn;
    if (category) data.category = category;
    if (author) data.author = author;
    if (publisher) data.publisher = publisher;
    if (totalCopies !== undefined) {
      data.totalCopies = parseInt(totalCopies);
      // Recalculate available copies based on issued delta
      const delta = parseInt(totalCopies) - book.totalCopies;
      data.availableCopies = Math.max(0, book.availableCopies + delta);
    }
    if (location !== undefined) data.location = location;

    const updated = await this.repo.updateLibraryBook(id, data);
    await this.logActivity(userId, 'UPDATE', 'LIBRARY', `Updated library catalog for ${book.title}`, ip, ua);
    return updated;
  }

  // ==========================================
  // 8. TRANSPORT ROUTES
  // ==========================================
  async listTransportRoutes(params: any) {
    return this.repo.findTransportRoutes(params);
  }

  async getTransportRoute(id: string) {
    const route = await this.repo.findTransportRouteById(id);
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async createTransportRoute(input: any, userId: string, ip?: string, ua?: string) {
    const { routeName, vehicleNo, driverName, driverPhone, monthlyFee, stops } = input;
    if (!routeName || !vehicleNo || !driverName || !driverPhone) {
      throw new BadRequestException('Route Name, Vehicle details, and Driver details are required');
    }

    const route = await this.repo.createTransportRoute({
      routeName,
      vehicleNo,
      driverName,
      driverPhone,
      monthlyFee: parseFloat(monthlyFee) || 0.0,
      stops: stops || '[]',
    });

    await this.logActivity(userId, 'CREATE', 'TRANSPORT', `Mapped Transport Route: ${routeName}`, ip, ua);
    return route;
  }

  async updateTransportRoute(id: string, input: any, userId: string, ip?: string, ua?: string) {
    const route = await this.getTransportRoute(id);
    const { routeName, vehicleNo, driverName, driverPhone, monthlyFee, stops } = input;

    const data: any = {};
    if (routeName) data.routeName = routeName;
    if (vehicleNo) data.vehicleNo = vehicleNo;
    if (driverName) data.driverName = driverName;
    if (driverPhone) data.driverPhone = driverPhone;
    if (monthlyFee !== undefined) data.monthlyFee = parseFloat(monthlyFee);
    if (stops !== undefined) data.stops = stops;

    const updated = await this.repo.updateTransportRoute(id, data);
    await this.logActivity(userId, 'UPDATE', 'TRANSPORT', `Updated Route details for ${route.routeName}`, ip, ua);
    return updated;
  }

  // ==========================================
  // 9. HOSTELS
  // ==========================================
  async listHostels(params: any) {
    return this.repo.findHostels(params);
  }

  async getHostel(id: string) {
    const hostel = await this.repo.findHostelById(id);
    if (!hostel) throw new NotFoundException('Hostel building not found');
    return hostel;
  }

  async createHostel(input: any, userId: string, ip?: string, ua?: string) {
    const { name, type, description, rooms } = input;
    if (!name) throw new BadRequestException('Hostel Name is required');

    const hostel = await this.repo.createHostel({
      name,
      type: type || 'BOYS',
      description,
      rooms: rooms || '[]',
    });

    await this.logActivity(userId, 'CREATE', 'HOSTEL', `Registered Hostel Building: ${name}`, ip, ua);
    return hostel;
  }

  async updateHostel(id: string, input: any, userId: string, ip?: string, ua?: string) {
    const hostel = await this.getHostel(id);
    const { name, type, description, rooms } = input;

    const data: any = {};
    if (name) data.name = name;
    if (type) data.type = type;
    if (description !== undefined) data.description = description;
    if (rooms !== undefined) data.rooms = rooms;

    const updated = await this.repo.updateHostel(id, data);
    await this.logActivity(userId, 'UPDATE', 'HOSTEL', `Updated building details for ${hostel.name}`, ip, ua);
    return updated;
  }

  // ==========================================
  // 10. TICKETS (Support ticket system)
  // ==========================================
  async listTickets(params: any) {
    const { user, ...rest } = params;
    if (!user) throw new UnauthorizedException('Authentication is required to view complaints.');

    if (user.role === 'Student') {
      const student = await prisma.student.findFirst({ where: { userId: user.id } });
      if (!student) return { items: [], totalCount: 0 };
      return this.repo.findTickets({ ...rest, studentId: student.id });
    }

    if (user.role === 'Faculty' || user.role === 'Mentor') {
      const faculty = await prisma.faculty.findFirst({ where: { userId: user.id, deleted: false }, select: { id: true } });
      return this.repo.findTickets({ ...rest, facultyId: faculty?.id || '__none__' });
    }
    if (user.role === 'HOD' || user.role === 'Head of Department') {
      const departments = await prisma.departmentMembership.findMany({ where: { userId: user.id }, select: { departmentId: true } });
      const departmentIds = Array.from(new Set([...(user.departmentId ? [user.departmentId] : []), ...departments.map((item) => item.departmentId)]));
      return this.repo.findTickets({ ...rest, scopeWhere: { OR: [{ student: { departmentId: { in: departmentIds } } }, { faculty: { departmentId: { in: departmentIds } } }] } });
    }
    const roleCategories: Record<string, string[]> = { 'Admission Dean': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'Administration & Admission Dean': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'ADMINISTRATION_AND_ADMISSION_DEAN': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'Academic Dean': ['ACADEMIC'], 'IQAC Dean': ['IQAC'] };
    if (roleCategories[user.role]) {
      let categories = roleCategories[user.role];
      if (['Admission Dean', 'Administration & Admission Dean', 'ADMINISTRATION_AND_ADMISSION_DEAN'].includes(user.role)) {
        const policy = await prisma.systemSetting.findUnique({ where: { key: 'HOSTEL_ADMINISTRATION_DEAN_OVERSIGHT' }, select: { value: true } });
        if (!['true', 'enabled', '1', 'yes'].includes(String(policy?.value || '').toLowerCase())) categories = categories.filter((category) => category !== 'HOSTEL');
      }
      return this.repo.findTickets({ ...rest, scopeWhere: { ...(rest.scopeWhere || {}), category: { in: categories } } });
    }
    if (!['Principal', 'Vice Principal', 'Super Admin', 'College Admin'].includes(user.role)) throw new UnauthorizedException('Your active workspace cannot access complaints.');
    return this.repo.findTickets(rest);
  }

  async getTicket(id: string, user?: any) {
    const ticket = await this.repo.findTicketById(id);
    if (!ticket) throw new NotFoundException('Support ticket not found');

    if (user) {
      if (user.role === 'Student') {
        const student = await prisma.student.findFirst({ where: { userId: user.id } });
        if (!student || ticket.studentId !== student.id) {
          throw new UnauthorizedException('You are not authorized to view this ticket.');
        }
      } else {
        const allowed = await this.listTickets({ user, pageSize: 100, scopeWhere: { id: ticket.id } });
        if (!allowed.items.some((item: any) => item.id === ticket.id)) throw new UnauthorizedException('Your active workspace cannot view this complaint.');
      }
    }
    return ticket;
  }

  async createTicket(input: any, userId: string, activeRole?: string, ip?: string, ua?: string) {
    const { title, description, category, priority } = input;
    if (!title || !description) throw new BadRequestException('Title and ticket Description are required');

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) throw new NotFoundException('User session not found');

    const role = activeRole || user.role.name;
    let studentId = null;
    let facultyId = null;
    if (role === 'Student') {
      const student = await prisma.student.findFirst({ where: { userId } });
      if (student) studentId = student.id;
    } else if (role === 'Faculty' || role === 'Mentor' || role === 'HOD') {
      const faculty = await prisma.faculty.findFirst({ where: { userId, deleted: false } });
      if (faculty) facultyId = faculty.id;
    }

    const normalizedCategory = String(category || 'GENERAL').trim().toUpperCase();
    const normalizedPriority = String(priority || 'MEDIUM').trim().toUpperCase();
    if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'].includes(normalizedPriority)) throw new BadRequestException('Invalid complaint priority');
    const assignedToUserId = await ComplaintRoutingService.resolveOwner({ category: normalizedCategory, studentId, facultyId });

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        category: normalizedCategory,
        priority: normalizedPriority,
        studentId,
        facultyId,
        assignedToUserId,
        routedAt: assignedToUserId ? new Date() : null,
        status: 'OPEN',
      },
    });

    await this.logActivity(userId, 'CREATE', 'SUPPORT', `Created support ticket: ${title}`, ip, ua);
    await NotificationService.sendNotification({ recipientId: assignedToUserId, eventType: `COMPLAINT_${normalizedCategory}`, title: `New ${normalizedCategory.toLowerCase()} complaint`, message: title, relatedEntityType: 'TICKET', relatedEntityId: ticket.id, deepLinkRoute: complaintDeepLink(ticket.id) });
    if (assignedToUserId !== userId) {
      await NotificationService.sendNotification({ recipientId: userId, eventType: 'COMPLAINT_ACKNOWLEDGED', title: 'Complaint received', message: `Your complaint "${title}" has been routed to the responsible authority.`, relatedEntityType: 'TICKET', relatedEntityId: ticket.id, deepLinkRoute: complaintDeepLink(ticket.id) });
    }
    return ticket;
  }

  async updateTicket(id: string, input: any, userId: string, activeRole?: string, ip?: string, ua?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) throw new NotFoundException('User session not found');

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    const role = activeRole || user.role.name;
    if (role === 'Student') {
      const student = await prisma.student.findFirst({ where: { userId }, select: { id: true } });
      if (!student || ticket.studentId !== student.id) throw new UnauthorizedException('You are not authorized to update this complaint.');
      const { replies } = input;
      const data: any = {};
      if (replies !== undefined) data.replies = replies;

      const updated = await prisma.ticket.update({
        where: { id },
        data
      });
      await this.logActivity(userId, 'UPDATE', 'SUPPORT', `Student added reply for ticket #${ticket.id}`, ip, ua);
      return updated;
    }

    const categoriesByRole: Record<string, string[]> = { 'Admission Dean': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'Administration & Admission Dean': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'ADMINISTRATION_AND_ADMISSION_DEAN': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'Academic Dean': ['ACADEMIC'], 'IQAC Dean': ['IQAC'] };
    if (['Admission Dean', 'Administration & Admission Dean', 'ADMINISTRATION_AND_ADMISSION_DEAN'].includes(role) && ticket.category === 'HOSTEL') {
      const policy = await prisma.systemSetting.findUnique({ where: { key: 'HOSTEL_ADMINISTRATION_DEAN_OVERSIGHT' }, select: { value: true } });
      if (!['true', 'enabled', '1', 'yes'].includes(String(policy?.value || '').toLowerCase())) throw new UnauthorizedException('Hostel oversight is not assigned to this workspace by institution policy.');
    }
    if (categoriesByRole[role] && !categoriesByRole[role].includes(ticket.category)) throw new UnauthorizedException('Your active workspace cannot modify this complaint.');
    const isDeanOrAdmin = ['Academic Dean', 'Admission Dean', 'Administration & Admission Dean', 'ADMINISTRATION_AND_ADMISSION_DEAN', 'IQAC Dean', 'Principal', 'Vice Principal', 'Super Admin', 'College Admin'].includes(role);
    if (!isDeanOrAdmin) {
      throw new UnauthorizedException('Only Deans and executive administrators can modify complaints.');
    }

    const { title, description, category, priority, status, replies, assignedToUserId, resolutionRemarks } = input;
    const data: any = {};
    if (title) data.title = title;
    if (description) data.description = description;
    if (category) data.category = category;
    if (priority) data.priority = priority;
    if (status) {
      const normalizedStatus = String(status).toUpperCase();
      if (!['OPEN', 'PENDING', 'IN_PROGRESS', 'UNDER_INVESTIGATION', 'ESCALATED', 'RESOLVED', 'CLOSED'].includes(normalizedStatus)) throw new BadRequestException('Invalid complaint status');
      data.status = normalizedStatus;
    }
    if (replies !== undefined) data.replies = replies;
    if (resolutionRemarks !== undefined) data.resolutionRemarks = String(resolutionRemarks).trim() || null;
    if (assignedToUserId !== undefined) {
      if (assignedToUserId) {
        const assignee = await prisma.user.findFirst({ where: { id: String(assignedToUserId), status: 'ACTIVE' }, select: { id: true } });
        if (!assignee) throw new BadRequestException('Complaint assignee is invalid or inactive');
      }
      data.assignedToUserId = assignedToUserId || null;
      data.routedAt = assignedToUserId ? new Date() : null;
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data
    });
    await this.logActivity(userId, 'UPDATE', 'SUPPORT', `Dean/Executive updated ticket #${ticket.id} details`, ip, ua);
    if (status || assignedToUserId !== undefined) {
      const reporter = ticket.studentId
        ? await prisma.student.findUnique({ where: { id: ticket.studentId }, select: { userId: true } })
        : ticket.facultyId
          ? await prisma.faculty.findUnique({ where: { id: ticket.facultyId }, select: { userId: true } })
          : null;
      if (reporter?.userId) await NotificationService.sendNotification({ recipientId: reporter.userId, eventType: 'COMPLAINT_UPDATED', title: 'Complaint updated', message: `Your complaint "${ticket.title}" is now ${data.status || ticket.status}.`, relatedEntityType: 'TICKET', relatedEntityId: ticket.id, deepLinkRoute: complaintDeepLink(ticket.id) });
    }
    return updated;
  }

  // ==========================================
  // BULK SERVICES
  // ==========================================
  async bulkDelete(moduleKey: string, ids: string[], userId: string, ip?: string, ua?: string) {
    const prismaModelName = this.getPrismaModelName(moduleKey);
    await this.repo.bulkDelete(prismaModelName, ids);
    await this.logActivity(userId, 'DELETE', moduleKey.toUpperCase(), `Bulk soft-deleted ${ids.length} records`, ip, ua);
  }

  async bulkArchive(moduleKey: string, ids: string[], userId: string, ip?: string, ua?: string) {
    const prismaModelName = this.getPrismaModelName(moduleKey);
    await this.repo.bulkArchive(prismaModelName, ids);
    await this.logActivity(userId, 'UPDATE', moduleKey.toUpperCase(), `Bulk archived ${ids.length} records`, ip, ua);
  }

  async bulkRestore(moduleKey: string, ids: string[], userId: string, ip?: string, ua?: string) {
    const prismaModelName = this.getPrismaModelName(moduleKey);
    await this.repo.bulkRestore(prismaModelName, ids);
    await this.logActivity(userId, 'UPDATE', moduleKey.toUpperCase(), `Bulk restored/unarchived ${ids.length} records`, ip, ua);
  }

  async bulkAssignMentor(ids: string[], mentorId: string, userId: string, ip?: string, ua?: string) {
    if (!mentorId) throw new BadRequestException('Mentor ID is required');
    const mentor = await prisma.faculty.findUnique({ where: { id: mentorId } });
    if (!mentor) throw new NotFoundException('Mentor not found');

    for (const studentId of ids) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) continue;

      // 1. Mark existing active mentor assignments as HISTORIC
      await prisma.mentorAssignment.updateMany({
        where: { studentId, status: 'ACTIVE' },
        data: { status: 'HISTORIC' }
      });

      // 2. Update Student model
      await prisma.student.update({
        where: { id: studentId },
        data: { mentorId }
      });

      // 3. Log Mentor Assignment History
      await prisma.mentorAssignment.create({
        data: {
          mentorId,
          studentId,
          departmentId: student.departmentId,
          programId: student.programId,
          semesterId: student.semesterId,
          sectionId: student.sectionId,
          academicYearId: student.academicYearId,
          assignedBy: userId,
          status: 'ACTIVE'
        }
      });

      // 4. Notify Student
      try {
        await prisma.systemNotification.create({
          data: {
            title: 'Mentor Assigned',
            content: `You have been assigned to Mentor ${mentor.firstName} ${mentor.lastName}.`,
            type: 'ANNOUNCEMENT',
            status: 'SENT'
          }
        });
      } catch (err) {
        console.error('Failed to notify student', err);
      }

      // 5. Audit Log Entry
      await prisma.securityAuditLog.create({
        data: {
          action: 'MENTOR_ASSIGNMENT',
          module: 'STUDENTS',
          description: `Assigned student ${student.firstName} ${student.lastName} (${student.admissionNo}) to Mentor ${mentor.firstName} ${mentor.lastName}`,
          userId,
          ipAddress: ip || null,
          userAgent: ua || null
        }
      });
    }

    // 6. Notify Mentor
    try {
      await prisma.systemNotification.create({
        data: {
          title: 'Students Assigned',
          content: `You have been assigned ${ids.length} new student(s).`,
          type: 'ANNOUNCEMENT',
          status: 'SENT'
        }
      });
    } catch (err) {
      console.error('Failed to notify mentor', err);
    }
  }

  async bulkAssignDepartment(ids: string[], departmentId: string, userId: string, ip?: string, ua?: string) {
    if (!departmentId) throw new BadRequestException('Department ID is required');
    await prisma.student.updateMany({
      where: { id: { in: ids } },
      data: { departmentId }
    });
    await this.logActivity(userId, 'UPDATE', 'STUDENTS', `Bulk assigned department to ${ids.length} students`, ip, ua);
  }

  async bulkAssignSection(ids: string[], sectionId: string, userId: string, ip?: string, ua?: string) {
    if (!sectionId) throw new BadRequestException('Section ID is required');
    await prisma.student.updateMany({
      where: { id: { in: ids } },
      data: { sectionId }
    });
    await this.logActivity(userId, 'UPDATE', 'STUDENTS', `Bulk assigned section to ${ids.length} students`, ip, ua);
  }

  // ==========================================
  // HELPERS
  // ==========================================
  private getPrismaModelName(moduleKey: string): string {
    switch (moduleKey) {
      case 'students': return 'student';
      case 'faculty': return 'faculty';
      case 'attendance': return 'attendance';
      case 'exams': return 'exam';
      case 'marks': return 'mark';
      case 'fee-categories': return 'feeCategory';
      case 'fee-bills': return 'feeBill';
      case 'library': return 'libraryBook';
      case 'transport': return 'transportRoute';
      case 'hostel': return 'hostelBuilding';
      case 'tickets': return 'ticket';
      default: throw new Error(`Invalid enterprise module key: ${moduleKey}`);
    }
  }

  private async logActivity(userId: string, action: string, module: string, description: string, ip?: string, ua?: string) {
    try {
      await prisma.userActivityLog.create({
        data: {
          userId,
          action,
          module,
          description,
          ipAddress: ip || null,
          userAgent: ua || null,
        },
      });
    } catch (err) {
      console.error('Failed to write activity log:', err);
    }
  }

  async listCounselingRecords(user: any) {
    const faculty = await prisma.faculty.findFirst({ where: { userId: user.id } });
    if (!faculty) {
      return prisma.counselingRecord.findMany({
        include: { student: true, mentor: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    return prisma.counselingRecord.findMany({
      where: { mentorId: faculty.id },
      include: { student: true, mentor: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCounselingRecord(user: any, body: any) {
    const faculty = await prisma.faculty.findFirst({ where: { userId: user.id } });
    const { studentId, notes, actionTaken } = body;

    if (!studentId || !notes) {
      throw new BadRequestException('Student and counseling notes are required');
    }

    return prisma.counselingRecord.create({
      data: {
        studentId,
        mentorId: faculty ? faculty.id : (body.mentorId || 'SYSTEM'),
        notes,
        actionTaken: actionTaken || 'In Progress',
      },
      include: { student: true, mentor: true }
    });
  }

  // ==========================================
  // ENTERPRISE GLOBAL SEARCH WITH RBAC
  // ==========================================
  async globalSearch(query: string, user: UserPayload) {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim();

    const results: any[] = [];
    const role = user.role;

    // 1. Check Search Permissions
    const canSearchEveryone = [
      'Super Admin', 'College Admin', 'Principal', 'Vice Principal',
      'Academic Dean', 'Admission Dean', 'IQAC Dean'
    ].includes(role);

    // 2. Fetch User / Student / Faculty boundaries
    if (canSearchEveryone) {
      const [students, faculty, depts, circulars, sports] = await Promise.all([
        prisma.student.findMany({
          where: {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { admissionNo: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } }
            ]
          },
          take: 10
        }),
        prisma.faculty.findMany({
          where: {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { employeeId: { contains: q } },
              { email: { contains: q } }
            ]
          },
          take: 10
        }),
        prisma.department.findMany({
          where: {
            OR: [{ name: { contains: q } }, { code: { contains: q } }]
          },
          take: 5
        }),
        prisma.hodCircular.findMany({
          where: { title: { contains: q } },
          take: 5
        }),
        (prisma as any).sportsTournament.findMany({
          where: { title: { contains: q } },
          take: 5
        })
      ]);

      students.forEach(s => results.push({ id: s.id, type: 'STUDENT', title: `${s.firstName} ${s.lastName}`, subtitle: `Student (${s.admissionNo})`, link: `/students?id=${s.id}` }));
      faculty.forEach(f => results.push({ id: f.id, type: 'FACULTY', title: `${f.firstName} ${f.lastName}`, subtitle: `Faculty (${f.employeeId || 'EMP'})`, link: `/faculty?id=${f.id}` }));
      depts.forEach(d => results.push({ id: d.id, type: 'DEPARTMENT', title: d.name, subtitle: `Dept Code: ${d.code}`, link: `/academics?dept=${d.id}` }));
      circulars.forEach(c => results.push({ id: c.id, type: 'CIRCULAR', title: c.title, subtitle: 'Circular', link: `/circulars` }));
      sports.forEach((sp: any) => results.push({ id: sp.id, type: 'SPORTS', title: sp.title, subtitle: 'Sports Event', link: `/sports` }));
    } else if (role === 'HOD') {

      const facultyUser = await prisma.faculty.findFirst({ where: { userId: user.id } });
      const deptId = facultyUser?.departmentId;

      if (deptId) {
        const [students, faculty] = await Promise.all([
          prisma.student.findMany({
            where: {
              departmentId: deptId,
              OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { admissionNo: { contains: q } }]
            },
            take: 10
          }),
          prisma.faculty.findMany({
            where: {
              departmentId: deptId,
              OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { employeeId: { contains: q } }]
            },
            take: 10
          })
        ]);

        students.forEach(s => results.push({ id: s.id, type: 'STUDENT', title: `${s.firstName} ${s.lastName}`, subtitle: `Dept Student (${s.admissionNo})`, link: `/students?id=${s.id}` }));
        faculty.forEach(f => results.push({ id: f.id, type: 'FACULTY', title: `${f.firstName} ${f.lastName}`, subtitle: `Dept Faculty (${f.employeeId || 'EMP'})`, link: `/faculty?id=${f.id}` }));
      }
    } else if (role === 'Faculty' || role === 'Mentor') {
      const facultyUser = await prisma.faculty.findFirst({ where: { userId: user.id } });
      if (facultyUser) {
        const mentees = await prisma.student.findMany({
          where: {
            OR: [{ mentorId: facultyUser.id }, { facultyId: facultyUser.id }],
            AND: [{ OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { admissionNo: { contains: q } }] }]
          },
          take: 10
        });
        mentees.forEach(s => results.push({ id: s.id, type: 'STUDENT', title: `${s.firstName} ${s.lastName}`, subtitle: `Assigned Mentee (${s.admissionNo})`, link: `/students?id=${s.id}` }));
      }
    } else if (role === 'Student') {
      const student = await prisma.student.findFirst({ where: { userId: user.id } });
      if (student && (`${student.firstName} ${student.lastName}`.toLowerCase().includes(q.toLowerCase()) || student.admissionNo.toLowerCase().includes(q.toLowerCase()))) {
        results.push({ id: student.id, type: 'STUDENT', title: `${student.firstName} ${student.lastName}`, subtitle: `My Profile (${student.admissionNo})`, link: `/profile` });
      }
    } else if (role === 'Parent') {
      const children = await prisma.student.findMany({ where: { parentEmail: user.email } });
      children.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q.toLowerCase()) || c.admissionNo.toLowerCase().includes(q.toLowerCase()))
              .forEach(c => results.push({ id: c.id, type: 'STUDENT', title: `${c.firstName} ${c.lastName}`, subtitle: `Child Profile (${c.admissionNo})`, link: `/student-portal` }));
    }

    // 3. Search connected productivity and collaboration data through the same
    // active-workspace boundary. Every query below is constrained to records the
    // current user owns, receives, participates in, or may see by explicit scope.
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { departmentId: true },
    });
    const departmentId = userRecord?.departmentId || undefined;

    if (await FeatureFlags.isEnabled('MODULE_CAMPUS_WORKSPACE_ENABLED')) {
      const documents = await WorkspaceDocumentService.listDocuments(
        user.id,
        user.role,
        departmentId,
        { search: q }
      );
      [...documents.owned, ...documents.shared].slice(0, 10).forEach((document) => {
        const editor = WORKSPACE_DOCUMENT_PATHS[document.type] || 'docs';
        results.push({
          id: document.id,
          type: 'DOCUMENT',
          title: document.title,
          subtitle: `${document.type} · ${document.status}`,
          link: `/workspace/${editor}/${document.id}`,
        });
      });
    }

    if (await FeatureFlags.isEnabled('MODULE_GOVERNANCE_ENABLED')) {
      const tasks = await prisma.task.findMany({
        where: {
          title: { contains: q },
          OR: [
            { createdById: user.id },
            { assignees: { some: { assigneeId: user.id } } },
            { visibility: 'PUBLIC' },
            ...(departmentId ? [{ visibility: 'DEPARTMENT', departmentId }] : []),
          ],
        },
        select: { id: true, taskNumber: true, title: true, status: true, priority: true },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      });
      tasks.forEach((task) => results.push({
        id: task.id,
        type: 'TASK',
        title: task.title,
        subtitle: `${task.taskNumber} · ${task.status} · ${task.priority}`,
        link: '/tasks',
      }));
    }

    if (role === 'Student') {
      const events = await prisma.calendarEvent.findMany({
        where: {
          title: { contains: q },
          status: 'ACTIVE',
          OR: [
            { createdById: user.id },
            { visibility: 'PUBLIC', scope: 'INSTITUTION' },
            ...(departmentId ? [{ visibility: 'PUBLIC', scope: 'DEPARTMENT', departmentId }] : []),
          ],
        },
        select: { id: true, title: true, eventType: true, startDate: true },
        orderBy: { startDate: 'asc' },
        take: 8,
      });
      events.forEach((event) => results.push({
        id: event.id,
        type: 'CALENDAR',
        title: event.title,
        subtitle: `${event.eventType} · ${event.startDate.toISOString().slice(0, 10)}`,
        link: '/student/calendar',
      }));
    }

    const chatPath = resolveChatPath(role);
    if (chatPath) {
      const messages = await prisma.message.findMany({
        where: {
          content: { contains: q },
          deletedAt: null,
          conversation: { participants: { some: { userId: user.id } } },
        },
        select: {
          id: true,
          content: true,
          conversation: { select: { title: true } },
          sender: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      });
      messages.forEach((message) => results.push({
        id: message.id,
        type: 'MESSAGE',
        title: message.conversation.title || `${message.sender.firstName} ${message.sender.lastName}`,
        subtitle: message.content.length > 90 ? `${message.content.slice(0, 87)}…` : message.content,
        link: chatPath,
      }));
    }

    return results.slice(0, 40);
  }
}
