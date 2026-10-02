import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessesService } from "../../services/businessesService";
import { useAuth } from "../../hooks/useAuth";

const ALL_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "gift_card", label: "Gift Card" },
  { value: "store_credit", label: "Store Credit" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export default function PaymentsReceiptTab() {
  const { user } = useAuth();
  const businessId = user?.business?.id;
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => businessesService.get(businessId),
    enabled: !!businessId,
  });

  const [methods, setMethods] = useState([]);
  const [footer, setFooter] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (data) {
      setMethods(data.enabled_payment_methods || []);
      setFooter(data.receipt_footer_text || "");
      setTheme(data.theme || "light");
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload) => businessesService.update(businessId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business", businessId] }),
  });

  const toggleMethod = (value) =>
    setMethods((prev) => (prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]));

  const save = () => updateMutation.mutate({ enabled_payment_methods: methods, receipt_footer_text: footer, theme });

  if (!data) return <div className="h-64 rounded-2xl bg-paper-200/60 animate-pulse" />;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white rounded-2xl border border-paper-200 p-6">
        <p className="font-medium text-ink-900 mb-3">Accepted payment methods</p>
        <div className="grid grid-cols-2 gap-2">
          {ALL_METHODS.map((m) => (
            <label key={m.value} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={methods.includes(m.value)} onChange={() => toggleMethod(m.value)} className="accent-till-500" />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-paper-200 p-6 space-y-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Receipt footer text</label>
          <input value={footer} onChange={(e) => setFooter(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="input">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>
      </div>

      <button
        onClick={save}
        disabled={updateMutation.isPending}
        className="px-5 py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm hover:bg-till-400 disabled:opacity-60"
      >
        {updateMutation.isPending ? "Saving…" : "Save changes"}
      </button>
      {updateMutation.isSuccess && <p className="text-mint-500 text-sm">Saved.</p>}
    </div>
  );
}
