import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LuSearch, LuShoppingCart } from "react-icons/lu";
import { productsService, categoriesService } from "../../services/inventoryService";
import { customersService } from "../../services/customersService";
import { salesService } from "../../services/salesService";
import { taxService } from "../../services/taxService";
import { addonsService } from "../../services/addonsService";
import ProductGrid from "../../components/pos/ProductGrid";
import CartPanel from "../../components/pos/CartPanel";
import CartDrawer from "../../components/pos/CartDrawer";
import CheckoutModal from "../../components/pos/CheckoutModal";
import ReceiptModal from "../../components/pos/ReceiptModal";
import { computeSaleTotals } from "../../utils/salesMath";

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState([]); // [{ product, quantity, discount_percent }]
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState("");
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const queryClient = useQueryClient();

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", search, category],
    queryFn: () => productsService.list({ search, category, status: "active" }),
  });
  const { data: categoriesData } = useQuery({ queryKey: ["categories"], queryFn: () => categoriesService.list() });
  const { data: customersData } = useQuery({ queryKey: ["customers", ""], queryFn: () => customersService.list() });
  const { data: myAddons } = useQuery({ queryKey: ["my-addons"], queryFn: addonsService.getMyAddons });

  const products = productsData?.results ?? [];
  const categories = categoriesData?.results ?? [];
  const customers = customersData?.results ?? [];

  const totals = useMemo(() => computeSaleTotals(cart, saleDiscount), [cart, saleDiscount]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      const offerDiscount = Number(product.effective_discount_percent) || 0;
      return [...prev, { product, quantity: 1, discount_percent: offerDiscount }];
    });
  };

  const buildItemsPayload = () =>
    cart.map((i) => ({
      product: i.product.id,
      quantity: i.quantity,
      discount_percent: i.discount_percent,
    }));

  const resetCart = () => {
    setCart([]);
    setCustomer(null);
    setNotes("");
    setSaleDiscount(0);
    setCartDrawerOpen(false);
  };

  const handleHold = async () => {
    setError("");
    setBusy(true);
    try {
      await salesService.create({
        status: "held",
        items: buildItemsPayload(),
        discount_amount: saleDiscount,
        customer,
        notes,
      });
      resetCart();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      setError(err.response?.data?.items?.[0] || "Couldn't hold this sale.");
    } finally {
      setBusy(false);
    }
  };

  const handleCheckoutConfirm = async (payments) => {
    setError("");
    setBusy(true);
    try {
      const sale = await salesService.create({
        status: "completed",
        items: buildItemsPayload(),
        discount_amount: saleDiscount,
        customer,
        notes,
        payments,
      });
      setCheckoutOpen(false);
      setReceiptSale(sale);
      resetCart();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });

      // Fire-and-forget: register the sale with KRA eTIMS right away so
      // the receipt's eTIMS section (and the dashboard's eTIMS card)
      // have something to show instead of sitting empty forever. This
      // must never block or fail the sale itself — the sale is already
      // completed and paid for; a KRA/network hiccup here is a
      // compliance follow-up, not a checkout failure.
      if (myAddons?.tax?.active) {
        taxService
          .submitETIMSInvoice(sale.id)
          .catch(() => {})
          .finally(() => {
            queryClient.invalidateQueries({ queryKey: ["etims-invoice", sale.id] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
          });
      }
    } catch (err) {
      setError(err.response?.data?.items?.[0] || err.response?.data?.payments?.[0] || "Checkout failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-4.5rem)] sm:h-[calc(100vh-6rem)]">
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="relative flex-1">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-700/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or scan barcode…"
              autoFocus
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-paper-200 text-sm focus:outline-none focus:ring-2 focus:ring-till-500/40"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-3 sm:mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              category === "" ? "bg-till-500 text-ink-950" : "bg-paper-100 text-ink-700/70"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                category === c.id ? "bg-till-500 text-ink-950" : "bg-paper-100 text-ink-700/70"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-20 lg:pb-1">
          <ProductGrid products={products} isLoading={productsLoading} onAdd={addToCart} />
        </div>
      </div>

      {/* Desktop: cart is always visible as a side panel. */}
      <div className="hidden lg:flex lg:w-96 shrink-0 rounded-2xl border border-paper-200 overflow-hidden">
        <CartPanel
          items={cart}
          onQtyChange={(id, qty) => setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i)))}
          onRemove={(id) => setCart((prev) => prev.filter((i) => i.product.id !== id))}
          onDiscountChange={(id, pct) => setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, discount_percent: pct } : i)))}
          customer={customer}
          customers={customers}
          onCustomerChange={setCustomer}
          notes={notes}
          onNotesChange={setNotes}
          saleDiscount={saleDiscount}
          onSaleDiscountChange={setSaleDiscount}
          totals={totals}
          onHold={handleHold}
          onCheckout={() => setCheckoutOpen(true)}
          canCheckout={cart.length > 0 && !busy}
        />
      </div>
      {error && <p className="hidden lg:block text-rose-500 text-xs">{error}</p>}

      {/* Mobile: cart collapses to a floating bar that opens a bottom-sheet drawer. */}
      {cart.length > 0 && (
        <button
          onClick={() => setCartDrawerOpen(true)}
          className="lg:hidden fixed bottom-4 left-4 right-4 z-30 flex items-center justify-between px-4 py-3.5 rounded-2xl bg-ink-950 text-paper-50 shadow-lg"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <LuShoppingCart className="w-4 h-4" />
            {cart.length} item{cart.length > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-2 text-sm">
            <span className="font-display font-semibold">KES {totals.total.toFixed(2)}</span>
            <span className="text-paper-200/60">View cart →</span>
          </span>
        </button>
      )}

      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)}>
        <CartPanel
          items={cart}
          onQtyChange={(id, qty) => setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i)))}
          onRemove={(id) => setCart((prev) => prev.filter((i) => i.product.id !== id))}
          onDiscountChange={(id, pct) => setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, discount_percent: pct } : i)))}
          customer={customer}
          customers={customers}
          onCustomerChange={setCustomer}
          notes={notes}
          onNotesChange={setNotes}
          saleDiscount={saleDiscount}
          onSaleDiscountChange={setSaleDiscount}
          totals={totals}
          onHold={handleHold}
          onCheckout={() => setCheckoutOpen(true)}
          canCheckout={cart.length > 0 && !busy}
        />
        {error && <p className="text-rose-500 text-xs px-4 pb-3">{error}</p>}
      </CartDrawer>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={totals.total}
        onConfirm={handleCheckoutConfirm}
        loading={busy}
      />

      <ReceiptModal open={!!receiptSale} onClose={() => setReceiptSale(null)} sale={receiptSale} />
    </div>
  );
}
