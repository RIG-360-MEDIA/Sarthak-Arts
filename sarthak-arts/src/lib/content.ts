import { prisma } from "@/lib/db";

export function pickBlock(
  row: { key: string; title: string | null; body: string } | null,
  fallbackBody: string,
): { title: string | null; body: string } {
  if (!row) return { title: null, body: fallbackBody };
  return { title: row.title, body: row.body };
}

export async function getBlock(key: string, fallbackBody = ""): Promise<{ title: string | null; body: string }> {
  const row = await prisma.contentBlock.findUnique({ where: { key } });
  return pickBlock(row, fallbackBody);
}

export async function getBlocksByPrefix(prefix: string) {
  return prisma.contentBlock.findMany({ where: { key: { startsWith: prefix } }, orderBy: { key: "asc" } });
}
