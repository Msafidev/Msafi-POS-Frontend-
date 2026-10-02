import { useState } from "react";
import { LuChevronDown, LuLogOut, LuMenu, LuSearch } from "react-icons/lu";
import { useAuth } from "../../hooks/useAuth";
import NotificationsDropdown from "./NotificationsDropdown";

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-paper-50/90 backdrop-blur border-b border-paper-200">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-paper-100 shrink-0"
      >
        <LuMenu className="w-5 h-5 text-ink-900" />
      </button>

      <div className="flex-1 max-w-md relative hidden sm:block">
        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-700/50" />
        <input
          type="text"
          placeholder="Search products, customers, invoices…"
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-paper-100 border border-paper-200 text-sm placeholder:text-ink-700/40 focus:outline-none focus:ring-2 focus:ring-till-500/40"
        />
      </div>

      <div className="flex items-center gap-3">
        <NotificationsDropdown />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-paper-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-till-500/20 border border-till-500/40 flex items-center justify-center font-display font-semibold text-till-600 text-sm">
              {(user?.first_name?.[0] || user?.username?.[0] || "?").toUpperCase()}
            </div>
            <span className="text-sm font-medium hidden sm:block">
              {user?.first_name || user?.username}
            </span>
            <LuChevronDown className="w-4 h-4 text-ink-700/60" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-paper-200 py-1">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-500 hover:bg-paper-100"
              >
                <LuLogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
