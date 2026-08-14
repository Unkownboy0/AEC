import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

const db = prisma as any;

export interface SlotConflictCheckResult {
  hasConflict: boolean;
  conflicts: Array<{
    type: 'FACULTY_DOUBLE_BOOKED' | 'SECTION_DOUBLE_BOOKED' | 'ROOM_DOUBLE_BOOKED' | 'FACULTY_ON_LEAVE' | 'CROSS_DEPT_CONFLICT';
    message: string;
    details: any;
  }>;
}

export interface SmartColumnMapping {
  facultyNameCol?: string;
  facultyIdCol?: string;
  courseCodeCol?: string;
  courseNameCol?: string;
  classCol?: string;
  sectionCol?: string;
  dayOfWeekCol?: string;
  periodCol?: string;
  startTimeCol?: string;
  endTimeCol?: string;
  roomCol?: string;
  slotTypeCol?: string;
}

export class HodTimetableService {
  /**
   * 1. Get Segregated Faculty Roster for HOD Timetable Management
   * Shows Home Department Faculty + Cross-Department Visiting Faculty
   */
  static async getDepartmentFacultyRoster(departmentId: string) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, name: true, code: true },
    });
    if (!department) throw new Error('Department not found');

    // A. Home Department Faculty
    const homeFaculty: any[] = await prisma.faculty.findMany({
      where: { departmentId, status: 'ACTIVE' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { firstName: 'asc' },
    });

    // B. Visiting Faculty (Cross-Department teaching assignments in this department)
    const activeAssignments = await db.facultyTeachingAssignment.findMany({
      where: {
        teachingDepartmentId: departmentId,
        status: 'ACTIVE',
      },
      include: {
        faculty: {
          include: {
            department: { select: { id: true, name: true, code: true } },
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        subject: true,
      },
    });

    // C. Also check faculty teaching slots in this department
    const visitingSlotFacultyIds = await db.timetableSlot.findMany({
      where: {
        departmentId,
        faculty: { departmentId: { not: departmentId } },
      },
      select: { facultyId: true },
      distinct: ['facultyId'],
    });

    const visitingFacultyFromSlots: any[] = await prisma.faculty.findMany({
      where: {
        id: { in: visitingSlotFacultyIds.map((s: any) => s.facultyId) },
        status: 'ACTIVE',
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // Map distinct visiting faculty
    const visitingMap = new Map<string, any>();
    for (const assign of activeAssignments) {
      if (assign.faculty && assign.faculty.departmentId !== departmentId) {
        visitingMap.set(assign.faculty.id, {
          ...assign.faculty,
          isVisiting: true,
          homeDepartment: assign.faculty.department,
          assignedSubject: assign.subject ? `${assign.subject.code} - ${assign.subject.name}` : undefined,
          teachingScope: 'CROSS_DEPARTMENT',
        });
      }
    }
    for (const fac of visitingFacultyFromSlots) {
      if (!visitingMap.has(fac.id)) {
        visitingMap.set(fac.id, {
          ...fac,
          isVisiting: true,
          homeDepartment: fac.department,
          teachingScope: 'CROSS_DEPARTMENT',
        });
      }
    }

    return {
      department,
      homeFaculty: homeFaculty.map(f => ({
        ...f,
        isVisiting: false,
        homeDepartment: f.department,
        teachingScope: 'HOME_DEPARTMENT',
      })),
      crossDepartmentFaculty: Array.from(visitingMap.values()),
      totalFacultyCount: homeFaculty.length + visitingMap.size,
    };
  }

  /**
   * 2. Institution-Wide Conflict Checker
   * Validates Faculty across ALL departments, Sections, Venues, and Leave/Duty records.
   */
  static async checkSlotConflicts(params: {
    facultyId: string;
    departmentId: string;
    academicYearId?: string;
    semesterId: string;
    sectionId: string;
    dayOfWeek: string;
    slotIndex: number;
    roomNo?: string;
    excludeSlotId?: string;
    revisionId?: string;
  }): Promise<SlotConflictCheckResult> {
    const conflicts: SlotConflictCheckResult['conflicts'] = [];
    const normalizedDay = params.dayOfWeek.toUpperCase().trim();

    // 1. Check Faculty Double-Booking across ENTIRE institution
    const facultySlotQuery: any = {
      facultyId: params.facultyId,
      dayOfWeek: normalizedDay,
      slotIndex: params.slotIndex,
      status: { in: ['ACTIVE', 'DRAFT'] },
    };
    if (params.excludeSlotId) {
      facultySlotQuery.id = { not: params.excludeSlotId };
    }
    if (params.revisionId) {
      facultySlotQuery.revisionId = params.revisionId;
    }

    const existingFacultySlots = await db.timetableSlot.findMany({
      where: facultySlotQuery,
      include: {
        department: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        faculty: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
    });

    for (const slot of existingFacultySlots) {
      const isCross = slot.departmentId !== params.departmentId;
      conflicts.push({
        type: isCross ? 'CROSS_DEPT_CONFLICT' : 'FACULTY_DOUBLE_BOOKED',
        message: `Faculty ${slot.faculty?.firstName || ''} ${slot.faculty?.lastName || ''} is already assigned on ${normalizedDay} Period ${params.slotIndex} in ${slot.department?.code || 'Department'} (${slot.section?.name || ''} - ${slot.subject?.code || ''})`,
        details: {
          slotId: slot.id,
          department: slot.department,
          section: slot.section,
          subject: slot.subject,
          roomNo: slot.roomNo,
        },
      });
    }

    // 2. Check Class/Section Double-Booking
    const sectionSlotQuery: any = {
      sectionId: params.sectionId,
      dayOfWeek: normalizedDay,
      slotIndex: params.slotIndex,
      status: { in: ['ACTIVE', 'DRAFT'] },
    };
    if (params.excludeSlotId) {
      sectionSlotQuery.id = { not: params.excludeSlotId };
    }
    if (params.revisionId) {
      sectionSlotQuery.revisionId = params.revisionId;
    }

    const existingSectionSlot = await db.timetableSlot.findFirst({
      where: sectionSlotQuery,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        faculty: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (existingSectionSlot) {
      conflicts.push({
        type: 'SECTION_DOUBLE_BOOKED',
        message: `This section already has ${existingSectionSlot.subject?.code || 'a course'} scheduled on ${normalizedDay} Period ${params.slotIndex} with ${existingSectionSlot.faculty?.firstName || 'faculty'}.`,
        details: existingSectionSlot,
      });
    }

    // 3. Check Room/Venue Double-Booking (if specified)
    if (params.roomNo && params.roomNo.trim().length > 0) {
      const roomQuery: any = {
        roomNo: params.roomNo.trim(),
        dayOfWeek: normalizedDay,
        slotIndex: params.slotIndex,
        status: { in: ['ACTIVE', 'DRAFT'] },
      };
      if (params.excludeSlotId) {
        roomQuery.id = { not: params.excludeSlotId };
      }
      if (params.revisionId) {
        roomQuery.revisionId = params.revisionId;
      }

      const existingRoomSlot = await db.timetableSlot.findFirst({
        where: roomQuery,
        include: {
          department: { select: { id: true, code: true } },
          section: { select: { id: true, name: true } },
          subject: { select: { id: true, code: true } },
        },
      });

      if (existingRoomSlot) {
        conflicts.push({
          type: 'ROOM_DOUBLE_BOOKED',
          message: `Venue ${params.roomNo} is already booked on ${normalizedDay} Period ${params.slotIndex} by ${existingRoomSlot.department?.code || ''} ${existingRoomSlot.section?.name || ''}.`,
          details: existingRoomSlot,
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  /**
   * 3. Smart Parser & Column Mapper for XLSX / CSV Timetable Import
   */
  static async parseAndMapTimetable(params: {
    rawRows: Array<Record<string, any>>;
    sourceFileName: string;
    departmentId: string;
    academicYearId: string;
    semesterId: string;
    uploadedById: string;
    customMapping?: SmartColumnMapping;
  }) {
    const { rawRows, sourceFileName, departmentId, academicYearId, semesterId, uploadedById, customMapping } = params;

    if (!rawRows || rawRows.length === 0) {
      throw new Error('Uploaded file does not contain any data rows.');
    }

    // A. Detect / Build Column Mappings
    const headers = Object.keys(rawRows[0] || {});
    const mapping: SmartColumnMapping = {
      facultyNameCol: customMapping?.facultyNameCol || headers.find(h => /faculty\s*name|staff\s*name|faculty|staff|employee/i.test(h)),
      facultyIdCol: customMapping?.facultyIdCol || headers.find(h => /faculty\s*id|staff\s*id|emp\s*id|employee\s*id/i.test(h)),
      courseCodeCol: customMapping?.courseCodeCol || headers.find(h => /course\s*code|sub\s*code|subject\s*code|code/i.test(h)),
      courseNameCol: customMapping?.courseNameCol || headers.find(h => /course\s*name|subject\s*name|course|subject|title/i.test(h)),
      classCol: customMapping?.classCol || headers.find(h => /class|year|degree|programme|branch/i.test(h)),
      sectionCol: customMapping?.sectionCol || headers.find(h => /section|sec/i.test(h)),
      dayOfWeekCol: customMapping?.dayOfWeekCol || headers.find(h => /day|weekday|day\s*of\s*week/i.test(h)),
      periodCol: customMapping?.periodCol || headers.find(h => /period|hour|slot|period\s*number/i.test(h)),
      startTimeCol: customMapping?.startTimeCol || headers.find(h => /start\s*time|from/i.test(h)),
      endTimeCol: customMapping?.endTimeCol || headers.find(h => /end\s*time|to/i.test(h)),
      roomCol: customMapping?.roomCol || headers.find(h => /room|venue|hall|location/i.test(h)),
      slotTypeCol: customMapping?.slotTypeCol || headers.find(h => /type|slot\s*type|theory\s*\/\s*lab/i.test(h)),
    };

    // B. Fetch Institutional Cache for Fuzzy Matching
    const allFaculty = await prisma.faculty.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, employeeId: true, firstName: true, lastName: true, departmentId: true },
    });
    const allSubjects = await prisma.subject.findMany({
      select: { id: true, code: true, name: true, isLab: true, departmentId: true },
    });
    let allSections = await prisma.section.findMany({
      where: { departmentId, ...(semesterId ? { semesterId } : {}) },
      select: { id: true, name: true, room: true },
    });
    if (allSections.length === 0) {
      allSections = await prisma.section.findMany({
        where: { departmentId },
        select: { id: true, name: true, room: true },
      });
    }

    const parsedRows: any[] = [];
    const errors: any[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let conflictCount = 0;

    // Standard period timings bell schedule
    const defaultPeriodTimings: Record<number, { start: string; end: string }> = {
      1: { start: '09:00', end: '09:50' },
      2: { start: '09:50', end: '10:40' },
      3: { start: '11:00', end: '11:50' },
      4: { start: '11:50', end: '12:40' },
      5: { start: '01:30', end: '02:20' },
      6: { start: '02:20', end: '03:10' },
      7: { start: '03:20', end: '04:10' },
      8: { start: '04:10', end: '05:00' },
    };

    // Helper: Normalized day string
    const parseDayOfWeek = (val: string): string | null => {
      if (!val) return null;
      const v = String(val).toUpperCase().trim();
      if (v.startsWith('MON')) return 'MONDAY';
      if (v.startsWith('TUE')) return 'TUESDAY';
      if (v.startsWith('WED')) return 'WEDNESDAY';
      if (v.startsWith('THU')) return 'THURSDAY';
      if (v.startsWith('FRI')) return 'FRIDAY';
      if (v.startsWith('SAT')) return 'SATURDAY';
      return null;
    };

    // Helper: Period number
    const parsePeriod = (val: any): number => {
      if (typeof val === 'number') return val;
      const match = String(val).match(/\d+/);
      return match ? parseInt(match[0], 10) : 1;
    };

    // Process each row
    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 1;
      const rowErrors: string[] = [];
      const rowWarnings: string[] = [];

      // 1. Resolve Day & Period
      const rawDay = mapping.dayOfWeekCol ? row[mapping.dayOfWeekCol] : row['Day'] || row['Weekday'];
      const dayOfWeek = parseDayOfWeek(rawDay);
      if (!dayOfWeek) {
        rowErrors.push(`Invalid or missing Day of Week: "${rawDay}"`);
      }

      const rawPeriod = mapping.periodCol ? row[mapping.periodCol] : row['Period'] || row['Hour'] || 1;
      const periodNumber = parsePeriod(rawPeriod);
      if (periodNumber < 1 || periodNumber > 8) {
        rowErrors.push(`Period ${periodNumber} is outside valid bell schedule (1-8)`);
      }

      const startTime = (mapping.startTimeCol && row[mapping.startTimeCol]) || defaultPeriodTimings[periodNumber]?.start || '09:00';
      const endTime = (mapping.endTimeCol && row[mapping.endTimeCol]) || defaultPeriodTimings[periodNumber]?.end || '09:50';

      // 2. Resolve Faculty (by ID or Fuzzy Name)
      const rawFacultyId = mapping.facultyIdCol ? String(row[mapping.facultyIdCol] || '').trim() : '';
      const rawFacultyName = mapping.facultyNameCol ? String(row[mapping.facultyNameCol] || '').trim() : '';
      let matchedFaculty: any = null;
      let possibleFacultyMatches: any[] = [];

      if (rawFacultyId) {
        matchedFaculty = allFaculty.find(f => f.employeeId?.toLowerCase() === rawFacultyId.toLowerCase());
      }
      if (!matchedFaculty && rawFacultyName) {
        // Exact name match
        matchedFaculty = allFaculty.find(f =>
          `${f.firstName} ${f.lastName}`.toLowerCase() === rawFacultyName.toLowerCase() ||
          f.firstName.toLowerCase() === rawFacultyName.toLowerCase() ||
          f.lastName.toLowerCase() === rawFacultyName.toLowerCase()
        );
        // Partial/Fuzzy candidates
        if (!matchedFaculty) {
          possibleFacultyMatches = allFaculty.filter(f =>
            `${f.firstName} ${f.lastName}`.toLowerCase().includes(rawFacultyName.toLowerCase()) ||
            rawFacultyName.toLowerCase().includes(f.firstName.toLowerCase())
          ).slice(0, 3);
        }
      }

      if (!matchedFaculty) {
        rowErrors.push(`Unknown faculty "${rawFacultyName || rawFacultyId}". ${possibleFacultyMatches.length > 0 ? `Suggestions: ${possibleFacultyMatches.map(m => `${m.firstName} (${m.employeeId})`).join(', ')}` : 'Please select/add faculty.'}`);
      }

      // 3. Resolve Subject / Course
      const rawCourseCode = mapping.courseCodeCol ? String(row[mapping.courseCodeCol] || '').trim() : '';
      const rawCourseName = mapping.courseNameCol ? String(row[mapping.courseNameCol] || '').trim() : '';
      let matchedSubject: any = null;
      let possibleSubjectMatches: any[] = [];

      if (rawCourseCode) {
        matchedSubject = allSubjects.find(s => s.code.toLowerCase() === rawCourseCode.toLowerCase());
      }
      if (!matchedSubject && rawCourseName) {
        matchedSubject = allSubjects.find(s => s.name.toLowerCase() === rawCourseName.toLowerCase() || s.code.toLowerCase() === rawCourseName.toLowerCase());
        if (!matchedSubject) {
          possibleSubjectMatches = allSubjects.filter(s => s.name.toLowerCase().includes(rawCourseName.toLowerCase()) || s.code.toLowerCase().includes(rawCourseName.toLowerCase())).slice(0, 3);
        }
      }

      if (!matchedSubject) {
        rowErrors.push(`Unknown course "${rawCourseCode || rawCourseName}". ${possibleSubjectMatches.length > 0 ? `Suggestions: ${possibleSubjectMatches.map(s => `${s.code} - ${s.name}`).join(', ')}` : 'Please assign valid course.'}`);
      }

      // 4. Resolve Section
      const rawSec = mapping.sectionCol ? String(row[mapping.sectionCol] || '').trim() : '';
      let matchedSection = allSections.find(s => s.name.toLowerCase() === rawSec.toLowerCase() || s.name.toLowerCase() === `section ${rawSec}`.toLowerCase());
      if (!matchedSection && allSections.length > 0) {
        matchedSection = allSections[0]; // fallback to first section in department if single
      }
      if (!matchedSection) {
        rowErrors.push(`Section "${rawSec}" not found in this department.`);
      }

      // 5. Room / Slot Type
      const roomNo = mapping.roomCol && row[mapping.roomCol] ? String(row[mapping.roomCol]).trim() : (matchedSection?.room || 'D101');
      const rawSlotType = mapping.slotTypeCol && row[mapping.slotTypeCol] ? String(row[mapping.slotTypeCol]).toUpperCase().trim() : '';
      const isLab = matchedSubject?.isLab || /lab|practical/i.test(rawSlotType) || /lab/i.test(rawCourseName);
      const slotType = isLab ? 'LAB' : (/tutorial/i.test(rawSlotType) ? 'TUTORIAL' : (/mentor/i.test(rawSlotType) ? 'MENTOR' : 'THEORY'));

      // Check Cross-Department Flag
      const isCrossDepartment = matchedFaculty && matchedFaculty.departmentId !== departmentId;
      if (isCrossDepartment) {
        rowWarnings.push(`Cross-Department Faculty: ${matchedFaculty.firstName} belongs to another department.`);
      }

      const parsedRow = {
        rowIndex: index,
        rowNumber: rowNum,
        rawRow: row,
        dayOfWeek,
        periodNumber,
        startTime,
        endTime,
        facultyId: matchedFaculty?.id || null,
        facultyName: matchedFaculty ? `${matchedFaculty.firstName} ${matchedFaculty.lastName}` : rawFacultyName,
        facultyEmployeeId: matchedFaculty?.employeeId || rawFacultyId,
        isCrossDepartment,
        possibleFacultyMatches,
        subjectId: matchedSubject?.id || null,
        subjectCode: matchedSubject?.code || rawCourseCode,
        subjectName: matchedSubject?.name || rawCourseName,
        possibleSubjectMatches,
        sectionId: matchedSection?.id || null,
        sectionName: matchedSection?.name || rawSec,
        roomNo,
        isLab,
        slotType,
        status: rowErrors.length > 0 ? 'ERROR' : (rowWarnings.length > 0 ? 'WARNING' : 'VALID'),
        errors: rowErrors,
        warnings: rowWarnings,
      };

      // Conflict Check if row is syntactically valid so far
      if (rowErrors.length === 0 && matchedFaculty && matchedSection && dayOfWeek) {
        const conflictRes = await this.checkSlotConflicts({
          facultyId: matchedFaculty.id,
          departmentId,
          academicYearId,
          semesterId,
          sectionId: matchedSection.id,
          dayOfWeek,
          slotIndex: periodNumber,
          roomNo,
        });

        if (conflictRes.hasConflict) {
          conflictCount += conflictRes.conflicts.length;
          parsedRow.status = 'CONFLICT';
          parsedRow.errors.push(...conflictRes.conflicts.map(c => `[Conflict] ${c.message}`));
        }
      }

      if (parsedRow.status === 'VALID') validCount++;
      else if (parsedRow.status === 'WARNING') warningCount++;
      else errorCount++;

      parsedRows.push(parsedRow);
      if (rowErrors.length > 0 || parsedRow.status === 'CONFLICT') {
        errors.push({ rowNumber: rowNum, errors: parsedRow.errors });
      }
    }

    // Save Batch Record in DB
    const importBatch = await db.timetableImportBatch.create({
      data: {
        departmentId,
        academicYearId,
        semesterId,
        sourceFileName,
        fileType: sourceFileName.endsWith('.csv') ? 'CSV' : 'XLSX',
        totalRows: rawRows.length,
        validRows: validCount,
        warningRows: warningCount,
        errorRows: errorCount,
        conflictRows: conflictCount,
        mappingJson: JSON.stringify(mapping),
        parsedRowsJson: JSON.stringify(parsedRows),
        errorsJson: JSON.stringify(errors),
        status: errorCount === 0 && conflictCount === 0 ? 'VALIDATED' : 'MAPPED',
        uploadedById,
      },
    });

    logger.info(`[TimetableImport] Parsed batch ${importBatch.id}: ${validCount} valid, ${errorCount} errors, ${conflictCount} conflicts.`);

    return {
      batchId: importBatch.id,
      summary: {
        totalRows: rawRows.length,
        validRows: validCount,
        warningRows: warningCount,
        errorRows: errorCount,
        conflictRows: conflictCount,
        isReadyForDraft: errorCount === 0 && conflictCount === 0,
      },
      mapping,
      parsedRows,
      errors,
    };
  }

  /**
   * 4. In-App Inline Correction of Imported Rows
   */
  static async correctImportRowAndRevalidate(batchId: string, rowIndex: number, corrections: {
    facultyId?: string;
    subjectId?: string;
    sectionId?: string;
    dayOfWeek?: string;
    periodNumber?: number;
    roomNo?: string;
    slotType?: string;
  }) {
    const batch = await db.timetableImportBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error('Import batch not found');

    const parsedRows: any[] = JSON.parse(batch.parsedRowsJson || '[]');
    if (rowIndex < 0 || rowIndex >= parsedRows.length) {
      throw new Error('Invalid row index');
    }

    const row = parsedRows[rowIndex];

    // Apply corrections
    if (corrections.facultyId) {
      const fac = await prisma.faculty.findUnique({ where: { id: corrections.facultyId } });
      if (fac) {
        row.facultyId = fac.id;
        row.facultyName = `${fac.firstName} ${fac.lastName}`;
        row.facultyEmployeeId = fac.employeeId;
        row.isCrossDepartment = fac.departmentId !== batch.departmentId;
      }
    }
    if (corrections.subjectId) {
      const sub = await prisma.subject.findUnique({ where: { id: corrections.subjectId } });
      if (sub) {
        row.subjectId = sub.id;
        row.subjectCode = sub.code;
        row.subjectName = sub.name;
        row.isLab = sub.isLab;
      }
    }
    if (corrections.sectionId) {
      const sec = await prisma.section.findUnique({ where: { id: corrections.sectionId } });
      if (sec) {
        row.sectionId = sec.id;
        row.sectionName = sec.name;
      }
    }
    if (corrections.dayOfWeek) row.dayOfWeek = corrections.dayOfWeek.toUpperCase().trim();
    if (corrections.periodNumber) row.periodNumber = corrections.periodNumber;
    if (corrections.roomNo) row.roomNo = corrections.roomNo.trim();
    if (corrections.slotType) row.slotType = corrections.slotType;

    // Clear previous errors & revalidate
    row.errors = [];
    row.warnings = [];

    if (!row.facultyId) row.errors.push('Faculty selection required');
    if (!row.subjectId) row.errors.push('Course selection required');
    if (!row.sectionId) row.errors.push('Section selection required');
    if (!row.dayOfWeek) row.errors.push('Day of Week required');

    if (row.errors.length === 0) {
      const conflictRes = await this.checkSlotConflicts({
        facultyId: row.facultyId,
        departmentId: batch.departmentId,
        academicYearId: batch.academicYearId,
        semesterId: batch.semesterId,
        sectionId: row.sectionId,
        dayOfWeek: row.dayOfWeek,
        slotIndex: row.periodNumber,
        roomNo: row.roomNo,
      });

      if (conflictRes.hasConflict) {
        row.status = 'CONFLICT';
        row.errors.push(...conflictRes.conflicts.map(c => `[Conflict] ${c.message}`));
      } else {
        row.status = row.warnings.length > 0 ? 'WARNING' : 'VALID';
      }
    } else {
      row.status = 'ERROR';
    }

    parsedRows[rowIndex] = row;

    // Recalculate totals
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let conflictCount = 0;
    const newErrors: any[] = [];

    for (const r of parsedRows) {
      if (r.status === 'VALID') validCount++;
      else if (r.status === 'WARNING') warningCount++;
      else if (r.status === 'CONFLICT') conflictCount++;
      else errorCount++;

      if (r.errors && r.errors.length > 0) {
        newErrors.push({ rowNumber: r.rowNumber, errors: r.errors });
      }
    }

    await db.timetableImportBatch.update({
      where: { id: batchId },
      data: {
        validRows: validCount,
        warningRows: warningCount,
        errorRows: errorCount,
        conflictRows: conflictCount,
        parsedRowsJson: JSON.stringify(parsedRows),
        errorsJson: JSON.stringify(newErrors),
        status: (errorCount === 0 && conflictCount === 0) ? 'VALIDATED' : 'MAPPED',
      },
    });

    return {
      updatedRow: row,
      summary: {
        totalRows: parsedRows.length,
        validRows: validCount,
        warningRows: warningCount,
        errorRows: errorCount,
        conflictRows: conflictCount,
        isReadyForDraft: errorCount === 0 && conflictCount === 0,
      },
    };
  }

  /**
   * 5. Save Validated Import Batch as Draft Timetable Slots
   */
  static async saveImportBatchAsDraft(batchId: string, userId: string) {
    const batch = await db.timetableImportBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error('Import batch not found');

    const parsedRows: any[] = JSON.parse(batch.parsedRowsJson || '[]');
    const invalidRows = parsedRows.filter(r => r.status === 'ERROR' || r.status === 'CONFLICT');
    if (invalidRows.length > 0) {
      throw new Error(`Cannot save draft: ${invalidRows.length} rows have unresolved errors or conflicts.`);
    }

    // Find or create Draft Revision
    let draftRevision = await db.timetableRevision.findFirst({
      where: {
        departmentId: batch.departmentId,
        academicYearId: batch.academicYearId,
        semesterId: batch.semesterId,
        status: 'DRAFT',
      },
    });

    if (!draftRevision) {
      const latestRev = await db.timetableRevision.findFirst({
        where: {
          departmentId: batch.departmentId,
          academicYearId: batch.academicYearId,
          semesterId: batch.semesterId,
        },
        orderBy: { revisionNumber: 'desc' },
      });
      const nextRevNo = (latestRev?.revisionNumber ?? -1) + 1;
      draftRevision = await db.timetableRevision.create({
        data: {
          departmentId: batch.departmentId,
          academicYearId: batch.academicYearId,
          semesterId: batch.semesterId,
          revisionNumber: nextRevNo,
          revisionCode: `REV-${String(nextRevNo).padStart(2, '0')}`,
          status: 'DRAFT',
          changeSummary: `Draft created from import: ${batch.sourceFileName}`,
        },
      });
    }

    // Delete existing draft slots in this revision to replace with new batch
    await db.timetableSlot.deleteMany({
      where: {
        revisionId: draftRevision.id,
      },
    });

    // Create Draft Slots
    const createdSlots: any[] = [];
    for (const r of parsedRows) {
      const slot = await db.timetableSlot.create({
        data: {
          departmentId: batch.departmentId,
          academicYearId: batch.academicYearId,
          semesterId: batch.semesterId,
          sectionId: r.sectionId,
          subjectId: r.subjectId,
          facultyId: r.facultyId,
          dayOfWeek: r.dayOfWeek,
          slotIndex: r.periodNumber,
          startTime: r.startTime,
          endTime: r.endTime,
          roomNo: r.roomNo,
          isLab: r.isLab,
          slotType: r.slotType,
          revisionId: draftRevision.id,
          status: 'DRAFT',
        },
      });
      createdSlots.push(slot);
    }

    // Link revision to batch
    await db.timetableImportBatch.update({
      where: { id: batchId },
      data: {
        revisionId: draftRevision.id,
        status: 'DRAFT_SAVED',
      },
    });

    logger.info(`[TimetableDraft] Created ${createdSlots.length} draft slots in revision ${draftRevision.revisionCode}`);

    return {
      revision: draftRevision,
      createdSlotCount: createdSlots.length,
    };
  }

  /**
   * 6. Compare Old Published vs New Timetable (Diff Engine)
   */
  static async compareTimetables(oldRevisionId: string, newRevisionId: string) {
    const [oldSlots, newSlots] = await Promise.all([
      db.timetableSlot.findMany({
        where: { revisionId: oldRevisionId },
        include: {
          subject: { select: { code: true, name: true } },
          faculty: { select: { firstName: true, lastName: true, employeeId: true } },
          section: { select: { name: true } },
        },
      }),
      db.timetableSlot.findMany({
        where: { revisionId: newRevisionId },
        include: {
          subject: { select: { code: true, name: true } },
          faculty: { select: { firstName: true, lastName: true, employeeId: true } },
          section: { select: { name: true } },
        },
      }),
    ]);

    const oldMap = new Map<string, any>();
    for (const s of oldSlots) {
      const secKey = s.section?.name || s.sectionId;
      const key = `${secKey}-${s.dayOfWeek.toUpperCase()}-${s.slotIndex}`;
      oldMap.set(key, s);
    }

    const newMap = new Map<string, any>();
    for (const s of newSlots) {
      const secKey = s.section?.name || s.sectionId;
      const key = `${secKey}-${s.dayOfWeek.toUpperCase()}-${s.slotIndex}`;
      newMap.set(key, s);
    }

    const added: any[] = [];
    const removed: any[] = [];
    const modified: any[] = [];
    const unchanged: any[] = [];

    for (const [key, newSlot] of newMap.entries()) {
      if (!oldMap.has(key)) {
        added.push({
          key,
          dayOfWeek: newSlot.dayOfWeek,
          periodNumber: newSlot.slotIndex,
          section: newSlot.section?.name,
          subject: newSlot.subject?.code,
          faculty: `${newSlot.faculty?.firstName} ${newSlot.faculty?.lastName}`,
          roomNo: newSlot.roomNo,
        });
      } else {
        const oldSlot = oldMap.get(key);
        const facultyChanged = oldSlot.facultyId !== newSlot.facultyId;
        const subjectChanged = oldSlot.subjectId !== newSlot.subjectId;
        const roomChanged = oldSlot.roomNo !== newSlot.roomNo;

        if (facultyChanged || subjectChanged || roomChanged) {
          modified.push({
            key,
            dayOfWeek: newSlot.dayOfWeek,
            periodNumber: newSlot.slotIndex,
            section: newSlot.section?.name,
            old: {
              subject: oldSlot.subject?.code,
              faculty: `${oldSlot.faculty?.firstName} ${oldSlot.faculty?.lastName}`,
              roomNo: oldSlot.roomNo,
            },
            new: {
              subject: newSlot.subject?.code,
              faculty: `${newSlot.faculty?.firstName} ${newSlot.faculty?.lastName}`,
              roomNo: newSlot.roomNo,
            },
            changes: { facultyChanged, subjectChanged, roomChanged },
          });
        } else {
          unchanged.push(key);
        }
      }
    }

    for (const [key, oldSlot] of oldMap.entries()) {
      if (!newMap.has(key)) {
        removed.push({
          key,
          dayOfWeek: oldSlot.dayOfWeek,
          periodNumber: oldSlot.slotIndex,
          section: oldSlot.section?.name,
          subject: oldSlot.subject?.code,
          faculty: `${oldSlot.faculty?.firstName} ${oldSlot.faculty?.lastName}`,
          roomNo: oldSlot.roomNo,
        });
      }
    }

    return {
      totalOldSlots: oldSlots.length,
      totalNewSlots: newSlots.length,
      added,
      removed,
      modified,
      unchangedCount: unchanged.length,
    };
  }

  /**
   * 7. Publish Department Timetable Revision with Effective Date (W.E.F.)
   * Historical Timetable Preservation: Old revisions are SUPERSEDED, not destroyed.
   */
  static async publishTimetableRevision(params: {
    revisionId: string;
    effectiveFrom: Date;
    changeSummary?: string;
    publishedById: string;
  }) {
    const { revisionId, effectiveFrom, changeSummary, publishedById } = params;

    const revision = await db.timetableRevision.findUnique({
      where: { id: revisionId },
      include: { slots: true },
    });
    if (!revision) throw new Error('Timetable revision not found');

    if (!revision.slots || revision.slots.length === 0) {
      throw new Error('Cannot publish an empty timetable revision.');
    }

    // 1. Check if there is an existing published revision
    const existingPublished = await db.timetableRevision.findFirst({
      where: {
        departmentId: revision.departmentId,
        academicYearId: revision.academicYearId,
        semesterId: revision.semesterId,
        status: 'PUBLISHED',
        id: { not: revision.id },
      },
    });

    let diffSnapshot = {};
    if (existingPublished) {
      diffSnapshot = await this.compareTimetables(existingPublished.id, revision.id);
      // Mark existing as SUPERSEDED
      await db.timetableRevision.update({
        where: { id: existingPublished.id },
        data: { status: 'SUPERSEDED' },
      });
      // Archive old slots
      await db.timetableSlot.updateMany({
        where: { revisionId: existingPublished.id },
        data: { status: 'SUPERSEDED' },
      });
    }

    // 2. Mark this revision as PUBLISHED
    const updatedRevision = await db.timetableRevision.update({
      where: { id: revision.id },
      data: {
        status: 'PUBLISHED',
        effectiveFrom: new Date(effectiveFrom),
        publishedById,
        publishedAt: new Date(),
        changeSummary: changeSummary || (existingPublished ? `Published revision ${revision.revisionCode} w.e.f ${new Date(effectiveFrom).toLocaleDateString()}` : `Initial official publish ${revision.revisionCode}`),
        comparisonDiff: JSON.stringify(diffSnapshot),
      },
    });

    // 3. Activate all slots in this revision for live operational usage
    await db.timetableSlot.updateMany({
      where: { revisionId: revision.id },
      data: { status: 'ACTIVE' },
    });

    logger.info(`[TimetablePublish] Revision ${revision.revisionCode} published for department ${revision.departmentId} w.e.f ${effectiveFrom}`);

    return {
      revision: updatedRevision,
      supersededRevision: existingPublished ? { id: existingPublished.id, revisionCode: existingPublished.revisionCode } : null,
      activeSlotCount: revision.slots.length,
      effectiveFrom,
    };
  }

  /**
   * 8. Master Timetable Matrix Generator (By Class / Faculty / Room)
   */
  static async getDepartmentMasterTimetable(params: {
    departmentId: string;
    academicYearId?: string;
    semesterId?: string;
    revisionId?: string;
  }) {
    const { departmentId, academicYearId, semesterId, revisionId } = params;

    let targetRevisionId = revisionId;
    if (!targetRevisionId) {
      const activeRevision = await db.timetableRevision.findFirst({
        where: {
          departmentId,
          ...(academicYearId ? { academicYearId } : {}),
          ...(semesterId ? { semesterId } : {}),
          status: 'PUBLISHED',
        },
        orderBy: { revisionNumber: 'desc' },
      });
      targetRevisionId = activeRevision?.id;
    }

    const slotWhere: any = {
      departmentId,
      ...(academicYearId ? { academicYearId } : {}),
      ...(semesterId ? { semesterId } : {}),
    };
    if (targetRevisionId) {
      slotWhere.revisionId = targetRevisionId;
    } else {
      slotWhere.status = 'ACTIVE';
    }

    const slots = await db.timetableSlot.findMany({
      where: slotWhere,
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true, employeeId: true, departmentId: true } },
        subject: { select: { id: true, code: true, name: true, isLab: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }],
    });

    // Groupings
    const byClass: Record<string, any> = {};
    const byFaculty: Record<string, any> = {};
    const byRoom: Record<string, any> = {};

    for (const slot of slots) {
      // By Class
      const classKey = slot.section?.name || 'General';
      if (!byClass[classKey]) byClass[classKey] = {};
      if (!byClass[classKey][slot.dayOfWeek]) byClass[classKey][slot.dayOfWeek] = {};
      byClass[classKey][slot.dayOfWeek][slot.slotIndex] = slot;

      // By Faculty
      const facultyKey = slot.faculty ? `${slot.faculty.firstName} ${slot.faculty.lastName} (${slot.faculty.employeeId})` : 'Unassigned';
      if (!byFaculty[facultyKey]) byFaculty[facultyKey] = { faculty: slot.faculty, grid: {} };
      if (!byFaculty[facultyKey].grid[slot.dayOfWeek]) byFaculty[facultyKey].grid[slot.dayOfWeek] = {};
      byFaculty[facultyKey].grid[slot.dayOfWeek][slot.slotIndex] = slot;

      // By Room
      const roomKey = slot.roomNo || 'Unassigned';
      if (!byRoom[roomKey]) byRoom[roomKey] = {};
      if (!byRoom[roomKey][slot.dayOfWeek]) byRoom[roomKey][slot.dayOfWeek] = {};
      byRoom[roomKey][slot.dayOfWeek][slot.slotIndex] = slot;
    }

    return {
      revisionId: targetRevisionId,
      totalSlots: slots.length,
      byClass,
      byFaculty,
      byRoom,
      slots,
    };
  }

  /**
   * 9. Automatic Faculty Workload Calculation
   */
  static async calculateFacultyWorkload(facultyId: string, revisionId?: string) {
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { department: { select: { id: true, code: true, name: true } } },
    });
    if (!faculty) throw new Error('Faculty not found');

    const slotWhere: any = { facultyId };
    if (revisionId) {
      slotWhere.revisionId = revisionId;
    } else {
      slotWhere.status = 'ACTIVE';
    }

    const slots = await db.timetableSlot.findMany({
      where: slotWhere,
      include: {
        subject: { select: { id: true, code: true, name: true, isLab: true } },
        department: { select: { id: true, code: true, name: true } },
      },
    });

    let theoryHours = 0;
    let labHours = 0;
    let tutorialHours = 0;
    let mentorHours = 0;
    let projectHours = 0;
    const departmentSplit: Record<string, number> = {};

    for (const slot of slots) {
      const type = (slot.slotType || 'THEORY').toUpperCase();
      if (type === 'LAB' || slot.isLab) labHours++;
      else if (type === 'TUTORIAL') tutorialHours++;
      else if (type === 'MENTOR') mentorHours++;
      else if (type === 'MINI_PROJECT' || type === 'PROJECT') projectHours++;
      else theoryHours++;

      const deptCode = slot.department?.code || 'OTHER';
      departmentSplit[deptCode] = (departmentSplit[deptCode] || 0) + 1;
    }

    const totalHours = theoryHours + labHours + tutorialHours + mentorHours + projectHours;

    return {
      facultyId,
      facultyName: `${faculty.firstName} ${faculty.lastName}`,
      designation: faculty.designation,
      homeDepartment: faculty.department,
      breakdown: {
        theoryHours,
        labHours,
        tutorialHours,
        mentorHours,
        projectHours,
        totalHours,
      },
      departmentSplit,
      totalSlots: slots.length,
    };
  }

  /**
   * 10. Official Institutional Print Data (AEC Faculty Timetable A5c)
   */
  static async getOfficialFacultyPrintData(facultyId: string, revisionId?: string) {
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { department: true },
    });
    if (!faculty) throw new Error('Faculty not found');

    let revision: any = null;
    if (revisionId) {
      revision = await db.timetableRevision.findUnique({ where: { id: revisionId } });
    } else {
      revision = await db.timetableRevision.findFirst({
        where: { departmentId: faculty.departmentId, status: 'PUBLISHED' },
        orderBy: { revisionNumber: 'desc' },
      });
    }

    const workload = await this.calculateFacultyWorkload(facultyId, revision?.id);
    let slots = await db.timetableSlot.findMany({
      where: {
        facultyId,
        ...(revision ? { revisionId: revision.id } : { status: 'ACTIVE' }),
      },
      include: {
        subject: true,
        section: true,
        department: true,
      },
    });

    if (slots.length === 0) {
      slots = await db.timetableSlot.findMany({
        where: {
          facultyId,
          status: 'ACTIVE',
        },
        include: {
          subject: true,
          section: true,
          department: true,
        },
      });
    }

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    const weeklyGrid: Record<string, Record<number, any>> = {};
    for (const d of days) {
      weeklyGrid[d] = {};
      for (const p of periods) {
        weeklyGrid[d][p] = null;
      }
    }

    for (const slot of slots) {
      const day = slot.dayOfWeek.toUpperCase();
      if (weeklyGrid[day]) {
        weeklyGrid[day][slot.slotIndex] = {
          subjectCode: slot.subject?.code || '',
          subjectName: slot.subject?.name || '',
          classSection: slot.section?.name || '',
          departmentCode: slot.department?.code || '',
          roomNo: slot.roomNo || '',
          isLab: slot.isLab,
          slotType: slot.slotType,
        };
      }
    }

    return {
      institutionHeader: {
        collegeName: 'AEC',
        title: 'FACULTY TIMETABLE',
        formatCode: 'A5c',
        academicYear: revision?.academicYearId || '2026-2027',
        semester: 'ODD SEMESTER',
        revisionCode: revision?.revisionCode || 'REV-00',
        wefDate: revision?.effectiveFrom ? new Date(revision.effectiveFrom).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      },
      facultyDetails: {
        name: `${faculty.firstName} ${faculty.lastName}`,
        designation: faculty.designation || 'Assistant Professor',
        department: faculty.department.name,
        departmentCode: faculty.department.code,
        employeeId: faculty.employeeId,
      },
      weeklyGrid,
      workload: workload.breakdown,
      departmentSplit: workload.departmentSplit,
      signatures: {
        facultySignature: 'Faculty',
        hodSignature: 'Head of the Department',
        principalSignature: 'Principal',
      },
    };
  }

  /**
   * 11. Faculty Report Timetable Issue
   */
  static async reportTimetableIssue(params: {
    facultyId: string;
    departmentId: string;
    timetableSlotId?: string;
    category: string;
    description: string;
  }) {
    const issue = await db.timetableIssueReport.create({
      data: {
        facultyId: params.facultyId,
        departmentId: params.departmentId,
        timetableSlotId: params.timetableSlotId || null,
        category: params.category,
        description: params.description,
        status: 'PENDING',
      },
    });

    logger.info(`[TimetableIssue] Reported issue ${issue.id} by faculty ${params.facultyId} for dept ${params.departmentId}`);
    return issue;
  }

  /**
   * 12. HOD Resolve Timetable Issue
   */
  static async resolveTimetableIssue(params: {
    issueId: string;
    resolvedById: string;
    resolutionNotes: string;
    action: 'RESOLVED' | 'REJECTED';
  }) {
    const issue = await db.timetableIssueReport.update({
      where: { id: params.issueId },
      data: {
        status: params.action,
        resolvedById: params.resolvedById,
        resolutionNotes: params.resolutionNotes,
        resolvedAt: new Date(),
      },
    });

    return issue;
  }
}
