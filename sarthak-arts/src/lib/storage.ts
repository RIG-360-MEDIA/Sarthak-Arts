import fs from "fs/promises";
import path from "path";

export interface Storage {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  del(key: string): Promise<void>;
}

/** Choose the storage driver from the environment. Local disk unless S3 is explicitly selected. */
export function pickStorageDriver(env: NodeJS.ProcessEnv): "s3" | "local" {
  return env.STORAGE_DRIVER === "s3" ? "s3" : "local";
}

class LocalStorage implements Storage {
  private dir = process.env.STORAGE_DIR ?? ".storage";
  async put(key: string, data: Buffer): Promise<void> {
    const file = path.join(this.dir, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
  }
  async get(key: string): Promise<Buffer> {
    return fs.readFile(path.join(this.dir, key));
  }
  async del(key: string): Promise<void> {
    await fs.rm(path.join(this.dir, key), { force: true });
  }
}

/**
 * S3-compatible object storage — works with Cloudflare R2 or Amazon S3.
 * The SDK is lazy-imported so local/dev and the test run never load it.
 * For R2, set S3_ENDPOINT to the account endpoint; for S3, leave it unset.
 */
class S3Storage implements Storage {
  private bucket = process.env.S3_BUCKET!;
  private async client() {
    const { S3Client } = await import("@aws-sdk/client-s3");
    return new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT), // Supabase Storage requires path-style URLs
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  async put(key: string, data: Buffer): Promise<void> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await (await this.client()).send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data }));
  }
  async get(key: string): Promise<Buffer> {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const res = await (await this.client()).send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }
  async del(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await (await this.client()).send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

function makeStorage(): Storage {
  return pickStorageDriver(process.env) === "s3" ? new S3Storage() : new LocalStorage();
}

export const storage: Storage = makeStorage();
