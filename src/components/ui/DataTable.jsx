/**
 * Deliberately minimal — no virtualization, no built-in sort/filter state.
 * `columns`: [{ header, accessor: (row) => node, key }]
 * Server-side pagination/search/ordering already exists on every Phase 2
 * endpoint (DRF filter backends); this component only renders what it's given.
 */
export default function DataTable({ columns, rows, rowKey, isLoading, emptyState }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-paper-200/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return emptyState || null;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-paper-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-paper-100 text-left text-xs text-ink-700/60 uppercase tracking-wide">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-paper-200 bg-white">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-paper-50/80 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-ink-900">{col.accessor(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
