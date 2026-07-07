import { describe, it, expect } from "vitest";
import { pickStorageDriver } from "@/lib/storage";

describe("pickStorageDriver", () => {
  it("defaults to local disk", () => {
    expect(pickStorageDriver({} as NodeJS.ProcessEnv)).toBe("local");
  });
  it("selects s3 only when explicitly set", () => {
    expect(pickStorageDriver({ STORAGE_DRIVER: "s3" } as unknown as NodeJS.ProcessEnv)).toBe("s3");
  });
  it("treats any other value as local", () => {
    expect(pickStorageDriver({ STORAGE_DRIVER: "gcs" } as unknown as NodeJS.ProcessEnv)).toBe("local");
  });
});
