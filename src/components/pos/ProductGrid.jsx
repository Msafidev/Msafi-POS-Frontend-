import { LuPackageX, LuPackage, LuTag } from "react-icons/lu";

export default function ProductGrid({ products, isLoading, onAdd }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-paper-200/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-700/40">
        <LuPackageX className="w-8 h-8 mb-2" />
        <p className="text-sm">No products match your search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map((p) => {
        const outOfStock = Number(p.current_stock) <= 0;
        const hasOffer = p.is_offer_active && Number(p.effective_discount_percent) > 0;
        const offerPrice = hasOffer ? p.selling_price * (1 - p.effective_discount_percent / 100) : null;
        return (
          <button
            key={p.id}
            disabled={outOfStock}
            onClick={() => onAdd(p)}
            className={`relative text-left p-3 rounded-xl border transition-all ${
              outOfStock
                ? "bg-paper-100 border-paper-200 opacity-50 cursor-not-allowed"
                : "bg-white border-paper-200 hover:border-till-500 hover:shadow-md active:scale-[0.98]"
            }`}
          >
            {hasOffer && (
              <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-medium bg-mint-500 text-ink-950 rounded-full px-1.5 py-0.5">
                <LuTag className="w-2.5 h-2.5" /> Offer
              </span>
            )}
            {p.image ? (
              <img src={p.image} alt={p.name} className="w-full h-16 object-cover rounded-lg mb-2 bg-paper-100" />
            ) : (
              <div className="w-full h-16 rounded-lg mb-2 bg-paper-100 flex items-center justify-center text-ink-700/20">
                <LuPackage className="w-6 h-6" />
              </div>
            )}
            <p className="font-medium text-sm text-ink-900 line-clamp-2 mb-1">{p.name}</p>
            <p className="text-xs text-ink-700/50 mb-2">{p.sku}</p>
            <div className="flex items-center justify-between">
              {hasOffer ? (
                <span className="flex items-baseline gap-1">
                  <span className="font-display font-semibold text-till-600 text-sm">KES {offerPrice.toFixed(2)}</span>
                  <span className="text-[10px] text-ink-700/40 line-through">{p.selling_price}</span>
                </span>
              ) : (
                <span className="font-display font-semibold text-till-600 text-sm">KES {p.selling_price}</span>
              )}
              <span className={`text-xs ${outOfStock ? "text-rose-500" : "text-ink-700/50"}`}>
                {outOfStock ? "Out of stock" : `${p.current_stock} ${p.unit}`}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
