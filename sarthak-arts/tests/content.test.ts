import { describe, it, expect } from "vitest";
import { pickBlock } from "@/lib/content";

describe("pickBlock", () => {
  it("returns the block when present", () => {
    expect(pickBlock({ key: "about.body", title: "T", body: "B" }, "fallback")).toEqual({ title: "T", body: "B" });
  });
  it("returns a fallback body when absent", () => {
    expect(pickBlock(null, "Coming soon.")).toEqual({ title: null, body: "Coming soon." });
  });
});
