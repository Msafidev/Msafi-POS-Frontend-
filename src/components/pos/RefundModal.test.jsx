import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, rerender as rtlRerender } from "@testing-library/react";
import RefundModal from "./RefundModal";

const saleA = {
  sale_number: "SALE-000001",
  items: [{ id: "item-a", product_name: "Widget A", quantity: "5.00", quantity_refunded: "0.00" }],
};

const saleB = {
  sale_number: "SALE-000002",
  items: [{ id: "item-b", product_name: "Widget B", quantity: "3.00", quantity_refunded: "1.00" }],
};

describe("RefundModal", () => {
  it("defaults every item's quantity to a full refund, not 0, so one click refunds the whole sale", () => {
    const onConfirm = vi.fn();
    render(<RefundModal open={true} onClose={() => {}} sale={saleA} onConfirm={onConfirm} loading={false} />);

    // Regression: quantities used to default to 0, silently disabling this
    // button until the admin manually typed a number into every row —
    // which looked exactly like "refunds don't work".
    const submitButton = screen.getByRole("button", { name: /issue refund/i });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);
    expect(onConfirm).toHaveBeenCalledWith({
      reason: "",
      refund_method: "cash",
      items: [{ sale_item: "item-a", quantity: 5, remaining: 5 }],
    });
  });

  it("only offers the remaining (not-yet-refunded) quantity as the default", () => {
    render(<RefundModal open={true} onClose={() => {}} sale={saleB} onConfirm={() => {}} loading={false} />);
    expect(screen.getByDisplayValue("2")).toBeInTheDocument(); // 3 sold - 1 already refunded
  });

  it("re-seeds quantities when a different sale is opened, rather than carrying over stale values", () => {
    // RefundModal is mounted once by SalesHistoryPage and only its props
    // change thereafter (it never unmounts just because `sale` toggles to
    // null and back) — so state from a previous sale must not leak into
    // the next one opened.
    const { rerender } = render(
      <RefundModal open={true} onClose={() => {}} sale={saleA} onConfirm={() => {}} loading={false} />
    );
    fireEvent.change(screen.getByDisplayValue("5"), { target: { value: "1" } });
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();

    // Close, then open again for a completely different sale.
    rerender(<RefundModal open={false} onClose={() => {}} sale={null} onConfirm={() => {}} loading={false} />);
    rerender(<RefundModal open={true} onClose={() => {}} sale={saleB} onConfirm={() => {}} loading={false} />);

    expect(screen.getByDisplayValue("2")).toBeInTheDocument(); // saleB's own default, not saleA's edited "1"
  });

  it("disables submit and shows a hint when every item is already fully refunded", () => {
    const fullyRefunded = {
      sale_number: "SALE-000003",
      items: [{ id: "item-c", product_name: "Widget C", quantity: "2.00", quantity_refunded: "2.00" }],
    };
    render(<RefundModal open={true} onClose={() => {}} sale={fullyRefunded} onConfirm={() => {}} loading={false} />);
    expect(screen.getByText(/already been refunded/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /issue refund/i })).toBeDisabled();
  });
});
