export default function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="font-display text-xl font-semibold text-ink-900 mb-2">{title}</h1>
      <p className="text-sm text-ink-700/50 max-w-sm">
        This module ships in a later phase of the build. Come back once its
        backend app is wired up.
      </p>
    </div>
  );
}
