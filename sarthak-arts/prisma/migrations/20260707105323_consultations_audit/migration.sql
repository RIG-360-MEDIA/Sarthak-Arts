-- CreateTable
CREATE TABLE "ConsultationType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "feeMinor" INTEGER NOT NULL,
    "creditsTowardOrder" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConsultationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Consultant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultantType" (
    "consultantId" INTEGER NOT NULL,
    "consultationTypeId" INTEGER NOT NULL,

    CONSTRAINT "ConsultantType_pkey" PRIMARY KEY ("consultantId","consultationTypeId")
);

-- CreateTable
CREATE TABLE "ConsultantAvailability" (
    "id" SERIAL NOT NULL,
    "consultantId" INTEGER NOT NULL,
    "slotStart" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "ConsultantAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "consultantId" INTEGER NOT NULL,
    "consultationTypeId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "slotStart" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'booked',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "feeMinorAtBooking" INTEGER NOT NULL,
    "videoLink" TEXT,
    "entitlementId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationEntitlement" (
    "id" SERIAL NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "sourceOrderId" INTEGER,
    "consultationTypeId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unused',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditQuestion" (
    "id" SERIAL NOT NULL,
    "prompt" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AuditQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditAnswerRule" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answerText" TEXT NOT NULL,
    "mapsToDirection" TEXT,
    "recommendConsult" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AuditAnswerRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationType_code_key" ON "ConsultationType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_entitlementId_key" ON "Booking"("entitlementId");

-- AddForeignKey
ALTER TABLE "ConsultantType" ADD CONSTRAINT "ConsultantType_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultantType" ADD CONSTRAINT "ConsultantType_consultationTypeId_fkey" FOREIGN KEY ("consultationTypeId") REFERENCES "ConsultationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultantAvailability" ADD CONSTRAINT "ConsultantAvailability_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_consultationTypeId_fkey" FOREIGN KEY ("consultationTypeId") REFERENCES "ConsultationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "ConsultationEntitlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationEntitlement" ADD CONSTRAINT "ConsultationEntitlement_consultationTypeId_fkey" FOREIGN KEY ("consultationTypeId") REFERENCES "ConsultationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditAnswerRule" ADD CONSTRAINT "AuditAnswerRule_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AuditQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
