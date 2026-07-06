import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Mandala } from "@/components/Mandala";

const dirs = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ code: `d${i}`, name: `D${i}` }));

describe("Mandala", () => {
  it("renders one wedge per direction", () => {
    const { container } = render(<Mandala size={100} directions={dirs(8)} />);
    expect(container.querySelectorAll("path[data-wedge]").length).toBe(8);
  });
  it("renders 5 wedges for 5 directions", () => {
    const { container } = render(<Mandala size={100} directions={dirs(5)} />);
    expect(container.querySelectorAll("path[data-wedge]").length).toBe(5);
  });
});
