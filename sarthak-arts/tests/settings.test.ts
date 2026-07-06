import { describe, it, expect } from "vitest";
import { parseSetting } from "@/lib/settings";

describe("parseSetting", () => {
  it("returns the value when present", () => {
    expect(parseSetting({ key: "x", value: 42 }, 0)).toBe(42);
  });
  it("returns the fallback when the row is missing", () => {
    expect(parseSetting(null, "fallback")).toBe("fallback");
  });
});
