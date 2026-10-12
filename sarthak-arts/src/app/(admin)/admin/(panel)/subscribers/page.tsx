import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { Icon } from "../../_ui/icons";
import { ConfirmSubmit } from "../products/DeleteControls";
import { removeSubscriber } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSubscribers({ searchParams }: { searchParams: Promise<{ removed?: string }> }) {
  await requireAdmin();
  const removed = Number((await searchParams).removed ?? 0);
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

      {removed > 0 && (
        <div className="adm-note info" style={{ marginBottom: 16 }}>
          <Icon name="checkCircle" /> Subscriber removed. They won&apos;t be in your next download.
        </div>
      )}

      <div className="adm-table-wrap">
        {subs.length === 0 ? (
          <div className="adm-empty">
            <h3>No subscribers yet</h3>
            <p>Sign-ups from the newsletter boxes on the homepage and footer will appear here.</p>
          </div>
        ) : (
          <div className="adm-table-scroll">
            <table className="adm-table">
              <thead><tr><th>Email</th><th>Joined</th><th className="right" aria-label="Actions" /></tr></thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}>
                    <td className="r-strong">{s.email}</td>
                    <td>{fmt(s.subscribedAt)}</td>
                    <td className="right">
                      <form action={removeSubscriber}>
                        <input type="hidden" name="id" value={s.id} />
                        <ConfirmSubmit className="adm-btn adm-btn-ghost adm-btn-sm" message={`Remove ${s.email} from the monthly note list?`}>
                          Remove
                        </ConfirmSubmit>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
