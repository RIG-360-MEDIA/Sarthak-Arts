import { describe, it, expect } from "vitest";
import { buildProductWhere, buildSearchWhere } from "@/lib/catalog";

describe("buildProductWhere", () => {
  it("filters to live products by default with no filters", () => {
    expect(buildProductWhere({})).toEqual({ status: "live" });
  });
  it("filters by category code", () => {
    expect(buildProductWhere({ category: "kalash" })).toEqual({
      status: "live",
      category: { code: "kalash" },
    });
  });
  it("filters by direction code via the join", () => {
    expect(buildProductWhere({ direction: "north" })).toEqual({
      status: "live",
      directions: { some: { direction: { code: "north" } } },
    });
  });
  it("filters by metal code via composition", () => {
    expect(buildProductWhere({ metal: "silver" })).toEqual({
      status: "live",
      composition: { some: { metal: { code: "silver" } } },
    });
  });
  it("filters by a price ceiling in minor units", () => {
    expect(buildProductWhere({ maxPriceMinor: 2000000 })).toEqual({
      status: "live",
      basePriceMinor: { lte: 2000000 },
    });
  });
  it("combines multiple filters", () => {
    expect(buildProductWhere({ direction: "north", metal: "silver" })).toEqual({
      status: "live",
      directions: { some: { direction: { code: "north" } } },
      composition: { some: { metal: { code: "silver" } } },
    });
  });
});

describe("buildSearchWhere", () => {
  it("returns only the live filter for an empty term", () => {
    expect(buildSearchWhere("  ")).toEqual({ status: "live" });
  });
  it("builds a case-insensitive OR across name/positioning/description", () => {
    expect(buildSearchWhere("kalash")).toEqual({
      status: "live",
      OR: [
        { name: { contains: "kalash", mode: "insensitive" } },
        { positioningLine: { contains: "kalash", mode: "insensitive" } },
        { description: { contains: "kalash", mode: "insensitive" } },
      ],
    });
  });
});
