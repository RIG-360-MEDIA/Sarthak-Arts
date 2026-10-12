import { describe, it, expect } from "vitest";
import { resolveRole } from "@/lib/roles";

describe("resolveRole", () => {
  it("reads admin and consultant from app_metadata", () => {
    expect(resolveRole({ role: "admin" })).toBe("admin");
    expect(resolveRole({ role: "consultant" })).toBe("consultant");
  });
  it("treats everyone else as a customer", () => {
    expect(resolveRole({})).toBe("customer");
    expect(resolveRole(null)).toBe("customer");
    expect(resolveRole({ role: "superuser" })).toBe("customer");
  });
});
