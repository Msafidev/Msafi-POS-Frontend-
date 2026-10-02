import { describe, it, expect } from "vitest";
import { computeSaleTotals } from "./salesMath";

const widget = { selling_price: "50.00", tax_percent: "16" };

describe("computeSaleTotals", () => {
  it("returns zeroed totals for an empty cart", () => {
    expect(computeSaleTotals([], 0)).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });

  it("computes subtotal, tax, and total for a simple line item", () => {
    const result = computeSaleTotals([{ product: widget, quantity: 2, discount_percent: 0 }], 0);
    // 2 * 50 = 100 subtotal, 16% tax = 16, total = 116
    expect(result.subtotal).toBeCloseTo(100);
    expect(result.tax).toBeCloseTo(16);
    expect(result.total).toBeCloseTo(116);
  });

  it("applies a per-line discount before computing tax", () => {
    // 2 * 50 = 100 gross, 10% line discount = 10, taxable = 90, tax = 14.4
    const result = computeSaleTotals([{ product: widget, quantity: 2, discount_percent: 10 }], 0);
    expect(result.subtotal).toBeCloseTo(90);
    expect(result.tax).toBeCloseTo(14.4);
    expect(result.total).toBeCloseTo(104.4);
  });

  it("subtracts a flat sale-level discount after subtotal, before adding tax", () => {
    // subtotal 100, tax 16, minus a flat 20 sale-level discount = 96
    const result = computeSaleTotals([{ product: widget, quantity: 2, discount_percent: 0 }], 20);
    expect(result.total).toBeCloseTo(96);
  });

  it("never returns a negative total even if the discount exceeds the subtotal", () => {
    const result = computeSaleTotals([{ product: widget, quantity: 1, discount_percent: 0 }], 9999);
    expect(result.total).toBe(0);
  });

  it("sums multiple line items with different tax rates independently", () => {
    const noTaxItem = { selling_price: "20.00", tax_percent: "0" };
    const result = computeSaleTotals(
      [
        { product: widget, quantity: 1, discount_percent: 0 },
        { product: noTaxItem, quantity: 1, discount_percent: 0 },
      ],
      0
    );
    expect(result.subtotal).toBeCloseTo(70); // 50 + 20
    expect(result.tax).toBeCloseTo(8); // only widget's 16% of 50
    expect(result.total).toBeCloseTo(78);
  });
});
