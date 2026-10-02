export default function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <h3 className="font-display font-semibold text-ink-900 mb-1">{title}</h3>
      <p className="text-sm text-ink-700/50 max-w-sm mb-4">{message}</p>
      {action}
    </div>
  );
}
