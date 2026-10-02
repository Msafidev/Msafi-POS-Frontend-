import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Badge from "./Badge";

describe("Badge", () => {
  it("renders its children text", () => {
    render(<Badge>Low stock</Badge>);
    expect(screen.getByText("Low stock")).toBeInTheDocument();
  });

  it("defaults to the neutral tone class", () => {
    render(<Badge>Neutral</Badge>);
    expect(screen.getByText("Neutral").className).toContain("bg-paper-200");
  });

  it("applies the rose tone class when specified", () => {
    render(<Badge tone="rose">Refunded</Badge>);
    expect(screen.getByText("Refunded").className).toContain("bg-rose-500");
  });
});
