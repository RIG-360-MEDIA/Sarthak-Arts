import Link from "next/link";
import { notFound } from "next/navigation";
import "../consultation.css";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const IST = "Asia/Kolkata";

export default async function Confirmed({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const booking = id
    ? await prisma.booking.findUnique({ where: { id: Number(id) }, include: { consultationType: true } })
    : null;
  if (!booking) notFound();

  const when = booking.slotStart.toLocaleString("en-IN", {
    timeZone: IST, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true,
  });

  return (
    <div className="cons-root">
      <div className="cons-confirm">
        <span className="cons-confirm-seal" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <h1 className="serif">Your consultation is booked</h1>
        <p className="cons-confirm-note">A private video-call link will be emailed to you before your slot.</p>

        <div className="cons-confirm-card">
          <div className="cons-confirm-row"><span className="k">Session</span><span className="v">{booking.consultationType.name}</span></div>
          <div className="cons-confirm-row"><span className="k">Duration</span><span className="v">{booking.consultationType.durationMinutes} min · video</span></div>
          <div className="cons-confirm-row"><span className="k">When</span><span className="v">{when} IST</span></div>
          <div className="cons-confirm-row">
            <span className="k">Fee</span>
            <span className="v">
              {booking.paymentStatus === "free"
                ? "Covered by your credit"
                : `${formatMoney(booking.feeMinorAtBooking, "INR")} · payment link to follow`}
            </span>
          </div>
        </div>

        <div className="cons-confirm-sub">What happens next</div>
        <div className="cons-confirm-next">
          <div className="cons-next-item">
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg></span>
            <span><b>Confirmation email</b>Your booking details and a calendar invite are on their way to your inbox.</span>
          </div>
          <div className="cons-next-item">
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 10l5-3v10l-5-3v-4Z" /><rect x="3" y="6" width="12" height="12" rx="2" /></svg></span>
            <span><b>Your private link</b>A secure video-call link will arrive shortly before your slot.</span>
          </div>
          <div className="cons-next-item">
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg></span>
            <span><b>Come prepared</b>Keep your floor plan (or a rough sketch) handy, and note the corners you want guidance on.</span>
          </div>
        </div>

        <div className="cons-confirm-actions">
          <Link href="/collection" className="primary">Explore the collection</Link>
          <Link href="/home-audit" className="ghost">Take the 2-minute audit</Link>
        </div>
      </div>
    </div>
  );
}
