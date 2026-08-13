ALTER TABLE "fee_bills"
  ADD COLUMN "invoiceNumber" TEXT,
  ADD COLUMN "academicYearLabel" TEXT,
  ADD COLUMN "semesterLabel" TEXT,
  ADD COLUMN "allowPartialPayment" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "fee_bills_invoiceNumber_key" ON "fee_bills"("invoiceNumber");

CREATE TABLE "fee_payments" (
  "id" TEXT NOT NULL,
  "receiptNumber" TEXT,
  "transactionId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "provider" TEXT,
  "providerOrderId" TEXT,
  "providerPaymentId" TEXT,
  "externalReference" TEXT,
  "proofUrl" TEXT,
  "paymentDate" TIMESTAMP(3),
  "remarks" TEXT,
  "rejectionReason" TEXT,
  "verifiedByUserId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "idempotencyKey" TEXT,
  "metadataJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "billId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fee_payments_receiptNumber_key" ON "fee_payments"("receiptNumber");
CREATE UNIQUE INDEX "fee_payments_transactionId_key" ON "fee_payments"("transactionId");
CREATE UNIQUE INDEX "fee_payments_providerOrderId_key" ON "fee_payments"("providerOrderId");
CREATE UNIQUE INDEX "fee_payments_providerPaymentId_key" ON "fee_payments"("providerPaymentId");
CREATE UNIQUE INDEX "fee_payments_idempotencyKey_key" ON "fee_payments"("idempotencyKey");
CREATE INDEX "fee_payments_billId_status_idx" ON "fee_payments"("billId", "status");
CREATE INDEX "fee_payments_studentId_createdAt_idx" ON "fee_payments"("studentId", "createdAt");
CREATE INDEX "fee_payments_status_source_idx" ON "fee_payments"("status", "source");
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_billId_fkey" FOREIGN KEY ("billId") REFERENCES "fee_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
