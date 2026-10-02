export default function StatCard({ label, value, accent = "till", icon: Icon }) {
  const accents = {
    till: "bg-till-500/10 text-till-600",
    mint: "bg-mint-500/10 text-mint-500",
    rose: "bg-rose-500/10 text-rose-500",
  };
  return (
    <div className="bg-white rounded-2xl border border-paper-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-ink-700/60 uppercase tracking-wide">{label}</span>
        {Icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${accents[accent]}`}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <p className="font-display text-2xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}
