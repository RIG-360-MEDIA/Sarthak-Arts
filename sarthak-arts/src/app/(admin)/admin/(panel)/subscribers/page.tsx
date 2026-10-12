import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { Icon } from "../../_ui/icons";

export const dynamic = "force-dynamic";

export default async function AdminSubscribers() {
  await requireAdmin();
  const subs = await prisma.subscriber.findMany({ orderBy: { subscribedAt: "desc" } });
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1>Subscribers</h1>
          <p className="lead">{subs.length} {subs.length === 1 ? "person has" : "people have"} joined the monthly note. Download the list to send it from Mailchimp, Brevo or Gmail.</p>
        </div>
        {/* A plain link, not <Link>: the browser should download the file, not navigate client-side. */}
        <a href="/api/admin/subscribers" className="adm-btn adm-btn-primary" download><Icon name="check" /> Download CSV</a>
      </div>

      <div className="adm-table-wrap">
        {subs.length === 0 ? (
          <div className="adm-empty">
            <h3>No subscribers yet</h3>
            <p>Sign-ups from the newsletter boxes on the homepage and footer will appear here.</p>
          </div>
        ) : (
          <div className="adm-table-scroll">
            <table className="adm-table">
              <thead><tr><th>Email</th><th>Joined</th></tr></thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}><td className="r-strong">{s.email}</td><td>{fmt(s.subscribedAt)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
