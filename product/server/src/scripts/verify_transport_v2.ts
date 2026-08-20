import { prisma } from '../lib/prisma';
import { TransportService } from '../modules/transport/transport.service';
import { seedTransportV2Data } from './seed_transport_v2_demo_data';

const transportService = new TransportService();

async function runTransportV2Verification() {
  console.log('\n============================================================');
  console.log('  CAMPUSOS TRANSPORT V2 — END-TO-END VERIFICATION SUITE');
  console.log('============================================================\n');

  // Ensure seed data is present
  await seedTransportV2Data();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}${detail ? ` — ${detail}` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // Get existing Student and Faculty roles and templates
    const studentRole = await prisma.role.findFirst({
      where: { name: { in: ['STUDENT', 'Student'] } },
    });
    const facultyRole = await prisma.role.findFirst({
      where: { name: { in: ['FACULTY', 'Faculty'] } },
    });
    const existingStudent = await prisma.student.findFirst();
    const dept = await prisma.department.findFirst() || await prisma.department.create({
      data: { name: 'Computer Science', code: 'CSE' },
    });

    // ── Test 1: Day Scholar Student Live Tracking Resolver ──
    const studentRecord = await prisma.student.findFirst({
      where: {
        residentialType: 'DAY_SCHOLAR',
        transportMode: 'COLLEGE_BUS',
        userId: { not: null },
      },
      include: { user: true },
    });

    if (studentRecord && studentRecord.userId) {
      const studentTracking: any = await transportService.getMyAllocation(studentRecord.userId);
      assert(
        studentTracking.isEligible === true &&
        studentTracking.passengerType === 'STUDENT' &&
        Boolean(studentTracking.route?.name) &&
        Boolean(studentTracking.assignedStop?.name),
        'Scenario 1: Day Scholar Student Live Tracking Resolver',
        `Route: ${studentTracking.route?.name}, Stop: ${studentTracking.assignedStop?.name}, ETA: ${studentTracking.etaMinutes}m`
      );
    } else {
      assert(false, 'Scenario 1: Day Scholar Student Live Tracking Resolver', 'Student record not found');
    }

    // ── Test 2: Hosteller Resident Exclusion Rule ──
    const defaultStudentRole = studentRole || await prisma.role.findFirst();
    const defaultAcademicYear = await prisma.academicYear.findFirst();
    const defaultProgram = await prisma.program.findFirst();
    const defaultCourse = await prisma.course.findFirst();
    const defaultSemester = await prisma.semester.findFirst();
    const defaultSection = await prisma.section.findFirst();

    const hostellerUser = await prisma.user.create({
      data: {
        email: `test_hosteller_${Date.now()}@campusos.edu`,
        username: `hosteller_${Date.now()}`,
        passwordHash: 'dummy',
        firstName: 'Hostel',
        lastName: 'Resident',
        roleId: defaultStudentRole?.id || '',
      },
    });
    await prisma.student.create({
      data: {
        userId: hostellerUser.id,
        admissionNo: `HST-${Date.now().toString().slice(-4)}`,
        firstName: 'Hostel',
        lastName: 'Resident',
        residentialType: 'HOSTELLER',
        transportMode: 'NONE',
        dob: new Date('2003-05-15'),
        dateOfAdmission: new Date('2023-08-01'),
        gender: 'MALE',
        parentName: 'R. Resident',
        parentPhone: '9876500001',
        currentAddress: 'Hostel Block B, Room 204',
        permanentAddress: '12 Temple St, Salem',
        academicYearId: existingStudent?.academicYearId || defaultAcademicYear?.id || 'ay_default',
        departmentId: existingStudent?.departmentId || dept.id,
        programId: existingStudent?.programId || defaultProgram?.id || 'prog_default',
        courseId: existingStudent?.courseId || defaultCourse?.id || 'course_default',
        semesterId: existingStudent?.semesterId || defaultSemester?.id || 'sem_default',
        sectionId: existingStudent?.sectionId || defaultSection?.id || 'sec_default',
      },
    });

    const hostellerTracking: any = await transportService.getMyAllocation(hostellerUser.id);
    assert(
      hostellerTracking.isEligible === false && hostellerTracking.reason === 'HOSTELLER',
      'Scenario 2: Hosteller Resident Exclusion Rule',
      `Reason: ${hostellerTracking.reason}, Message: ${hostellerTracking.message}`
    );

    // ── Test 3: Day Scholar Non-College Bus Commute Profile ──
    const nonBusUser = await prisma.user.create({
      data: {
        email: `test_nonbus_${Date.now()}@campusos.edu`,
        username: `nonbus_${Date.now()}`,
        passwordHash: 'dummy',
        firstName: 'Self',
        lastName: 'Commuter',
        roleId: defaultStudentRole?.id || '',
      },
    });
    await prisma.student.create({
      data: {
        userId: nonBusUser.id,
        admissionNo: `SCOMM-${Date.now().toString().slice(-4)}`,
        firstName: 'Self',
        lastName: 'Commuter',
        residentialType: 'DAY_SCHOLAR',
        transportMode: 'SELF_COMMUTE',
        dob: new Date('2003-08-20'),
        dateOfAdmission: new Date('2023-08-01'),
        gender: 'FEMALE',
        parentName: 'S. Commuter',
        parentPhone: '9876500002',
        currentAddress: '54 Gandhi Road, Coimbatore',
        permanentAddress: '54 Gandhi Road, Coimbatore',
        academicYearId: existingStudent?.academicYearId || defaultAcademicYear?.id || 'ay_default',
        departmentId: existingStudent?.departmentId || dept.id,
        programId: existingStudent?.programId || defaultProgram?.id || 'prog_default',
        courseId: existingStudent?.courseId || defaultCourse?.id || 'course_default',
        semesterId: existingStudent?.semesterId || defaultSemester?.id || 'sem_default',
        sectionId: existingStudent?.sectionId || defaultSection?.id || 'sec_default',
      },
    });

    const nonBusTracking: any = await transportService.getMyAllocation(nonBusUser.id);
    assert(
      nonBusTracking.isEligible === false && nonBusTracking.reason === 'NON_COLLEGE_BUS',
      'Scenario 3: Day Scholar Non-College Bus Commute Profile',
      `Reason: ${nonBusTracking.reason}, Mode: ${nonBusTracking.transportMode}`
    );

    // ── Test 4: Faculty Bus Tracking Resolver ──
    const facultyAlloc = await prisma.transportAllocation.findFirst({
      where: { passengerType: 'FACULTY', status: 'ACTIVE' },
    });
    let facultyUser: any = null;
    if (facultyAlloc) {
      const fac = await prisma.faculty.findUnique({ where: { id: facultyAlloc.passengerId }, include: { user: true } });
      if (fac?.userId) {
        facultyUser = fac.user || (await prisma.user.findUnique({ where: { id: fac.userId } }));
      } else {
        facultyUser = await prisma.user.findUnique({ where: { id: facultyAlloc.passengerId } });
      }
    }
    if (!facultyUser) {
      facultyUser = await prisma.user.findFirst({
        where: { email: { contains: 'faculty', mode: 'insensitive' } },
        include: { faculty: true },
      });
    }

    if (facultyUser) {
      const facultyTracking: any = await transportService.getMyAllocation(facultyUser.id);
      assert(
        facultyTracking.isEligible === true &&
        facultyTracking.passengerType === 'FACULTY' &&
        Boolean(facultyTracking.assignedStop?.name),
        'Scenario 4: Faculty Bus Tracking Resolver',
        `Faculty Stop: ${facultyTracking.assignedStop?.name}, Bus: ${facultyTracking.vehicle?.number}`
      );
    } else {
      assert(false, 'Scenario 4: Faculty Bus Tracking Resolver', 'Faculty record not found');
    }

    // ── Test 5: Cross-Department Faculty Allocation Independence ──
    const defaultFacultyRole = facultyRole || await prisma.role.findFirst();
    const mechFacultyUser = await prisma.user.create({
      data: {
        email: `mech_prof_${Date.now()}@campusos.edu`,
        username: `mechprof_${Date.now()}`,
        passwordHash: 'dummy',
        firstName: 'Prof.',
        lastName: 'Venkatesh',
        roleId: defaultFacultyRole?.id || '',
      },
    });
    const mechFaculty = await prisma.faculty.create({
      data: {
        userId: mechFacultyUser.id,
        employeeId: `FAC-MECH-${Date.now().toString().slice(-4)}`,
        firstName: 'Prof.',
        lastName: 'Venkatesh',
        designation: 'Associate Professor',
        email: `mech_prof_${Date.now()}@campusos.edu`,
        phone: '9876500003',
        dob: new Date('1980-04-12'),
        dateOfJoining: new Date('2015-06-01'),
        qualification: 'Ph.D in Mechanical Engineering',
        experience: 12,
        departmentId: dept.id,
      },
    });

    const route06 = await prisma.transportRoute.findFirst({
      where: { routeName: { contains: 'Route 06' } },
    });
    const firstStop = await prisma.transportStop.findFirst({
      where: { routeId: route06!.id, sequence: 1 },
    });

    await prisma.transportAllocation.create({
      data: {
        passengerId: mechFaculty.id,
        passengerType: 'FACULTY',
        routeId: route06!.id,
        stopId: firstStop!.id,
        academicYear: '2025-2026',
        startDate: new Date(),
        status: 'ACTIVE',
      },
    });

    const crossDeptTracking: any = await transportService.getMyAllocation(mechFacultyUser.id);
    assert(
      crossDeptTracking.isEligible === true &&
      crossDeptTracking.route?.name === route06?.routeName &&
      crossDeptTracking.assignedStop?.name === firstStop?.name,
      'Scenario 5: Cross-Department Faculty Allocation Independence',
      `Dept-Independent Route: ${crossDeptTracking.route?.name}`
    );

    // ── Test 6: Live GPS Location Ingestion & Bounds Validation ──
    const vehicle = await prisma.vehicle.findFirst({
      where: { vehicleNumber: 'TN 38 BR 1234' },
    });

    const validLoc = await transportService.ingestLocation({
      vehicleId: vehicle!.id,
      latitude: 11.0250,
      longitude: 76.9400,
      speed: 38.0,
      heading: 90,
      source: 'GPS_HARDWARE',
    });

    assert(
      validLoc.latitude === 11.0250 && validLoc.longitude === 76.9400,
      'Scenario 6a: Live GPS Ingestion (Valid Coordinates)',
      `Speed: ${validLoc.speed} km/h, Heading: ${validLoc.heading}°`
    );

    let rejected = false;
    try {
      await transportService.ingestLocation({
        vehicleId: vehicle!.id,
        latitude: 195.0, // Out of bounds
        longitude: 76.9400,
      });
    } catch {
      rejected = true;
    }
    assert(rejected, 'Scenario 6b: GPS Bounds Validation (Out-of-bounds Lat/Lng Rejected)');

    // ── Test 7: Haversine Distance & Speed-based ETA Accuracy ──
    const dist = (transportService as any).calculateHaversineDistanceKm(11.0254, 76.9012, 11.0012, 76.9845);
    const eta = (transportService as any).estimateEtaMinutes(dist, 30);

    assert(
      dist > 8.0 && dist < 12.0 && eta > 15 && eta < 30,
      'Scenario 7: Haversine Distance & ETA Calculation Accuracy',
      `Computed Distance: ${dist.toFixed(2)} km, Estimated ETA: ${eta} min`
    );

    // ── Test 8: Approaching Stop Alert Geofence Engine & Deduplication ──
    const geofenceResult = await (transportService as any).checkApproachingStopAlerts({
      vehicleId: vehicle!.id,
      routeId: route06!.id,
      latitude: 11.0310,
      longitude: 76.9190,
      speed: 25.0,
    });

    assert(
      Array.isArray(geofenceResult) && geofenceResult.length >= 1,
      'Scenario 8a: Geofence Approaching Stop Detector Fired',
      `Alerts emitted: ${geofenceResult.length}`
    );

    const duplicateCheck = await (transportService as any).checkApproachingStopAlerts({
      vehicleId: vehicle!.id,
      routeId: route06!.id,
      latitude: 11.0310,
      longitude: 76.9190,
      speed: 25.0,
    });

    assert(
      Array.isArray(duplicateCheck) && duplicateCheck.length === 0,
      'Scenario 8b: 30-Minute Geofence Alert Deduplication Suppression'
    );

    const fleetLive = await transportService.getFleetLive();
    const route06Fleet: any = fleetLive.find((f: any) => f.routeId === route06!.id);

    assert(
      Boolean(route06Fleet) &&
      Boolean(route06Fleet?.vehicleNumber) &&
      (route06Fleet?.passengerCount || 0) >= 2 &&
      route06Fleet?.status === 'RUNNING',
      'Scenario 9: Fleet Live Control Centre Aggregator',
      `Active Routes: ${fleetLive.length}, Vehicle: ${route06Fleet?.vehicleNumber}, Route 06 Status: ${route06Fleet?.status}, Passengers: ${route06Fleet?.passengerCount}`
    );

    // ── Test 10: Categorized Passenger Directory ──
    const passengers = await transportService.listRoutePassengers(route06!.id);
    const hasStudent = passengers.some((p: any) => p.passengerType === 'STUDENT');
    const hasFaculty = passengers.some((p: any) => p.passengerType === 'FACULTY');

    assert(
      hasStudent && hasFaculty && passengers.length >= 2,
      'Scenario 10: Categorized Route Passenger Directory',
      `Total Allocated Passengers: ${passengers.length} (Students & Faculty separated)`
    );

    // ── Test 11: Emergency Breakdown & Replacement Vehicle Assignment ──
    const replacementVehicle = await prisma.vehicle.findFirst({
      where: { vehicleNumber: 'TN 38 BR 9999' },
    });

    const replaceResult = await transportService.assignReplacementVehicle({
      routeId: route06!.id,
      newVehicleId: replacementVehicle!.id,
      reason: 'P0 Transmission Maintenance Breakdown',
    });

    assert(
      replaceResult.success === true &&
      replaceResult.newVehicleNumber === 'TN 38 BR 9999' &&
      replaceResult.passengersNotified >= 2,
      'Scenario 11: Emergency Breakdown & Replacement Vehicle Workflow',
      `Replaced bus with: ${replaceResult.newVehicleNumber}, Passengers Broadcasted: ${replaceResult.passengersNotified}`
    );

    // Clean up temporary test accounts
    await prisma.student.deleteMany({ where: { userId: { in: [hostellerUser.id, nonBusUser.id] } } });
    await prisma.faculty.deleteMany({ where: { userId: mechFacultyUser.id } });
    await prisma.user.deleteMany({ where: { id: { in: [hostellerUser.id, nonBusUser.id, mechFacultyUser.id] } } });

  } catch (err: any) {
    console.error('Exception during verification:', err);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  runTransportV2Verification();
}
