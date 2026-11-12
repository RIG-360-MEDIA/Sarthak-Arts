CREATE TABLE "ConsultantWeeklyHour" (
  "id" SERIAL PRIMARY KEY,
  "consultantId" INTEGER NOT NULL REFERENCES "Consultant"("id") ON DELETE CASCADE,
  "weekday" INTEGER NOT NULL,
  "time" TEXT NOT NULL,
  CONSTRAINT "ConsultantWeeklyHour_consultantId_weekday_time_key" UNIQUE ("consultantId", "weekday", "time")
);
CREATE TABLE "ConsultantDayOff" (
  "id" SERIAL PRIMARY KEY,
  "consultantId" INTEGER NOT NULL REFERENCES "Consultant"("id") ON DELETE CASCADE,
  "date" TEXT NOT NULL,
  CONSTRAINT "ConsultantDayOff_consultantId_date_key" UNIQUE ("consultantId", "date")
);
