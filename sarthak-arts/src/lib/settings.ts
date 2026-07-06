import { prisma } from "@/lib/db";

export function parseSetting<T>(row: { key: string; value: unknown } | null, fallback: T): T {
  if (!row || row.value === null || row.value === undefined) return fallback;
  return row.value as T;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return parseSetting(row, fallback);
}
