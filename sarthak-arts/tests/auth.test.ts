import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "@/lib/auth";

describe("admin session", () => {
  it("verifies what it signs", async () => {
    const token = await signSession({ userId: 1, role: "admin" }, "test-secret-at-least-32-characters!!");
    const payload = await verifySession(token, "test-secret-at-least-32-characters!!");
    expect(payload?.userId).toBe(1);
  });
  it("rejects a token signed with another secret", async () => {
    const token = await signSession({ userId: 1, role: "admin" }, "test-secret-at-least-32-characters!!");
    expect(await verifySession(token, "another-secret-also-32-characters!!!")).toBeNull();
  });
});
