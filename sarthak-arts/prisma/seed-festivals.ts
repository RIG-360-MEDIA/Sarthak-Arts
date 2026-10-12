import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedFestivals } from "./festivals";

// Refresh festival dates only (safe on the live database: no logins, products or settings touched).
const db = new PrismaClient();
seedFestivals(db).finally(() => db.$disconnect());
