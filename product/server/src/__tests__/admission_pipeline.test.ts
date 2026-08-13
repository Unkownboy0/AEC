import assert from 'assert';

// Mock test suite for paperless admission pipeline
const existingDatabaseRecords = [
  { id: 'app-1', email: 'john.doe@example.com', phone: '9876543210', status: 'CONFIRMED' },
  { id: 'app-2', email: 'jane.smith@example.com', phone: '9876543211', status: 'PENDING' }
];

function checkDuplicateApplicant(email?: string, phone?: string) {
  if (!email && !phone) return { isDuplicate: false };

  const found = existingDatabaseRecords.find(
    (r) =>
      (email && r.email.toLowerCase() === email.toLowerCase()) ||
      (phone && r.phone === phone)
  );

  if (found) {
    return {
      isDuplicate: true,
      message: 'Applicant record with this email/phone already exists.',
      existingId: found.id
    };
  }

  return { isDuplicate: false };
}

function calculateFunnelMetrics(enquiries: number, apps: number, confirmed: number) {
  const totalLeads = enquiries + apps;
  const conversionRate = totalLeads > 0 ? (confirmed / totalLeads) * 100 : 0;
  return {
    totalLeads,
    confirmed,
    conversionRate: Math.round(conversionRate * 10) / 10
  };
}

function generateRollNumber(deptCode: string, year: number, seq: number) {
  const padSeq = String(seq).padStart(3, '0');
  return `${year}-${deptCode.toUpperCase()}-${padSeq}`;
}

// 1. Test Duplicate Applicant Prevention
assert.strictEqual(checkDuplicateApplicant('john.doe@example.com', '0000000000').isDuplicate, true);
assert.strictEqual(checkDuplicateApplicant('new.student@example.com', '9876543210').isDuplicate, true);
assert.strictEqual(checkDuplicateApplicant('fresh.candidate@example.com', '9999988888').isDuplicate, false);

// 2. Test Funnel Analytics Calculation
const funnel = calculateFunnelMetrics(50, 100, 30);
assert.strictEqual(funnel.totalLeads, 150);
assert.strictEqual(funnel.confirmed, 30);
assert.strictEqual(funnel.conversionRate, 20);

// 3. Test Roll / Register Number Generator
assert.strictEqual(generateRollNumber('CSE', 2026, 42), '2026-CSE-042');
assert.strictEqual(generateRollNumber('ECE', 2026, 7), '2026-ECE-007');

console.log('✅ Admission pipeline & auto-provisioning unit tests passed!');
