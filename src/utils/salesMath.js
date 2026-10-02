/**
 * Mirrors the backend's SaleCreateSerializer.create() total calculation
 * (apps/sales/serializers.py) so the POS screen's live preview matches
 * what the server will actually charge. Kept as a pure function — no
 * React, no API calls — so it's trivially unit-testable and reusable
 * anywhere a cart needs a total (POS screen today; a future quote/
 * invoice screen tomorrow).
 *
 * @param {Array<{product: {selling_price: number|string, tax_percent: number|string}, quantity: number, discount_percent: number}>} items
 * @param {number} saleDiscount - flat currency-amount discount applied after line totals, before tax
 */
export function computeSaleTotals(items, saleDiscount = 0) {
  let subtotal = 0;
  let tax = 0;

  for (const item of items) {
    const gross = item.quantity * Number(item.product.selling_price);
    const discount = gross * (item.discount_percent / 100);
    const taxable = gross - discount;
    subtotal += taxable;
    tax += taxable * (Number(item.product.tax_percent) / 100);
  }

  const total = Math.max(0, subtotal - saleDiscount + tax);
  return { subtotal, tax, total };
}
