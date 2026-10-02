import { describe, it, expect } from "vitest";
import { screen, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CheckoutModal from "./CheckoutModal";

/**
 * CheckoutModal calls useQuery (to fetch active payment providers for the
 * Mobile Money/Card rows), so it needs a QueryClientProvider in scope even
 * though these two tests never touch those rows. Using RTL's `wrapper`
 * option (rather than nesting the provider inside the first render call)
 * means `rerender` re-applies it automatically instead of dropping context
 * on the second render.
 */
function renderModal(ui) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return render(ui, { wrapper });
}

/**
 * Regression test for a real bug: CheckoutModal is mounted once by POSPage
 * and only toggles visibility via `open` (it never remounts). Its default
 * payment amount must therefore re-sync to the *current* total every time
 * it opens — not just reflect whatever `total` was the first time this
 * component ever mounted (which, in practice, was 0 — an empty cart).
 */
describe("CheckoutModal", () => {
  it("shows the current total as the default payment amount when it opens with a non-zero total", () => {
    const { rerender } = renderModal(
      <CheckoutModal open={false} onClose={() => {}} total={0} onConfirm={() => {}} loading={false} />
    );

    // Simulate the real flow: modal mounts once while the cart is empty
    // (total 0), then later opens after the user has added items.
    rerender(<CheckoutModal open={true} onClose={() => {}} total={116} onConfirm={() => {}} loading={false} />);

    const amountInput = screen.getAllByRole("spinbutton")[0];
    expect(amountInput.value).toBe("116.00");
  });

  it("enables Complete Sale once the default amount covers the total", () => {
    const { rerender } = renderModal(
      <CheckoutModal open={false} onClose={() => {}} total={0} onConfirm={() => {}} loading={false} />
    );
    rerender(<CheckoutModal open={true} onClose={() => {}} total={50} onConfirm={() => {}} loading={false} />);

    const button = screen.getByRole("button", { name: /complete sale/i });
    expect(button).not.toBeDisabled();
  });
});
