const TONES = {
  neutral: "bg-paper-200 text-ink-800",
  till: "bg-till-500/15 text-till-600",
  mint: "bg-mint-500/15 text-mint-500",
  rose: "bg-rose-500/15 text-rose-500",
};

export default function Badge({ children, tone = "neutral" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TONES[tone]}`}>
      {children}
    </span>
  );
}
