import { useEffect, useState } from "react";
import Modal from "../ui/Modal";

export default function RefundModal({ open, onClose, sale, onConfirm, loading, serverError }) {
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("cash");
  const [quantities, setQuantities] = useState({});

  // RefundModal is mounted once by SalesHistoryPage and only its PROPS
  // change thereafter — `sale` toggling between an object and null does
  // NOT unmount this component instance (only a changed `key` or the
  // parent removing the element from its JSX would). So the state above
  // persists across opens. Without this effect, `quantities` defaulted to
  // {} and only a manual per-row edit ever populated it: open the modal,
  // click "Issue refund" without touching anything, and the button was
  // silently disabled (selectedItems empty) — indistinguishable from
  // "refunds don't work" to anyone using it. Re-seeding on every open, to
  // a FULL refund of every remaining unit by default, means one click
  // refunds the whole sale, and reducing a number does a partial one.
  // Keyed on sale?.id (not just `open`) so opening a *different* sale
  // re-seeds correctly too, rather than carrying over the previous sale's
  // edited quantities.
  useEffect(() => {
    if (open && sale) {
      setQuantities(
        Object.fromEntries(
          sale.items.map((item) => [item.id, Number(item.quantity) - Number(item.quantity_refunded)])
        )
      );
      setReason("");
      setRefundMethod("cash");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sale?.id]);

  if (!sale) return null;

  const setQty = (itemId, value, max) =>
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, Math.min(max, Number(value))) }));

  const items = sale.items
    .map((item) => ({ item, remaining: Number(item.quantity) - Number(item.quantity_refunded) }))
    .filter(({ remaining }) => remaining > 0);

  const selectedItems = items
    .map(({ item, remaining }) => ({ sale_item: item.id, quantity: quantities[item.id] || 0, remaining }))
    .filter((i) => i.quantity > 0);

  return (
    <Modal open={open} onClose={onClose} title={`Refund — ${sale.sale_number}`}>
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-ink-700/50">Every item on this sale has already been refunded.</p>
        ) : (
          <div className="space-y-2">
            {items.map(({ item, remaining }) => (
              <div key={item.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.product_name}</p>
                  <p className="text-xs text-ink-700/50">{remaining} available to refund</p>
                </div>
                <input
                  type="number" min="0" max={remaining} step="0.01"
                  value={quantities[item.id] ?? 0}
                  onChange={(e) => setQty(item.id, e.target.value, remaining)}
                  className="w-20 px-2 py-1.5 rounded-lg bg-paper-100 border border-paper-200 text-sm text-right"
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Refund method</label>
          <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="input">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="store_credit">Store Credit</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Reason (optional)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder="e.g. Customer changed mind, damaged item…" />
        </div>

        {serverError && <p className="text-rose-500 text-sm">{JSON.stringify(serverError)}</p>}

        {selectedItems.length === 0 && items.length > 0 && (
          <p className="text-xs text-ink-700/50">Set at least one quantity above 0 to enable the refund.</p>
        )}

        <button
          onClick={() => onConfirm({ reason, refund_method: refundMethod, items: selectedItems })}
          disabled={loading || selectedItems.length === 0}
          className="w-full py-2.5 rounded-lg bg-rose-500 text-white font-medium text-sm hover:bg-rose-500/90 disabled:opacity-50"
        >
          {loading ? "Processing…" : "Issue refund"}
        </button>
      </div>
    </Modal>
  );
}
