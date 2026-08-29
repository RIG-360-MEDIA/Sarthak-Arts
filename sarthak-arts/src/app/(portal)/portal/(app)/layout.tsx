import { redirect } from "next/navigation";
import "@/app/(admin)/admin/admin.css";
import "../portal.css";
import { prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { PortalNav } from "./PortalNav";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/portal/login");
  const consultant = await prisma.consultant.findFirst({ where: { userId: session.userId }, select: { name: true } });

  return (
    <div className="admin portal">
      <PortalNav name={consultant?.name ?? ""} />
      <main>{children}</main>
    </div>
  );
}
