import "server-only";
import sharp from "sharp";
import { storage } from "@/lib/storage";

/**
 * Image uploads for the admin.
 *
 * Files are optimised to WebP and written through the shared `storage` layer,
 * so they work identically in dev (local disk) and in production (Cloudflare R2
 * / S3, when STORAGE_DRIVER=s3) — nothing here needs to change to deploy.
 *
 * Stored under the `images/` key prefix and served back publicly through
 * `/api/images/<path>` (which is locked to that prefix, so it can never reach
 * private objects like certificates).
 */
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per photo
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const PUBLIC_PREFIX = "/api/images/";
const KEY_PREFIX = "images/";

export type SavedImage = { url: string; width: number; height: number };

/** Validate, optimise and persist one uploaded image. `folder` e.g. "products/12". */
export async function saveImage(file: File, folder: string): Promise<SavedImage> {
  if (!file || file.size === 0) throw new Error("No file was uploaded.");
  if (file.size > MAX_BYTES) throw new Error("That image is larger than 8 MB — please use a smaller file.");
  if (file.type && !ALLOWED.includes(file.type)) throw new Error("Please upload a JPG, PNG or WebP image.");

  const input = Buffer.from(await file.arrayBuffer());
  const pipeline = sharp(input).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 });
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "");
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const relPath = `${safeFolder}/${name}`;

  await storage.put(`${KEY_PREFIX}${relPath}`, data);
  return { url: `${PUBLIC_PREFIX}${relPath}`, width: info.width, height: info.height };
}

/** Map a public image URL back to its storage key, or null if it isn't one of ours. */
export function storageKeyFromImageUrl(url: string): string | null {
  if (!url.startsWith(PUBLIC_PREFIX)) return null;
  const rel = url.slice(PUBLIC_PREFIX.length);
  if (rel.includes("..")) return null;
  return `${KEY_PREFIX}${rel}`;
}

/** Delete a stored image by its public URL (best-effort). */
export async function deleteImageByUrl(url: string): Promise<void> {
  const key = storageKeyFromImageUrl(url);
  if (key) await storage.del(key);
}
