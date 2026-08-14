import assert from 'assert';
import { prisma } from '../lib/prisma';
import { HodTimetableService } from '../modules/timetable/hod-timetable.service';
import { logger } from '../utils/logger';

const db = prisma as any;

async function runHodTimetableTestSuite() {
  console.log('\n========================================================================');
  console.log('🏛️ CAMPUSOS — HOD CONTROLLED TIMETABLE MANAGEMENT TEST SUITE');
  console.log('========================================================================\n');

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // SETUP: Seed Departments, Faculty, Subjects, and Sections
    // ──────────────────────────────────────────────────────────────────────────
    console.log('⚡ STEP 0: Initializing test entities (Departments, Faculty, Subjects)...');

    // 1. Departments
    const deptIT = await prisma.department.upsert({
      where: { code: 'IT' },
      update: { name: 'Information Technology', status: 'ACTIVE' },
      create: { code: 'IT', name: 'Information Technology', status: 'ACTIVE' },
    });

    const deptAIDS = await prisma.department.upsert({
      where: { code: 'AI&DS' },
      update: { name: 'Artificial Intelligence & Data Science', status: 'ACTIVE' },
      create: { code: 'AI&DS', name: 'Artificial Intelligence & Data Science', status: 'ACTIVE' },
    });

    // 2. Academic Year, Program & Semester
    const acaYear = await prisma.academicYear.upsert({
      where: { name: '2026-2027' },
      update: {},
      create: { name: '2026-2027', startDate: new Date('2026-06-01'), endDate: new Date('2027-05-31'), isCurrent: true },
    });

    const progIT = await prisma.program.findFirst({ where: { departmentId: deptIT.id } }) ||
      await prisma.program.create({
        data: { name: 'B.Tech IT', code: 'BTECH-IT', departmentId: deptIT.id },
      });

    const courseIT = await prisma.course.findFirst({ where: { departmentId: deptIT.id } }) ||
      await prisma.course.create({
        data: { name: 'B.Tech Information Technology', code: 'IT-MAIN', departmentId: deptIT.id, programId: progIT.id, duration: 4 },
      });

    const sem7 = await prisma.semester.findFirst({ where: { courseId: courseIT.id, number: 7 } }) ||
      await prisma.semester.create({
        data: { name: 'Semester 7', number: 7, startDate: new Date('2026-07-01'), endDate: new Date('2026-12-15'), courseId: courseIT.id, programId: progIT.id, academicYearId: acaYear.id },
      });

    const sec7A = await prisma.section.findFirst({ where: { semesterId: sem7.id, name: 'VII IT-A' } }) ||
      await prisma.section.create({
        data: { name: 'VII IT-A', semesterId: sem7.id, programId: progIT.id, departmentId: deptIT.id, room: 'D106' },
      });

    // 3. Faculty (Home Faculty: Angayarkanni, Arun; Visiting Faculty: Dr. Ravi from AI&DS)
    const facultyAngayarkanni = await prisma.faculty.upsert({
      where: { employeeId: 'AEC01IT' },
      update: { departmentId: deptIT.id, firstName: 'Angayarkanni', lastName: 'D', designation: 'Associate Professor' },
      create: {
        employeeId: 'AEC01IT',
        firstName: 'Angayarkanni',
        lastName: 'D',
        email: 'angayarkanni.it@geetorus.com',
        phone: '9876543210',
        dob: new Date('1980-05-15'),
        dateOfJoining: new Date('2015-06-01'),
        designation: 'Associate Professor',
        qualification: 'M.E., Ph.D.',
        experience: 12,
        departmentId: deptIT.id,
      },
    });

    const facultyArun = await prisma.faculty.upsert({
      where: { employeeId: 'AEC02IT' },
      update: { departmentId: deptIT.id, firstName: 'Arun', lastName: 'Kumar' },
      create: {
        employeeId: 'AEC02IT',
        firstName: 'Arun',
        lastName: 'Kumar',
        email: 'arun.it@geetorus.com',
        phone: '9876543211',
        dob: new Date('1988-03-20'),
        dateOfJoining: new Date('2018-07-01'),
        designation: 'Assistant Professor',
        qualification: 'M.Tech',
        experience: 8,
        departmentId: deptIT.id,
      },
    });

    const facultyRavi = await prisma.faculty.upsert({
      where: { employeeId: 'AEC09AD' },
      update: { departmentId: deptAIDS.id, firstName: 'Ravi', lastName: 'Chandran' },
      create: {
        employeeId: 'AEC09AD',
        firstName: 'Ravi',
        lastName: 'Chandran',
        email: 'ravi.aids@geetorus.com',
        phone: '9876543219',
        dob: new Date('1982-11-10'),
        dateOfJoining: new Date('2020-01-10'),
        designation: 'Professor',
        qualification: 'Ph.D. AI',
        experience: 15,
        departmentId: deptAIDS.id, // Home department is AI&DS
      },
    });

    // 4. Subjects
    const subBDA = await prisma.subject.upsert({
      where: { code: '23IT7T3' },
      update: { name: 'Big Data Analytics', departmentId: deptIT.id, isLab: false },
      create: {
        code: '23IT7T3',
        name: 'Big Data Analytics',
        credits: 3,
        theoryHours: 4,
        departmentId: deptIT.id,
        programId: progIT.id,
        semesterId: sem7.id,
        isLab: false,
      },
    });

    const subBDALab = await prisma.subject.upsert({
      where: { code: '23IT7L2' },
      update: { name: 'BDA Laboratory', departmentId: deptIT.id, isLab: true },
      create: {
        code: '23IT7L2',
        name: 'BDA Laboratory',
        credits: 2,
        practicalHours: 3,
        departmentId: deptIT.id,
        programId: progIT.id,
        semesterId: sem7.id,
        isLab: true,
      },
    });

    const subPython = await prisma.subject.upsert({
      where: { code: '23IT5T3' },
      update: { name: 'Python Programming', departmentId: deptIT.id },
      create: {
        code: '23IT5T3',
        name: 'Python Programming',
        credits: 3,
        theoryHours: 4,
        departmentId: deptIT.id,
        programId: progIT.id,
        semesterId: sem7.id,
      },
    });

    // 5. Cross-Department Teaching Assignment: Dr. Ravi (AI&DS) assigned to teach Python in IT
    await db.facultyTeachingAssignment.deleteMany({ where: { facultyId: facultyRavi.id } });
    await db.facultyTeachingAssignment.create({
      data: {
        facultyId: facultyRavi.id,
        homeDepartmentId: deptAIDS.id,
        teachingDepartmentId: deptIT.id,
        subjectId: subPython.id,
        semesterId: sem7.id,
        sectionId: sec7A.id,
        academicYearId: acaYear.id,
        periodsPerWeek: 4,
        status: 'ACTIVE',
      },
    });

    // 6. Seed HOD User
    let userHod = await prisma.user.findFirst({ where: { email: 'it.head@geetorus.com' } });
    if (!userHod) {
      userHod = await prisma.user.findFirst();
    }
    const hodUserId = userHod?.id || 'admin-id';

    // Clean up previous test runs
    await db.timetableSlot.deleteMany({ where: { departmentId: { in: [deptIT.id, deptAIDS.id] } } });
    await db.timetableRevision.deleteMany({ where: { departmentId: { in: [deptIT.id, deptAIDS.id] } } });
    await db.timetableImportBatch.deleteMany({ where: { departmentId: { in: [deptIT.id, deptAIDS.id] } } });
    await db.timetableIssueReport.deleteMany({ where: { departmentId: { in: [deptIT.id, deptAIDS.id] } } });

    console.log('✅ Setup completed successfully.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 1 — Segregated Faculty Roster for HOD Timetable
    // ──────────────────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🧪 TEST 1: Segregated Home Faculty vs Cross-Department Visiting Faculty');
    console.log('────────────────────────────────────────────────────────────────────────');

    const roster = await HodTimetableService.getDepartmentFacultyRoster(deptIT.id);

    console.log(`  • Total Faculty Available to IT HOD: ${roster.totalFacultyCount}`);
    console.log(`  • Home Faculty Count: ${roster.homeFaculty.length}`);
    console.log(`  • Visiting Faculty Count: ${roster.crossDepartmentFaculty.length}`);

    assert.ok(roster.homeFaculty.some((f: any) => f.employeeId === 'AEC01IT'), 'Home faculty includes Angayarkanni');
    assert.ok(roster.homeFaculty.some((f: any) => f.employeeId === 'AEC02IT'), 'Home faculty includes Arun');
    assert.ok(roster.crossDepartmentFaculty.some((f: any) => f.employeeId === 'AEC09AD'), 'Visiting faculty includes Dr. Ravi from AI&DS');

    const visitingRavi = roster.crossDepartmentFaculty.find((f: any) => f.employeeId === 'AEC09AD');
    assert.strictEqual(visitingRavi.homeDepartment.code, 'AI&DS', 'Visiting faculty home dept is AI&DS');
    assert.strictEqual(visitingRavi.teachingScope, 'CROSS_DEPARTMENT', 'Teaching scope is CROSS_DEPARTMENT');

    console.log('✅ TEST 1 PASSED: Segregated Roster cleanly identifies Home vs Visiting Faculty.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 2 — Smart XLSX / CSV Parsing, Column Mapping & Fuzzy Match
    // ──────────────────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🧪 TEST 2: Smart XLSX / CSV Upload, Column Mapping & Fuzzy Match');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Simulated uploaded rows using custom column headings
    const rawUploadedRows = [
      { 'Day': 'Monday', 'Period': 1, 'Sub Code': '23IT7T3', 'Subject': 'BDA', 'Staff Name': 'Mrs. Angayarkanni', 'Staff ID': 'AEC01IT', 'Room': 'D106', 'Type': 'THEORY' },
      { 'Day': 'Monday', 'Period': 2, 'Sub Code': '23IT7T3', 'Subject': 'BDA', 'Staff Name': 'Mrs. Angayarkanni', 'Staff ID': 'AEC01IT', 'Room': 'D106', 'Type': 'THEORY' },
      { 'Day': 'Tuesday', 'Period': 3, 'Sub Code': '23IT5T3', 'Subject': 'Python', 'Staff Name': 'Dr. Ravi', 'Staff ID': 'AEC09AD', 'Room': 'D106', 'Type': 'THEORY' },
      { 'Day': 'Wednesday', 'Period': 4, 'Sub Code': '23IT7L2', 'Subject': 'BDA LAB', 'Staff Name': 'Mrs. Angayarkanni', 'Staff ID': 'AEC01IT', 'Room': 'LAB-1', 'Type': 'LAB' },
    ];

    const parseResult = await HodTimetableService.parseAndMapTimetable({
      rawRows: rawUploadedRows,
      sourceFileName: 'IT_Department_Timetable_Sem7.xlsx',
      departmentId: deptIT.id,
      academicYearId: acaYear.id,
      semesterId: sem7.id,
      uploadedById: hodUserId,
    });

    console.log(`  • Detected ${parseResult.summary.totalRows} slots (${parseResult.summary.validRows} valid, ${parseResult.summary.warningRows} warnings, ${parseResult.summary.errorRows} errors, ${parseResult.summary.conflictRows} conflicts)`);
    assert.strictEqual(parseResult.summary.totalRows, 4, 'All 4 rows extracted');
    assert.strictEqual(parseResult.summary.validRows + parseResult.summary.warningRows, 4, 'All 4 rows parsed successfully');
    assert.strictEqual(parseResult.summary.warningRows, 1, '1 Cross-Department warning recorded');
    assert.strictEqual(parseResult.summary.errorRows, 0, 'Zero syntax errors');
    assert.strictEqual(parseResult.summary.isReadyForDraft, true, 'Batch is ready for draft saving');

    // Verify fuzzy resolution
    const row3 = parseResult.parsedRows[2];
    assert.strictEqual(row3.facultyId, facultyRavi.id, 'Dr. Ravi resolved as faculty');
    assert.strictEqual(row3.isCrossDepartment, true, 'Dr. Ravi flagged as Cross-Department');
    assert.strictEqual(row3.subjectId, subPython.id, 'Python course resolved');

    console.log('✅ TEST 2 PASSED: Smart parsing and entity resolution verified.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 3 — Cross-Department Availability & Conflict Prevention
    // ──────────────────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🧪 TEST 3: Institutional Conflict Checker (Faculty & Room Double-Booking)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Create an existing slot in AI&DS department for Dr. Ravi on Tuesday Period 3
    const aidsSlot = await db.timetableSlot.create({
      data: {
        departmentId: deptAIDS.id,
        academicYearId: acaYear.id,
        semesterId: sem7.id,
        sectionId: sec7A.id,
        subjectId: subPython.id,
        facultyId: facultyRavi.id,
        dayOfWeek: 'TUESDAY',
        slotIndex: 3,
        startTime: '11:00',
        endTime: '11:50',
        roomNo: 'AD201',
        status: 'ACTIVE',
      },
    });

    // Now IT HOD attempts to assign Dr. Ravi to Tuesday Period 3 in IT
    const conflictCheck = await HodTimetableService.checkSlotConflicts({
      facultyId: facultyRavi.id,
      departmentId: deptIT.id,
      academicYearId: acaYear.id,
      semesterId: sem7.id,
      sectionId: sec7A.id,
      dayOfWeek: 'TUESDAY',
      slotIndex: 3,
      roomNo: 'D106',
    });

    console.log(`  • Conflict Check Result: hasConflict=${conflictCheck.hasConflict}, count=${conflictCheck.conflicts.length}`);
    assert.strictEqual(conflictCheck.hasConflict, true, 'Conflict detected for Dr. Ravi on Tuesday P3');
    assert.strictEqual(conflictCheck.conflicts[0].type, 'CROSS_DEPT_CONFLICT', 'Identified as cross-department conflict');
    console.log(`  • Conflict details: ${conflictCheck.conflicts[0].message}`);

    // Cleanup conflict slot for clean next steps
    await db.timetableSlot.delete({ where: { id: aidsSlot.id } });

    console.log('✅ TEST 3 PASSED: Institutional cross-department conflicts blocked.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 4 — In-App Error Correction, Draft Save & Revision Publish (W.E.F.)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🧪 TEST 4: Draft Creation, Revision History & Effective Date (W.E.F.)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Save batch as Draft
    const draftRes = await HodTimetableService.saveImportBatchAsDraft(parseResult.batchId, hodUserId);
    assert.strictEqual(draftRes.createdSlotCount, 4, '4 draft slots created');
    assert.strictEqual(draftRes.revision.status, 'DRAFT', 'Revision saved in DRAFT status');
    console.log(`  • Draft Revision created: ${draftRes.revision.revisionCode}`);

    // Publish Revision 00
    const pubRes1 = await HodTimetableService.publishTimetableRevision({
      revisionId: draftRes.revision.id,
      effectiveFrom: new Date('2026-07-10'),
      changeSummary: 'Initial official timetable release',
      publishedById: hodUserId,
    });
    assert.strictEqual(pubRes1.revision.status, 'PUBLISHED', 'Revision 00 published');
    assert.strictEqual(pubRes1.activeSlotCount, 4, '4 slots activated for live usage');
    console.log(`  • Revision 00 published w.e.f ${new Date(pubRes1.effectiveFrom).toLocaleDateString()}`);

    // Create Revision 01 (Modify Period 2 from Angayarkanni to Arun Kumar)
    const rev1 = await db.timetableRevision.create({
      data: {
        departmentId: deptIT.id,
        academicYearId: acaYear.id,
        semesterId: sem7.id,
        revisionNumber: 1,
        revisionCode: 'REV-01',
        status: 'DRAFT',
        changeSummary: 'Reassigned Monday P2 to Arun Kumar',
      },
    });

    // Copy slots to new revision and modify Period 2
    await db.timetableSlot.create({
      data: {
        departmentId: deptIT.id, academicYearId: acaYear.id, semesterId: sem7.id, sectionId: sec7A.id,
        subjectId: subBDA.id, facultyId: facultyAngayarkanni.id, dayOfWeek: 'MONDAY', slotIndex: 1,
        startTime: '09:00', endTime: '09:50', roomNo: 'D106', revisionId: rev1.id, status: 'DRAFT',
      },
    });
    await db.timetableSlot.create({
      data: {
        departmentId: deptIT.id, academicYearId: acaYear.id, semesterId: sem7.id, sectionId: sec7A.id,
        subjectId: subBDA.id, facultyId: facultyArun.id, dayOfWeek: 'MONDAY', slotIndex: 2, // Modified
        startTime: '09:50', endTime: '10:40', roomNo: 'D106', revisionId: rev1.id, status: 'DRAFT',
      },
    });
    await db.timetableSlot.create({
      data: {
        departmentId: deptIT.id, academicYearId: acaYear.id, semesterId: sem7.id, sectionId: sec7A.id,
        subjectId: subPython.id, facultyId: facultyRavi.id, dayOfWeek: 'TUESDAY', slotIndex: 3,
        startTime: '11:00', endTime: '11:50', roomNo: 'D106', revisionId: rev1.id, status: 'DRAFT',
      },
    });

    // Compare Revisions (Old vs New Diff)
    const diff = await HodTimetableService.compareTimetables(pubRes1.revision.id, rev1.id);
    console.log(`  • Revision Diff: ${diff.modified.length} modified, ${diff.added.length} added, ${diff.removed.length} removed`);
    assert.strictEqual(diff.modified.length, 1, 'Exactly 1 slot modified');
    assert.strictEqual(diff.modified[0].changes.facultyChanged, true, 'Faculty change correctly flagged');

    // Publish Revision 01
    const pubRes2 = await HodTimetableService.publishTimetableRevision({
      revisionId: rev1.id,
      effectiveFrom: new Date('2026-08-20'),
      changeSummary: 'Revision 01 w.e.f 20 August 2026',
      publishedById: hodUserId,
    });

    assert.strictEqual(pubRes2.revision.status, 'PUBLISHED', 'Revision 01 is now published');
    assert.strictEqual(pubRes2.supersededRevision?.revisionCode, 'REV-00', 'Revision 00 marked as SUPERSEDED');

    // Verify Revision 00 slots are preserved historically
    const rev0Check = await db.timetableRevision.findUnique({ where: { id: pubRes1.revision.id } });
    assert.strictEqual(rev0Check.status, 'SUPERSEDED', 'Revision 00 preserved as SUPERSEDED (not deleted)');

    console.log('✅ TEST 4 PASSED: Draft, Diff compare, and Revision preservation verified.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 5 — Workload Calculation, Master Matrix & Official Print Format
    // ──────────────────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🧪 TEST 5: Workload Telemetry, Master Matrix & Official AEC A5c Print');
    console.log('────────────────────────────────────────────────────────────────────────');

    // 1. Workload calculation for Angayarkanni
    const loadAngayarkanni = await HodTimetableService.calculateFacultyWorkload(facultyAngayarkanni.id, pubRes2.revision.id);
    console.log(`  • Angayarkanni Workload: ${loadAngayarkanni.breakdown.theoryHours} Theory, Total = ${loadAngayarkanni.breakdown.totalHours}`);
    assert.ok(loadAngayarkanni.breakdown.totalHours >= 1, 'Workload calculated');

    // 2. Master Matrix View (By Class / Faculty / Room)
    const masterMatrix = await HodTimetableService.getDepartmentMasterTimetable({
      departmentId: deptIT.id,
      revisionId: pubRes2.revision.id,
    });
    assert.ok(masterMatrix.byClass['VII IT-A'], 'Class view populated for VII IT-A');
    assert.ok(masterMatrix.byRoom['D106'], 'Room view populated for D106');

    // 3. Official Print Format (AEC Faculty Timetable A5c)
    const printData = await HodTimetableService.getOfficialFacultyPrintData(facultyAngayarkanni.id, pubRes2.revision.id);
    assert.strictEqual(printData.institutionHeader.title, 'FACULTY TIMETABLE', 'Official title matches');
    assert.strictEqual(printData.institutionHeader.formatCode, 'A5c', 'Format code matches A5c');
    assert.ok(printData.weeklyGrid['MONDAY'][1], 'Monday Period 1 populated in official print grid');
    assert.ok(printData.signatures.hodSignature, 'HOD signature block present');

    console.log('✅ TEST 5 PASSED: Workload telemetry, master matrix & official print generated.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 6 — Faculty Issue Reporting & HOD Resolution Workflow
    // ──────────────────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🧪 TEST 6: Faculty Issue Reporting & HOD Resolution Workflow');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Faculty reports issue
    const issue = await HodTimetableService.reportTimetableIssue({
      facultyId: facultyArun.id,
      departmentId: deptIT.id,
      category: 'WRONG_VENUE',
      description: 'Room D106 projector is under maintenance. Please assign D108.',
    });
    assert.strictEqual(issue.status, 'PENDING', 'Issue logged as PENDING');

    // HOD resolves issue
    const resolvedIssue = await HodTimetableService.resolveTimetableIssue({
      issueId: issue.id,
      resolvedById: hodUserId,
      resolutionNotes: 'Updated venue to D108 in Revision 02.',
      action: 'RESOLVED',
    });
    assert.strictEqual(resolvedIssue.status, 'RESOLVED', 'Issue resolved by HOD');
    console.log(`  • Issue ${issue.id} resolved with note: "${resolvedIssue.resolutionNotes}"`);

    console.log('✅ TEST 6 PASSED: Issue reporting and resolution workflow verified.\n');

    console.log('========================================================================');
    console.log('🏆 ALL 6 HOD TIMETABLE SUITE TESTS COMPLETED SUCCESSFULLY!');
    console.log('========================================================================\n');

  } catch (error) {
    console.error('❌ Test Suite Failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runHodTimetableTestSuite();
