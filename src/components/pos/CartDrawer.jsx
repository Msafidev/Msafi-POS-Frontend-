import { useEffect } from "react";
import { LuX } from "react-icons/lu";

export default function CartDrawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-ink-950/50" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 top-12 rounded-t-2xl bg-white shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-paper-200 shrink-0">
          <p className="font-display font-semibold text-ink-900">Cart</p>
          <button onClick={onClose} aria-label="Close cart" className="p-1.5 rounded-lg hover:bg-paper-100">
            <LuX className="w-4 h-4 text-ink-700" />
          </button>
        </div>
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}
