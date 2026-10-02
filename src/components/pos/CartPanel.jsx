import { LuMinus, LuPlus, LuTrash2, LuUserRound, LuShoppingCart } from "react-icons/lu";

export default function CartPanel({
  items, onQtyChange, onRemove, onDiscountChange,
  customer, customers, onCustomerChange,
  notes, onNotesChange,
  saleDiscount, onSaleDiscountChange,
  totals,
  onHold, onCheckout, canCheckout,
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-paper-200">
        <label className="flex items-center gap-2 text-xs text-ink-700/60 mb-1.5">
          <LuUserRound className="w-3.5 h-3.5" /> Customer
        </label>
        <select
          value={customer || ""}
          onChange={(e) => onCustomerChange(e.target.value || null)}
          className="input"
        >
          <option value="">Walk-in customer</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col">
        {items.length === 0 ? (
          <p className="text-sm text-ink-700/40 text-center py-12">Cart is empty — tap a product to add it.</p>
        ) : (
          <>
            <div className="divide-y divide-paper-100">
              {items.map((item) => (
                <div key={item.product.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-ink-700/50">KES {item.product.selling_price} each</p>
                    </div>
                    <button onClick={() => onRemove(item.product.id)} className="p-1 text-ink-700/30 hover:text-rose-500 shrink-0">
                      <LuTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onQtyChange(item.product.id, Math.max(1, item.quantity - 1))}
                        className="w-7 h-7 rounded-lg bg-paper-100 flex items-center justify-center hover:bg-paper-200"
                      >
                        <LuMinus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => onQtyChange(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-paper-100 flex items-center justify-center hover:bg-paper-200"
                      >
                        <LuPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" min="0" max="100"
                        value={item.discount_percent}
                        onChange={(e) => onDiscountChange(item.product.id, Number(e.target.value))}
                        className="w-14 px-2 py-1 rounded-lg bg-paper-100 border border-paper-200 text-xs text-right"
                      />
                      <span className="text-xs text-ink-700/50">% off</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fills whatever room is left below the items so the footer
                (Notes/Total/Charge) always sits at the same spot at the
                bottom of the panel regardless of cart size — that's
                deliberate, not a bug, so cashiers build muscle memory for
                exactly where "Charge" is. This just gives that leftover
                space a visible purpose instead of looking like blank,
                unfinished UI when the cart only has a couple of items. */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-ink-700/15 min-h-8">
              <LuShoppingCart className="w-5 h-5" />
              <p className="text-[11px]">Tap a product to add more</p>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-paper-200 px-4 py-3 space-y-3">
        <div>
          <label className="block text-xs text-ink-700/60 mb-1">Notes</label>
          <input value={notes} onChange={(e) => onNotesChange(e.target.value)} className="input" placeholder="Optional note on this sale…" />
        </div>

        <div className="flex items-center justify-between text-xs text-ink-700/60">
          <span>Sale-level discount (KES)</span>
          <input
            type="number" min="0"
            value={saleDiscount}
            onChange={(e) => onSaleDiscountChange(Number(e.target.value))}
            className="w-24 px-2 py-1 rounded-lg bg-paper-100 border border-paper-200 text-xs text-right"
          />
        </div>

        <div className="space-y-1 text-sm pt-1 border-t border-paper-100">
          <div className="flex justify-between text-ink-700/60"><span>Subtotal</span><span>KES {totals.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-ink-700/60"><span>Tax</span><span>KES {totals.tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-display font-semibold text-ink-900 text-base pt-1">
            <span>Total</span><span>KES {totals.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onHold}
            disabled={items.length === 0}
            className="py-2.5 rounded-lg border border-paper-200 text-sm font-medium text-ink-900 hover:bg-paper-100 disabled:opacity-40"
          >
            Hold sale
          </button>
          <button
            onClick={onCheckout}
            disabled={!canCheckout}
            className="py-2.5 rounded-lg bg-till-500 text-ink-950 text-sm font-semibold hover:bg-till-400 disabled:opacity-40"
          >
            Charge
          </button>
        </div>
      </div>
    </div>
  );
}
