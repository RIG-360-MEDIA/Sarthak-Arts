import Link from "next/link";
import "./not-found.css";

export default function NotFound() {
  return (
    <div className="nf-root">
      <Link href="/" className="nf-brand"><span className="m nf-deva">ॐ</span> Sarthak Arts</Link>

      <div className="nf-in">
        <div className="nf-om nf-deva" aria-hidden="true">ॐ</div>
        <div className="nf-code">Error 404</div>
        <h1 className="nf-title">This corner is empty.</h1>
        <p className="nf-sub">
          The page you&apos;re looking for isn&apos;t here — but every piece still has its place.
          Let&apos;s find yours.
        </p>
        <div className="nf-row">
          <Link href="/collection" className="nf-btn primary">Explore the collection</Link>
          <Link href="/" className="nf-btn ghost">Return home</Link>
        </div>
        <p className="nf-links">
          Or <Link href="/consultation">book a consultation</Link> · <Link href="/home-audit">take the 2-minute audit</Link>
        </p>
      </div>
    </div>
  );
}
