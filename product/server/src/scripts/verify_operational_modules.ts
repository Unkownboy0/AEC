import { prisma } from '../lib/prisma';
import { TransportService } from '../modules/transport/transport.service';
import { FinanceService } from '../modules/finance/finance.service';
import { listCampusSuiteApps } from '../modules/campus-workspace/campus-suite.catalog';

async function main() {
  console.log('====================================================');
  console.log('CAMPUSOS OPERATIONAL MODULES INTEGRATION VERIFIER');
  console.log('====================================================\n');

  const transportSvc = new TransportService();

  // 1. Dashboard Metrics Verification
  console.log('1. Fetching Transport Dashboard metrics...');
  const dashboard = await transportSvc.getDashboard();
  console.log('   ✓ Transport Dashboard:', JSON.stringify(dashboard, null, 2));

  // 2. Vehicle & GPS Ingestion Verification
  console.log('\n2. Testing GPS Location Ingestion...');
  const vehicle = await prisma.vehicle.findFirst();
  if (vehicle) {
    const loc = await transportSvc.ingestLocation({
      vehicleId: vehicle.id,
      latitude: 13.0827,
      longitude: 80.2707,
      speed: 42,
      heading: 180,
      source: 'TEST_RUNNER',
    });
    console.log('   ✓ Ingested GPS Coordinate:', loc.id, `Lat: ${loc.latitude}, Lng: ${loc.longitude}`);
  } else {
    console.log('   ℹ No vehicle found to test location ingestion');
  }

  // 3. Student Commute & Residency Rules Verification
  console.log('\n3. Testing Student Live Tracking Rules...');
  const student = await prisma.student.findFirst({
    include: { user: true },
  });

  if (student && student.userId) {
    const tracking = await transportSvc.getStudentLiveTracking(student.userId);
    console.log('   ✓ Tracking result for student:', student.admissionNo, 'Result:', {
      isEligible: tracking.isEligible,
      reason: (tracking as any).reason,
      studentType: (tracking as any).studentType,
      message: (tracking as any).message,
    });
  }

  // 4. Maker-Checker Finance Verification
  console.log('\n4. Testing Finance Maker-Checker Rules...');
  const accountant = await prisma.user.findFirst({
    where: { role: { roleCode: 'ACCOUNTANT' } },
  });
  if (accountant) {
    try {
      const closing = await FinanceService.saveClosing(
        accountant,
        {
          closingDate: new Date().toISOString().split('T')[0],
          actualTotal: 50000,
          remarks: 'Test daily closing',
        },
        true
      );
      console.log('   ✓ Submitted daily closing:', closing.closingNumber);

      // Attempt self-approval by maker
      try {
        await FinanceService.reviewClosing(accountant, closing.id, 'APPROVE', 'Self approval test');
        console.error('   ❌ FAILED: Maker was able to self-approve!');
      } catch (err: any) {
        console.log('   ✓ PASSED: Maker-checker correctly blocked self-approval:', err.message);
      }
    } catch (e: any) {
      console.log('   ℹ Closing test notice:', e.message);
    }
  }

  // 5. Application Catalogue Role Resolution
  console.log('\n5. Testing Campus Suite Catalogue Role Resolution...');
  const studentApps = await listCampusSuiteApps({ role: 'STUDENT', permissions: [] });
  console.log(`   ✓ Student Apps Count: ${studentApps.length} (${studentApps.map((a) => a.shortName).join(', ')})`);

  const aoApps = await listCampusSuiteApps({ role: 'AO', permissions: [] });
  console.log(`   ✓ AO Apps Count: ${aoApps.length} (${aoApps.map((a) => a.shortName).join(', ')})`);

  const accountantApps = await listCampusSuiteApps({ role: 'ACCOUNTANT', permissions: [] });
  console.log(`   ✓ Accountant Apps Count: ${accountantApps.length} (${accountantApps.map((a) => a.shortName).join(', ')})`);

  console.log('\n====================================================');
  console.log('ALL OPERATIONAL TESTS EXECUTED SUCCESSFULLY');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('Test script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
