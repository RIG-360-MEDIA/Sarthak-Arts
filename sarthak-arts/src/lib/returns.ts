export function canReturn(o: {
  statusCode: string;
  deliveredAt: Date | null;
  windowDays: number;
  now: Date;
  isFinalSale: boolean;
  alreadyRequested: boolean;
}): boolean {
  if (o.statusCode !== "delivered" || !o.deliveredAt) return false;
  if (o.isFinalSale || o.alreadyRequested) return false;
  const ageMs = o.now.getTime() - o.deliveredAt.getTime();
  return ageMs <= o.windowDays * 86_400_000;
}
