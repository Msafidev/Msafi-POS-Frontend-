import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/inventory/products", label: "Products" },
  { to: "/inventory/categories", label: "Categories & Brands" },
  { to: "/inventory/stock-movements", label: "Stock Movements" },
  { to: "/inventory/purchase-orders", label: "Purchase Orders" },
];

export default function InventoryLayout() {
  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-paper-200">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive ? "border-till-500 text-ink-900" : "border-transparent text-ink-700/50 hover:text-ink-900"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
