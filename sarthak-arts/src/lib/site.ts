/**
 * The canonical, absolute site URL — used for metadataBase (so og:image and
 * other preview URLs resolve) and JSON-LD. It must point at the *live* origin,
 * or social platforms can't fetch the preview image.
 *
 * In production on Vercel this resolves to the production domain automatically
 * (and to the custom domain, e.g. sarthakarts.com, once that's set as the
 * production domain in Vercel). Override with NEXT_PUBLIC_SITE_URL if needed.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
