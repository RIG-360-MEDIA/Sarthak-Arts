import fs from "fs/promises";
import path from "path";

export interface Storage {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
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
}

export const storage: Storage = new LocalStorage();
