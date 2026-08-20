import { prisma } from '../lib/prisma';

export async function seedTransportV2Data() {
  console.log('--- SEEDING TRANSPORT V2 CANONICAL DATA ---');

  // 1. Ensure Route 06 (Vadavalli Metro Route)
  let route = await prisma.transportRoute.findFirst({
    where: { routeName: { contains: 'Route 06' } },
  });

  if (!route) {
    route = await prisma.transportRoute.create({
      data: {
        routeName: 'Route 06 — Vadavalli Metro',
        vehicleNo: 'TN 38 BR 1234',
        driverName: 'Senthil Kumar',
        driverPhone: '9876543210',
        monthlyFee: 1800,
        stops: 'Vadavalli, Navavoor, PN Pudur, Lawley Road, Anna Stadium, Main Campus',
      },
    });
    console.log('Created Transport Route 06:', route.id);
  } else {
    route = await prisma.transportRoute.update({
      where: { id: route.id },
      data: {
        routeName: 'Route 06 — Vadavalli Metro',
        vehicleNo: 'TN 38 BR 1234',
        driverName: 'Senthil Kumar',
        driverPhone: '9876543210',
      },
    });
  }

  // 2. Ensure Route Stops with precise coordinates in sequence order
  const stopsData = [
    { name: 'Vadavalli Bus Stand', sequence: 1, pickupTime: '07:20 AM', dropTime: '05:10 PM', latitude: 11.0254, longitude: 76.9012 },
    { name: 'Navavoor Pirivu', sequence: 2, pickupTime: '07:35 AM', dropTime: '04:55 PM', latitude: 11.0315, longitude: 76.9189 },
    { name: 'PN Pudur Junction', sequence: 3, pickupTime: '07:48 AM', dropTime: '04:40 PM', latitude: 11.0289, longitude: 76.9385 },
    { name: 'Lawley Road Circle', sequence: 4, pickupTime: '08:00 AM', dropTime: '04:25 PM', latitude: 11.0168, longitude: 76.9558 },
    { name: 'Anna Stadium East', sequence: 5, pickupTime: '08:12 AM', dropTime: '04:15 PM', latitude: 11.0092, longitude: 76.9698 },
    { name: 'Main Campus East Terminal', sequence: 6, pickupTime: '08:25 AM', dropTime: '04:00 PM', latitude: 11.0012, longitude: 76.9845 },
  ];

  for (const s of stopsData) {
    const existingStop = await prisma.transportStop.findFirst({
      where: { routeId: route.id, sequence: s.sequence },
    });

    if (!existingStop) {
      await prisma.transportStop.create({
        data: {
          routeId: route.id,
          name: s.name,
          sequence: s.sequence,
          pickupTime: s.pickupTime,
          dropTime: s.dropTime,
          latitude: s.latitude,
          longitude: s.longitude,
        },
      });
    } else {
      await prisma.transportStop.update({
        where: { id: existingStop.id },
        data: {
          name: s.name,
          pickupTime: s.pickupTime,
          dropTime: s.dropTime,
          latitude: s.latitude,
          longitude: s.longitude,
        },
      });
    }
  }

  // 3. Ensure Primary Vehicle and Live GPS coordinates
  let vehicle = await prisma.vehicle.findFirst({
    where: { vehicleNumber: 'TN 38 BR 1234' },
  });

  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        vehicleNumber: 'TN 38 BR 1234',
        type: 'COLLEGE_BUS',
        capacity: 55,
        status: 'ACTIVE',
        registrationNo: 'TN38BR1234',
        fuelType: 'DIESEL',
      },
    });
  }

  // Clean and reset RouteVehicle association to TN 38 BR 1234
  await prisma.transportRouteVehicle.deleteMany({
    where: { routeId: route.id },
  });

  await prisma.transportRouteVehicle.create({
    data: {
      routeId: route.id,
      vehicleId: vehicle.id,
      shift: 'MORNING',
      status: 'ACTIVE',
    },
  });

  // Insert Live GPS Location (simulating bus near PN Pudur Junction heading towards Lawley Road)
  await (prisma as any).vehicleLocation.create({
    data: {
      vehicleId: vehicle.id,
      latitude: 11.0225,
      longitude: 76.9460,
      speed: 32.5,
      heading: 85,
      source: 'GPS_HARDWARE',
      recordedAt: new Date(),
    },
  });

  // Also ensure backup vehicle with recent location
  let backupVehicle = await prisma.vehicle.findFirst({
    where: { vehicleNumber: 'TN 38 BR 9999' },
  });
  if (!backupVehicle) {
    backupVehicle = await prisma.vehicle.create({
      data: {
        vehicleNumber: 'TN 38 BR 9999',
        type: 'COLLEGE_BUS',
        capacity: 50,
        status: 'STANDBY',
        registrationNo: 'TN38BR9999',
        fuelType: 'DIESEL',
      },
    });
  }

  await (prisma as any).vehicleLocation.create({
    data: {
      vehicleId: backupVehicle.id,
      latitude: 11.0250,
      longitude: 76.9400,
      speed: 30.0,
      heading: 90,
      source: 'GPS_HARDWARE',
      recordedAt: new Date(),
    },
  });

  // 4. Query stops to get stop IDs
  const allStops = await prisma.transportStop.findMany({
    where: { routeId: route.id },
    orderBy: { sequence: 'asc' },
  });

  const stopNavavoor = allStops.find((s) => s.sequence === 2) || allStops[0];
  const stopLawley = allStops.find((s) => s.sequence === 4) || allStops[1];

  // 5. Explicitly configure Canonical Student Profiles (Hosteller, Bus Day Scholar, Out-Bus Day Scholar)
  const { configureThreeStudentsResidential } = await import('./configure_three_students_residential');
  await configureThreeStudentsResidential();

  // 6. Ensure Faculty Record (Dr. Arun / Faculty User)
  const facultyUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: 'faculty@campusos.edu', mode: 'insensitive' } },
        { username: { equals: 'faculty', mode: 'insensitive' } },
        { email: { contains: 'faculty', mode: 'insensitive' } },
      ],
    },
    include: { faculty: true },
  });

  if (facultyUser) {
    let facultyRecord = facultyUser.faculty || (await prisma.faculty.findFirst({ where: { userId: facultyUser.id } }));
    if (!facultyRecord) {
      const dept = await prisma.department.findFirst() || await prisma.department.create({ data: { name: 'Computer Science', code: 'CSE' } });
      facultyRecord = await prisma.faculty.create({
        data: {
          userId: facultyUser.id,
          employeeId: `FAC-CSE-001`,
          firstName: facultyUser.firstName || 'Dr. Arun',
          lastName: facultyUser.lastName || 'Kumar',
          designation: 'Professor',
          email: facultyUser.email,
          phone: facultyUser.phone || '9876543210',
          dob: new Date('1982-01-01'),
          dateOfJoining: new Date('2016-01-01'),
          qualification: 'Ph.D in Computer Science',
          experience: 15,
          departmentId: dept.id,
        },
      });
    }

    const facultyId = facultyRecord.id;

    await prisma.transportAllocation.deleteMany({
      where: { passengerId: { in: [facultyId, facultyUser.id] } },
    });

    await prisma.transportAllocation.create({
      data: {
        passengerId: facultyId,
        passengerType: 'FACULTY',
        routeId: route.id,
        stopId: stopLawley.id,
        status: 'ACTIVE',
        academicYear: '2025-2026',
        startDate: new Date(),
      },
    });
    console.log(`Linked Faculty ${facultyId} to Route 06 at ${stopLawley.name}`);
  }

  console.log('--- TRANSPORT V2 CANONICAL SEED COMPLETED SUCCESSFULLY ---');
}

if (require.main === module) {
  seedTransportV2Data()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
