import { prisma } from '../lib/prisma';
import { env } from '../config/env';

const INVOICE = 'QA-DEMO-INR-1300';

async function run() {
  if (env.NODE_ENV === 'production' || env.PAYMENT_GATEWAY !== 'DEMO_PAYMENT') {
    throw new Error('Demo fixture requires NODE_ENV=test and PAYMENT_GATEWAY=DEMO_PAYMENT');
  }
  const student = await prisma.student.findFirst({ where: { status: 'ACTIVE', deleted: false, userId: { not: null } }, include: { semester: true }, orderBy: { admissionNo: 'asc' } });
  if (!student) throw new Error('No seeded active student with a user account is available');
  const category = await prisma.feeCategory.upsert({
    where: { name: 'QA Demo Payment Fee' },
    update: { amount: 1300, status: 'ACTIVE', deleted: false, archived: false },
    create: { name: 'QA Demo Payment Fee', description: 'Isolated deterministic release-gate fixture', amount: 1300 },
  });
  const bill = await prisma.feeBill.upsert({
    where: { invoiceNumber: INVOICE },
    update: { studentId: student.id, categoryId: category.id, amount: 1300, paidAmount: 0, fine: 0, scholarshipDiscount: 0, status: 'PENDING', paymentHistory: '[]', academicYearLabel: '2026-2027', semesterLabel: student.semester.name, deleted: false, archived: false, allowPartialPayment: false },
    create: { invoiceNumber: INVOICE, studentId: student.id, categoryId: category.id, amount: 1300, paidAmount: 0, billingDate: new Date('2026-08-19T00:00:00.000Z'), dueDate: new Date('2026-08-31T00:00:00.000Z'), academicYearLabel: '2026-2027', semesterLabel: student.semester.name, allowPartialPayment: false },
  });
  const previousPayments = await prisma.feePayment.findMany({ where: { billId: bill.id }, select: { id: true } });
  const paymentIds = previousPayments.map((item) => item.id);
  if (paymentIds.length) {
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { relatedEntityType: 'FEE_PAYMENT', relatedEntityId: { in: paymentIds } } }),
      prisma.auditLog.deleteMany({ where: { entityType: 'FEE_PAYMENT', entityId: { in: paymentIds } } }),
      prisma.financeLedgerEntry.deleteMany({ where: { paymentId: { in: paymentIds } } }),
      prisma.feePayment.deleteMany({ where: { id: { in: paymentIds } } }),
    ]);
  }
  await prisma.feeBill.update({ where: { id: bill.id }, data: { paidAmount: 0, status: 'PENDING', paymentHistory: '[]' } });
  console.log(JSON.stringify({ studentId: student.id, userId: student.userId, billId: bill.id, invoiceNumber: INVOICE, outstanding: 1300, gateway: env.PAYMENT_GATEWAY }, null, 2));
}

run().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
