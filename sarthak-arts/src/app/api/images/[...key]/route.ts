import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

/**
 * Public image server. Streams optimised product images back from the storage
 * layer (local disk in dev, R2/S3 in production). Hard-locked to the `images/`
 * key prefix and path-traversal-guarded, so it can only ever serve public
 * uploads — never private objects such as certificates.
 */
const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", avif: "image/avif",
};

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const rel = key.join("/");
  if (!rel || rel.includes("..")) return new NextResponse("Not found", { status: 404 });

  const ext = rel.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new NextResponse("Not found", { status: 404 });

  try {
    const data = await storage.get(`images/${rel}`);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
