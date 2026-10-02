import { NavLink } from "react-router-dom";
import {
  LuLayoutGrid, LuPackage, LuUsers, LuTruck, LuReceipt,
  LuChartColumn, LuSettings, LuScanBarcode, LuHistory, LuPuzzle, LuX,
} from "react-icons/lu";
import { useAuth } from "../../hooks/useAuth";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LuLayoutGrid, roles: null },
  { to: "/pos", label: "Point of Sale", icon: LuScanBarcode, roles: ["cashier", "manager", "admin", "super_admin"] },
  { to: "/sales", label: "Sales", icon: LuHistory, roles: ["cashier", "manager", "admin", "super_admin"] },
  { to: "/inventory", label: "Inventory", icon: LuPackage, roles: ["store_keeper", "manager", "admin", "super_admin"] },
  { to: "/customers", label: "Customers", icon: LuUsers, roles: ["manager", "admin", "super_admin"] },
  { to: "/suppliers", label: "Suppliers", icon: LuTruck, roles: ["manager", "admin", "super_admin"] },
  { to: "/expenses", label: "Expenses", icon: LuReceipt, roles: ["accountant", "admin", "super_admin"] },
  { to: "/reports", label: "Reports", icon: LuChartColumn, roles: ["accountant", "admin", "super_admin"] },
  { to: "/settings", label: "Settings", icon: LuSettings, roles: ["admin", "super_admin"] },
  { to: "/addons", label: "Add-ons", icon: LuPuzzle, roles: ["admin"] },
  { to: "/addon-verifications", label: "Add-on Verifications", icon: LuPuzzle, roles: ["super_admin"] },
];

function SidebarContents({ items, user, role, onNavigate }) {
  return (
    <>
      <div className="px-6 py-6 border-b border-ink-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-till-500 flex items-center justify-center font-display font-bold text-ink-950">
            $
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">MsafiPOS</span>
        </div>
        {user?.business && (
          <p className="mt-2 text-xs text-paper-200/60 truncate">{user.business.name}</p>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-till-500 text-ink-950 font-medium"
                  : "text-paper-200/80 hover:bg-ink-800 hover:text-paper-50"
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-ink-800 text-xs text-paper-200/50 space-y-1">
        <div>Role: <span className="text-paper-200/90 capitalize">{role?.replace("_", " ")}</span></div>
      </div>
    </>
  );
}

export default function Sidebar({ mobileOpen = false, onMobileClose } = {}) {
  const { role, user } = useAuth();
  const items = NAV.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-ink-950 text-paper-100 h-screen sticky top-0">
        <SidebarContents items={items} user={user} role={role} />
      </aside>

      {/* Mobile drawer — without this there's no way to navigate away from
          whatever route the person landed on when the viewport is narrow. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={onMobileClose} />
          <aside className="absolute inset-y-0 left-0 w-72 flex flex-col bg-ink-950 text-paper-100 shadow-xl">
            <button
              onClick={onMobileClose}
              aria-label="Close menu"
              className="absolute top-4 right-3 p-1.5 rounded-lg text-paper-200/70 hover:bg-ink-900"
            >
              <LuX className="w-5 h-5" />
            </button>
            <SidebarContents items={items} user={user} role={role} onNavigate={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}
