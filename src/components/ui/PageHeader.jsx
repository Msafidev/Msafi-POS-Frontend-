import { LuPlus, LuSearch } from "react-icons/lu";

export default function PageHeader({ title, subtitle, search, onSearchChange, onAdd, addLabel }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="text-sm text-ink-700/60">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {onSearchChange && (
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-700/40" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search…"
              className="pl-9 pr-3 py-2 rounded-lg bg-white border border-paper-200 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-till-500/40"
            />
          </div>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-till-500 text-ink-950 text-sm font-medium hover:bg-till-400 transition-colors"
          >
            <LuPlus className="w-4 h-4" /> {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}
