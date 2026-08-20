import { prisma } from '../lib/prisma';

export async function configureThreeStudentsResidential() {
  console.log('===============================================================');
  console.log('🚀 CONFIGURING STUDENT RESIDENTIAL & TRANSPORT MODES');
  console.log('===============================================================');

  // 1. Ensure Route 06 & Stop for College Bus
  let route = await prisma.transportRoute.findFirst({
    where: { routeName: { contains: 'Route 06' } },
    include: { transportStops: { orderBy: { sequence: 'asc' } } }
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
      include: { transportStops: true }
    });
  }

  let stop = route.transportStops.find(s => s.sequence === 2) || route.transportStops[0];
  if (!stop) {
    stop = await prisma.transportStop.create({
      data: {
        routeId: route.id,
        name: 'Navavoor Pirivu',
        sequence: 2,
        pickupTime: '07:35 AM',
        dropTime: '04:55 PM',
        latitude: 11.0315,
        longitude: 76.9189,
      }
    });
  }

  // 2. Ensure Hostel Building, Block, Floor, Room, Bed
  let hostelBuilding = await (prisma as any).hostelBuilding.findFirst();
  if (!hostelBuilding) {
    hostelBuilding = await (prisma as any).hostelBuilding.create({
      data: {
        name: 'Ramanujan Block (Boys)',
        type: 'BOYS',
        description: 'Engineering boys hostel block',
        rooms: JSON.stringify([{ roomNo: '204', capacity: 2, occupied: 1 }]),
      }
    });
  }

  let block = await (prisma as any).hostelBlock.findFirst({ where: { hostelId: hostelBuilding.id } });
  if (!block) {
    block = await (prisma as any).hostelBlock.create({
      data: {
        hostelId: hostelBuilding.id,
        name: 'Block A',
        description: 'First & Second Year Engineering Hostel Block',
        totalFloors: 3,
        status: 'ACTIVE',
      }
    });
  }

  let floor = await (prisma as any).hostelFloor.findFirst({ where: { blockId: block.id } });
  if (!floor) {
    floor = await (prisma as any).hostelFloor.create({
      data: {
        blockId: block.id,
        number: 2,
        name: '2nd Floor',
        status: 'ACTIVE',
      }
    });
  }

  let room = await (prisma as any).hostelRoom.findFirst({ where: { floorId: floor.id } });
  if (!room) {
    room = await (prisma as any).hostelRoom.create({
      data: {
        floorId: floor.id,
        roomNumber: '204',
        roomType: 'DOUBLE',
        capacity: 2,
        occupied: 1,
        status: 'ACTIVE',
      }
    });
  }

  let bed = await (prisma as any).hostelBed.findFirst({ where: { roomId: room.id } });
  if (!bed) {
    bed = await (prisma as any).hostelBed.create({
      data: {
        roomId: room.id,
        bedNumber: 'Bed A',
        status: 'OCCUPIED',
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STUDENT 1: student001.cse@geetorus.com — HOSTELLER
  // ───────────────────────────────────────────────────────────────────────────
  const user001 = await prisma.user.findFirst({
    where: { email: { equals: 'student001.cse@geetorus.com', mode: 'insensitive' } },
    include: { student: true }
  });

  if (user001 && user001.student) {
    await prisma.student.update({
      where: { id: user001.student.id },
      data: {
        residentialType: 'HOSTELLER',
        transportMode: 'OTHER',
        hostelId: hostelBuilding.id,
        roomNo: 'Ramanujan Block - Room 204 (Bed A)',
        transportRouteId: null,
        transportStopId: null,
      }
    });

    // Remove any active transport allocations
    await prisma.transportAllocation.deleteMany({
      where: { passengerId: user001.student.id }
    });

    // Ensure active hostel allocation
    await (prisma as any).hostelAllocation.deleteMany({
      where: { studentId: user001.student.id }
    });

    const adminUser = await prisma.user.findFirst({ where: { role: { name: { contains: 'Admin' } } } }) || user001;

    await (prisma as any).hostelAllocation.create({
      data: {
        studentId: user001.student.id,
        roomId: room.id,
        bedId: bed.id,
        academicYear: '2025-2026',
        allocationDate: new Date('2026-07-01'),
        status: 'ACTIVE',
        remarks: 'Allocated to Ramanujan Block 204 (Bed A)',
        allocatedById: adminUser.id,
      }
    });

    console.log('✅ Student 001 configured as: HOSTELLER (Ramanujan Block - Room 204, Bed A)');
  } else {
    console.log('⚠️ Student 001 user or student record not found');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STUDENT 2: student002.cse@geetorus.com — DAY SCHOLAR (COLLEGE BUS)
  // ───────────────────────────────────────────────────────────────────────────
  const user002 = await prisma.user.findFirst({
    where: { email: { equals: 'student002.cse@geetorus.com', mode: 'insensitive' } },
    include: { student: true }
  });

  if (user002 && user002.student) {
    await prisma.student.update({
      where: { id: user002.student.id },
      data: {
        residentialType: 'DAY_SCHOLAR',
        transportMode: 'COLLEGE_BUS',
        transportRouteId: route.id,
        transportStopId: stop.id,
        hostelId: null,
        roomNo: null,
      }
    });

    // Remove any hostel allocations
    await (prisma as any).hostelAllocation.deleteMany({
      where: { studentId: user002.student.id }
    });

    // Ensure active transport allocation
    await prisma.transportAllocation.deleteMany({
      where: { passengerId: user002.student.id }
    });

    await prisma.transportAllocation.create({
      data: {
        routeId: route.id,
        stopId: stop.id,
        passengerId: user002.student.id,
        passengerType: 'STUDENT',
        status: 'ACTIVE',
        academicYear: '2025-2026',
        monthlyFee: 1800,
        startDate: new Date('2026-07-01'),
      }
    });

    console.log('✅ Student 002 configured as: DAY SCHOLAR (COLLEGE BUS — Route 06, Navavoor Pirivu)');
  } else {
    console.log('⚠️ Student 002 user or student record not found');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STUDENT 3: student003.cse@geetorus.com — DAY SCHOLAR (OUT BUS / INDEPENDENT)
  // ───────────────────────────────────────────────────────────────────────────
  const user003 = await prisma.user.findFirst({
    where: { email: { equals: 'student003.cse@geetorus.com', mode: 'insensitive' } },
    include: { student: true }
  });

  if (user003 && user003.student) {
    await prisma.student.update({
      where: { id: user003.student.id },
      data: {
        residentialType: 'DAY_SCHOLAR',
        transportMode: 'OUT_BUS',
        transportRouteId: null,
        transportStopId: null,
        hostelId: null,
        roomNo: null,
      }
    });

    // Remove any hostel allocations
    await (prisma as any).hostelAllocation.deleteMany({
      where: { studentId: user003.student.id }
    });

    // Remove any transport allocations
    await prisma.transportAllocation.deleteMany({
      where: { passengerId: user003.student.id }
    });

    console.log('✅ Student 003 configured as: DAY SCHOLAR (OUT BUS / Independent Commute)');
  } else {
    console.log('⚠️ Student 003 user or student record not found');
  }

  console.log('\n===============================================================');
  console.log('🎉 ALL 3 STUDENTS CONFIGURED SUCCESSFULLY!');
  console.log('===============================================================');
}

if (require.main === module) {
  configureThreeStudentsResidential()
    .catch((err) => {
      console.error('Error configuring students:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
